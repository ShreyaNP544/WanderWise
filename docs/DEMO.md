# WanderWise — Demo Script (3 minutes)

## Before judging (15 min before)
1. Restart once: `Ctrl+C` → `npm run dev`. Check the terminal shows `✓ Connected to MongoDB` and the header badge says **Gemma online**.
2. **Rehearse the exact demo once.** Gemma responses are cached for 6 hours by prompt, and every sample trip starts from the same plan, so the rehearsed remixes replay in about 1 second on stage. (Don't restart the server after rehearsing; the cache is in memory.)
3. Open tabs: (a) landing page, (b) GitHub repo, (c) `docs/EVAL.md`.
4. Backup: a screen recording of the rehearsal, in case the venue Wi-Fi dies.

## Live flow
| Time | Do | Say |
|---|---|---|
| 0:00 | Landing page | "Every trip plan breaks the moment reality shows up: the budget's tighter, your parents want to come, day 2 is exhausting. Today you start over. WanderWise is an AI travel architect that lets you **renegotiate** your trip." |
| 0:20 | Click **See a sample trip** | "Gemma 4 planned this Delhi → Manali trip. Notice it isn't a wall of text." |
| 0:30 | Point at a day card | "Live weather for each day from Open-Meteo, an energy level per day, and every stop labelled: **Curated data**, **Real place** from Wikipedia, or **AI estimate**. Gemma isn't allowed to claim anything is verified; our code decides." |
| 0:50 | Point at Budget card | "Gemma proposes line items; **our budget engine does the maths**. These totals always add up." |
| 1:00 | Remix: **"I don't want to wake up before 8 AM"** | "Watch: it doesn't regenerate the trip." → Before ↔ After shows the one 08:00 activity moved to 09:00; everything else locked. "Days I didn't touch are guaranteed unchanged, enforced in code." |
| 1:35 | Remix: **"Make this trip 30% cheaper"** | "Now something impossible." → trade-off cards. "30% off is below the cheapest realistic cost for this route, so instead of a fake plan you get honest options." |
| 2:00 | Click an option (e.g. **Shorten trip**) | Show the Remix panel: budget before → after, removed/added items, "Why these changes". |
| 2:20 | Point at **Remix history** + **Undo** | "Every change is a version. Undo is one click." |
| 2:30 | Close | "Under the hood: Gemma 4 on Google AI Studio with automatic fallback to a second Gemma model and local Gemma via Ollama, real-world grounding, schema validation and a repair loop, MongoDB persistence. We tested it on 10+ scenarios; it's in `docs/EVAL.md`. **WanderWise: plans that adapt like you do.**" |

## Likely judge questions
- **"How is Gemma used meaningfully?"** It interprets requests, chooses and sequences activities from real places, reshapes plans while preserving priorities, and writes the trade-off options. Code verifies every number and fact.
- **"What if Gemma is down?"** Retry, then Gemma 4 31B, then local Gemma (Ollama), then a friendly error; the sample trip always works. Google's 26B model returned 500 errors several times today and the retry handled it.
- **"Are prices real?"** Typical prices from our curated dataset, labelled as estimates. We deliberately don't fake live hotel prices.
- **"Why not just ChatGPT?"** ChatGPT can't guarantee the budget adds up, can't lock the days you didn't mention, doesn't show you what changed, and won't tell you when your request is impossible.
