/**
 * The plans, the AI credits and what every paid model costs us: the one
 * table the function enforces (netlify/functions/api.mjs), the ad library
 * reads (netlify/lib/adlibrary.mjs), billing sells (netlify/lib/billing.mjs)
 * and scripts/plan_economics.mjs checks. The browser's copy is PLANS in
 * app.js (display only, between PLANS:BEGIN and PLANS:END); the check holds
 * the two to the same numbers.
 *
 * Owner, 2026-10-08: "isn't really built around cost effectiveness and
 * profitability" and "Token or credits? That way if we use real paid models,
 * we can make sure the cost of it is still profitable."
 *
 * Two meters, because two kinds of thing cost us differently:
 *  - DOWNLOADS (photos and videos). Both are drawn and encoded in the
 *    customer's browser; a download costs us one function call and a few
 *    bytes of Blobs. They are counted per plan as a value fence, not charged.
 *  - AI CREDITS. Anything that calls a paid model. One credit buys up to
 *    CREDIT_USD of model cost and an action costs
 *    ceil(model cost / CREDIT_USD) credits, so a pricier model is a pricier
 *    action without anyone re-deciding the plans, and a model with no price
 *    here (or in the MODEL_COSTS env) cannot be sold at all.
 *
 * Each plan's credits are sized so that a customer who spends every one
 * still leaves the plan above TARGETS.planMargin after Stripe's cut;
 * scripts/plan_economics.mjs fails if any plan, interval or pack slips.
 */

/** What one credit is allowed to cost us, in dollars of model spend. */
export const CREDIT_USD = 0.04;

/** Per call, in dollars, the higher figure where sources disagree
 *  (docs/SAAS-AUDIT-2026-10-05.md, OPEN-ITEMS §AS). Add a model here, or in
 *  the MODEL_COSTS env as JSON ({"model-id": 0.05}), before selling it. */
export const MODEL_COST_USD = {
  'gemini-3.1-flash-lite-image': 0.034,  // the AI background default, 1K
  'gemini-2.5-flash-image': 0.039,       // 1024x1024, flat
  'gemini-3.1-flash-image': 0.068,       // 1K (Vertex lists $0.0672)
  'gemini-3-pro-image': 0.134,           // 1K to 2K
  'gemini-3-pro-image-preview': 0.134,
  'fal-seedream-v4': 0.03,               // fal Seedream v4 text-to-image, 2048 square
  'fal-seedream-v4-edit': 0.03,          // fal Seedream v4 edit: the generator's products as reference photos (bggen.mjs)
};

/** Prices in cents. `weekly`/`monthly` are downloads (photos or videos);
 *  `credits` are AI credits a calendar month; `library` is ads saved. */
export const PLANS = {
  free: {
    label: 'Free', price: { month: 0 },
    weekly: 3, monthly: null, maxPx: 1080, watermark: true,
    credits: 5, library: 12, allDesigns: false, qr: false,
  },
  pro: {
    label: 'Pro', price: { month: 2500, year: 25000 },
    weekly: null, monthly: 100, maxPx: 2160, watermark: false,
    credits: 75, library: 300, allDesigns: true, qr: true,
  },
  business: {
    label: 'Business', price: { month: 6000, year: 60000 },
    weekly: null, monthly: 500, maxPx: 2160, watermark: false,
    credits: 200, library: 1000, allDesigns: true, qr: true,
  },
};
/** names an account may still carry from before */
const LEGACY = { starter: 'pro' };
export const planId = (p) => (PLANS[p] ? p : LEGACY[p] || 'free');
export const PAID = Object.keys(PLANS).filter((id) => id !== 'free');

/** One-off AI credit packs, any signed-in account. Never expire; spent after
 *  the month's plan credits. */
export const PACKS = {
  credits100: { label: '100 AI credits', credits: 100, price: 900 },
  credits300: { label: '300 AI credits', credits: 300, price: 2500 },
};

/** Stripe, US cards: 2.9% + 30c a charge, Billing 0.7% on recurring. */
export const STRIPE_FEES = { pct: 0.029, fixed: 0.30, billingPct: 0.007 };
/** Hosting a month an account, an estimate (Netlify credits for its function
 *  calls, Blobs and the bandwidth of its library link; SAAS-AUDIT §2). */
export const HOSTING_USD = { free: 0.02, paid: 0.25 };
/** The bars scripts/plan_economics.mjs holds every plan and pack to. */
export const TARGETS = { planMargin: 0.70, packMargin: 0.45, freeCostMax: 0.25 };

