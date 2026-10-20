/* Business copy only. These are starting points, never live inventory or offers. */
export const BRAND = "iPhones.LA";
export const PHONE = "(562) 999-4994";
export const CATEGORIES = {
  inventory: "Items for sale",
  selling: "How to sell to us",
  tips: "Helpful information",
  seasonal: "Seasonal",
  updates: "Shop updates",
};
export const PRESETS = [
  { id: "item", category: "inventory", name: "Feature an item", headline: "", detail: "",
    caption: "", hint: "Enter the actual model, condition and selling price. Add a photo of this item." },
  { id: "new-arrival", category: "inventory", name: "New arrival", headline: "", detail: "",
    caption: "", hint: "Name the item that just arrived, its condition and current price. Use its own photo." },
  { id: "three-steps", category: "selling", name: "How selling works", headline: "Sell your iPhone.",
    detail: "Quote. Handoff. Get paid.",
    caption: "Selling your iPhone? Start with a quote at https://iphones.la/sell. Tell us the model and condition, choose an available handoff option, and get paid after we check the device. Questions? Text (562) 999-4994." },
  { id: "drawer", category: "selling", name: "The phone in your drawer", headline: "Your old iPhone?",
    detail: "See what it could be worth.",
    caption: "That iPhone in your drawer could have a next chapter. Tell us its model and condition at https://iphones.la/sell, or text (562) 999-4994 to get started." },
  { id: "model", category: "tips", name: "Find your model", headline: "Which iPhone do you have?",
    detail: "Settings > General > About",
    caption: "Find your model name and capacity in Settings > General > About. Those details help us understand what you’re selling. Start at https://iphones.la/sell. Keep your serial number and IMEI out of public comments." },
  { id: "backup", category: "tips", name: "Before you sell", headline: "Keep your memories.",
    detail: "Back up before handing over your phone.",
    caption: "Before handing over a phone, back up your photos and files and make sure you can access your accounts on your next device. Follow Apple’s current preparation steps for your device. Selling questions? Text (562) 999-4994." },
  { id: "condition", category: "tips", name: "Describe its condition", headline: "Small details. Better quotes.",
    detail: "Tell us about cracks and repairs.",
    caption: "A clear description helps: model, storage, carrier status, visible damage and any known repairs. A photo helps too. Get started at https://iphones.la/sell." },
  { id: "upgrade", category: "seasonal", name: "Upgrade season", headline: "New phone? Next step.",
    detail: "Find a new home for your old iPhone.",
    caption: "Upgrading your phone? Check what your old one could be worth before it ends up in a drawer. Get a quote at https://iphones.la/sell." },
  { id: "holiday", category: "seasonal", name: "Holiday gifting", headline: "A thoughtful next chapter.",
    detail: "Explore pre-owned devices.",
    caption: "Looking for a pre-owned device for someone on your list? Browse current items and their individual details at https://iphones.la/shop. Text (562) 999-4994 with questions." },
  { id: "clear-out", category: "seasonal", name: "A fresh start", headline: "Time for a fresh start.",
    detail: "Start with the iPhone you no longer use.",
    caption: "A fresh start can be as simple as clearing out an old device. Tell us what you have at https://iphones.la/sell." },
  { id: "announcement", category: "updates", name: "Shop announcement", headline: "", detail: "",
    caption: "", hint: "Write the confirmed shop update, with the date or hours if they matter." },
  { id: "hours", category: "updates", name: "Hours or pickup update", headline: "", detail: "",
    caption: "", hint: "Enter the confirmed date and hours. Set a reminder date so the draft is not reused after the update." },
];

const cleanText = (value, max) => typeof value === "string" ? value.replace(/\0/g, "").trim().slice(0, max) : "";
export function newDraft(id = "three-steps") {
  const p = PRESETS.find(x => x.id === id) || PRESETS[2];
  return {
    version: 1, id: "", name: p.name, category: p.category, preset: p.id,
    headline: p.headline, detail: p.detail, cta: "iPhones.LA · Text us",
    phone: PHONE, caption: p.caption, aspect: "9:16", look: "clean", duration: 6,
    expires: "", seed: 1,
  };
}

export function cleanDraft(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new Error("Choose a Social Studio draft JSON file.");
  if (raw.version !== 1) throw new Error("This draft uses a different format. Choose a Social Studio version 1 draft.");
  const out = newDraft();
  for (const [key, max] of Object.entries({ id: 80, name: 80, headline: 60, detail: 40, cta: 24, phone: 20, caption: 1500 })) {
    out[key] = cleanText(raw[key], max);
  }
  out.category = Object.hasOwn(CATEGORIES, raw.category) ? raw.category : "selling";
  out.preset = PRESETS.some(p => p.id === raw.preset && p.category === out.category) ? raw.preset : PRESETS.find(p => p.category === out.category).id;
  out.aspect = ["9:16", "4:5", "1:1"].includes(raw.aspect) ? raw.aspect : "9:16";
  out.look = ["clean", "bold", "editorial"].includes(raw.look) ? raw.look : "clean";
  out.duration = raw.duration === 8 ? 8 : 6;
  out.expires = /^\d{4}-\d{2}-\d{2}$/.test(raw.expires || "") ? raw.expires : "";
  out.seed = Number.isInteger(raw.seed) && raw.seed > 0 && raw.seed < 1000000 ? raw.seed : 1;
  return out;
}

export function shopDay(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "America/Los_Angeles", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
  const value = type => parts.find(p => p.type === type).value;
  return `${value("year")}-${value("month")}-${value("day")}`;
}

export function validateDraft(draft, { hasPhoto = false, day = shopDay() } = {}) {
  const errors = [];
  if (!draft.headline.trim()) errors.push("Write the headline.");
  if (!draft.detail.trim()) errors.push("Add the detail line.");
  if (!draft.cta.includes(BRAND)) errors.push("Keep iPhones.LA in the call to action.");
  if (draft.phone.replace(/\D/g, "") !== PHONE.replace(/\D/g, "")) errors.push("Use the shop number: " + PHONE + ".");
  if (draft.category === "inventory" && !hasPhoto) errors.push("Add a photo of the actual item before downloading.");
  if (draft.expires && draft.expires < day) errors.push("This draft’s reminder date has passed. Update the copy and date before downloading.");
  if (/\{[^}]+\}|\[[^\]]+\]/.test(draft.headline + " " + draft.detail)) errors.push("Replace the placeholders in the graphic.");
  return errors;
}
