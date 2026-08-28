# NEW GFX ENGINE — study program

Entry point for any LLM or person picking up the Graphics Studio design work.
Read this file first, then `SESSION-PROTOCOL.md`, then whichever curriculum
module the log says is next.

## What this project is

**Graphics Studio by BUYBACK.AD** — a browser-based ad builder for phone buyers
and resellers. Pick a template, type a headline and a phone number, export a
post-ready graphic for Facebook Marketplace, OfferUp, Instagram or Craigslist.

- Repo: `myleskcb/buybackad-graphics-studio`
- Working copy: `~/Downloads/gfxv23` (see MIGRATION note in OPERATIONS.md)
- Live: https://buybackad-graphics-studio.netlify.app
- Netlify project: `buybackad-graphics-studio`

## The document map

| File | What it is |
|---|---|
| `../DESIGN-LAW.md` | **The authority.** 42 enforced rules, derived by auditing the real library. Never contradict it. |
| `SESSION-PROTOCOL.md` | How to run a study session, including the 99% pause rule |
| `CURRICULUM.md` | The syllabus: what to learn, in order, college level |
| `COLOR-THEORY.md` | Colour module — perceptual space, harmony, application |
| `FIELD-RESEARCH.md` | How to study real competitor ads legally and usefully |
| `OPERATIONS.md` | Hosting, deploy, URLs, DNS state, repo hygiene |
| `LEARNING-LOG.md` | Append-only record of every session and what changed |

## The prime directive

DESIGN-LAW.md is *already* the output of a serious audit: OKLab colour maths,
split-complementary accent derivation, glyph-masked contrast measurement,
optical alignment. It is ahead of most commercial template libraries.

**So the job is not to teach it beginner theory.** The job is to extend it where
it is thin, and to keep every addition to the same standard: a rule earns its
place by being *measured against the real library*, not asserted from a
textbook.

If a study session produces a rule that cannot be checked with code against the
243 templates, it is not finished.

## The business constraint that governs every decision

From DESIGN-LAW.md, and it is the most important sentence in this project:

> These are ads that must stop a scroll in a hostile feed, so "restrained"
> cannot be allowed to mean "quiet". But they are also ads that say *give a
> stranger your phone and they will hand you cash*, so trust is the conversion.
> Anything that reads as a scam costs money directly.

Resolved by: **attention comes from contrast and scale, not from saturation.**

Every proposed change gets tested against that. A change that raises attention
by raising saturation is moving backwards even if it looks louder.