/** What we keep of a charge, in dollars. */
export function netUsd(cents, recurring) {
  const usd = cents / 100;
  if (!usd) return 0;
  return usd - (usd * STRIPE_FEES.pct + STRIPE_FEES.fixed) - (recurring ? usd * STRIPE_FEES.billingPct : 0);
}

/** The price table with the MODEL_COSTS env merged over it. */
export function modelCosts(env) {
  let extra = {};
  try { if (env && env.MODEL_COSTS) extra = JSON.parse(env.MODEL_COSTS); } catch (e) { /* malformed: the table alone */ }
  return { ...MODEL_COST_USD, ...extra };
}
/** Credits one call to `model` costs, or null when the model has no price. */
export function creditsFor(model, env) {
  const usd = Number(modelCosts(env)[model]);
  if (!(usd > 0)) return null;
  return Math.max(1, Math.ceil(usd / CREDIT_USD - 1e-9));
}

/** The models an AI background may run on, first choice first, from the
 *  same env the function reads; the charge is the dearest of them, so a
 *  fallback can never cost more than was taken. */
export function backgroundModels(env) {
  const out = [];
  if (env.GEMINI_KEY) out.push(env.PGFX_BG_MODEL || 'gemini-3.1-flash-lite-image');
  if (env.FAL_KEY) out.push('fal-seedream-v4');
  return out;
}
export function backgroundCredits(env) {
  const models = backgroundModels(env);
  if (!models.length) return null;
  let most = 0;
  for (const m of models) {
    const c = creditsFor(m, env);
    if (c === null) return null;   // one unpriced model in the chain stops the sale
    most = Math.max(most, c);
  }
  return most;
}

const thisMonth = () => { const d = new Date(); return d.getUTCFullYear() + '-' + String(d.getUTCMonth() + 1).padStart(2, '0'); };

/** The account's credits now: the plan's for this month, and bought. */
export function creditState(user, month) {
  const plan = PLANS[planId(user && user.plan)];
  const m = month || thisMonth();
  const c = (user && user.credits) || {};
  const used = c.period === m ? c.used || 0 : 0;
  const bought = Math.max(0, (user && user.creditsBought) || 0);
  const left = Math.max(0, plan.credits - used);
  return { allowance: plan.credits, used, left, bought, total: left + bought, period: m };
}
/** Takes n credits, the month's first; returns what came from where, or null
 *  (nothing taken) when there are not enough. */
export function spendCredits(user, n, month) {
  const s = creditState(user, month);
  if (s.total < n) return null;
  const fromPlan = Math.min(s.left, n), fromBought = n - fromPlan;
  user.credits = { period: s.period, used: s.used + fromPlan };
  user.creditsBought = s.bought - fromBought;
  return { fromPlan, fromBought, period: s.period };
}
/** Gives back what spendCredits took (the model failed). */
export function refundCredits(user, spent) {
  if (!spent) return;
  const c = user.credits || {};
  if (spent.fromPlan && c.period === spent.period) user.credits = { period: c.period, used: Math.max(0, (c.used || 0) - spent.fromPlan) };
  if (spent.fromBought) user.creditsBought = Math.max(0, user.creditsBought || 0) + spent.fromBought;
}

/** Every plan, interval and pack: what it nets, what it can cost us at
 *  worst (every credit spent on the dearest model the credit allows), and
 *  the margin left. Months are the unit; a year is divided by twelve. */
export function economics() {
  const rows = [];
  for (const [id, p] of Object.entries(PLANS)) {
    for (const [interval, cents] of Object.entries(p.price)) {
      const net = netUsd(cents, true) / (interval === 'year' ? 12 : 1);
      const cost = p.credits * CREDIT_USD + (cents ? HOSTING_USD.paid : HOSTING_USD.free);
      rows.push({ kind: 'plan', id, interval, priceUsd: cents / 100, netUsd: net, worstCostUsd: cost, margin: net ? (net - cost) / net : null });
    }
  }
  for (const [id, k] of Object.entries(PACKS)) {
    const net = netUsd(k.price, false), cost = k.credits * CREDIT_USD;
    rows.push({ kind: 'pack', id, interval: 'once', priceUsd: k.price / 100, netUsd: net, worstCostUsd: cost, margin: (net - cost) / net });
  }
  return rows;
}
