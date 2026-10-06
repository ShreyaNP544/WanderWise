# WanderWise — Product & Architecture Plan

> **Your AI travel architect.** Tell WanderWise what kind of trip you want. It designs the trip, explains its choices, balances your budget, and lets you reshape the trip through conversation.

Problem statement #14: *AI Travel Planner — generate a personalized itinerary based on destination, budget, duration, and interests.*
Build window: ~11:30 → 16:00 (4.5 h), hourly commits.

---

## 1. Product vision
Planning a trip is a series of compromises: money vs. experience, energy vs. coverage, my wishes vs. my group's. Today people do that juggling across 15 browser tabs. WanderWise makes the trip a **living plan** that you negotiate with, not a document you regenerate from scratch.

## 2. Target users
- **Primary:** Indian students and young professionals (20–30) planning budget domestic trips with friends. They are budget-sensitive, plan on their phones, and often change plans mid-way.
- **Secondary:** People planning for mixed groups (taking parents along, family trips) where constraints like stamina, food, and accessibility matter.
- **Not targeting:** business travel, international visas, luxury concierge.

## 3. Core problem
Generic itinerary generators give you a *one-shot* plan. When reality changes ("too expensive", "parents are coming now"), you start over and lose everything you liked. Budgets are vague guesses, not totals that add up.

## 4. Unique value proposition
**A trip you can renegotiate.** WanderWise remembers what matters to you, changes only what you asked it to, shows you exactly what changed and why, and keeps the budget arithmetic honest.

## 5. Primary user journey
1. Landing → "Plan a trip" → short, friendly **preference form** (with sensible defaults; 60 seconds to fill).
2. Loading state that shows *what the AI is doing* ("Balancing ₹20,000 across 5 days…").
3. **Trip view:** summary header (route, dates, total vs. budget), day-by-day cards, budget breakdown chart, "why this" notes.
4. User types into the **Reshape bar**: "Bring it under ₹15,000 but keep the mountains."
5. Updated trip appears with **changes highlighted** + a "What changed" panel (removed / added / kept because…).
6. Repeat. Version history lets them undo.
7. Save trip (shareable link if time allows).

## 6. Core features
- Preference form (destination, origin, dates/duration, budget, travellers, traveller type, interests, pace, stay, transport, diet, constraints, avoid-list)
- Gemma-generated **structured** itinerary (JSON, not prose)
- Day-by-day plan with time blocks, cost per item, and an energy level for each day
- Budget breakdown (stay / food / transport / activities / buffer) with chart
- Conversational **Reshape** of the existing plan
- Error handling + fallback model

## 7. Differentiating features (what makes it not-a-wrapper)
1. **Adaptive replanning with a diff.** Modifications are patches to the existing plan. The UI highlights changed items and lists what was preserved.
2. **Preference memory ("Trip DNA").** Hard constraints (budget cap, diet, mobility, must-haves) are extracted into chips the user can see and lock. Every reshape is validated against them.
3. **Honest budget engine.** Gemma proposes items with costs; *our code* sums them, checks against the cap, and flags overruns. If Gemma's numbers don't fit, we auto-ask it to fix them. The LLM never gets the final say on arithmetic.
4. **Explainability.** Each activity has a one-line "why this for you" tied to the user's preferences.
5. **Day energy meter.** Each day is rated relaxed / moderate / intense, which makes "make day 2 less tiring" visible and verifiable.

## 8. MVP (must ship by 15:30)
- Form → generate → trip view (cards + budget chart + why-notes)
- Reshape bar with change highlighting + "What changed" panel
- Trip DNA chips (display; locking only if time permits)
- Budget validation in code + auto-repair retry
- JSON schema validation + retry + friendly errors
- Hosted Gemma primary, local Gemma fallback
- A cached "demo trip" so the live demo can never die
- Clean, responsive UI; README with screenshots and setup

## 9. Nice-to-have (only after the MVP is done)
1. Version history / undo (cheap: an array of plans) ← first in line
2. Weather for trip dates via Open-Meteo (free, no key)
3. Save to MongoDB + shareable `/trip/:id` link
4. "Open in Google Maps" link per activity (just a URL, no Maps API)
5. Export / print-friendly view
6. Lock/unlock Trip DNA chips

## 10. Explicitly NOT building
| Idea | Why not |
|---|---|
| Auth / user accounts | 45 min of work and zero demo value. A shareable link is enough. |
| Live flight/hotel booking or prices | No free reliable API. It would get scraped or faked. Show estimates honestly instead. |
| Embedded interactive maps | API keys + time sink. A Maps deep-link gives 80% of the value. |
| Free-form chatbot | Makes it look like a wrapper. Reshaping is *command-driven against a plan*, not chat. |
| Multi-city optimisation, group voting, payments, mobile app | Out of scope for 4 hours. Pitch them as the roadmap. |
| Fine-tuning Gemma | No time, and no data. Good prompting + validation beats it here. |

## 11. Information architecture
```
/                 Landing (pitch + "Plan a trip" + "Try demo trip")
/plan             Preference form
/trip/:id         Trip view
   ├─ Header: route, dates, travellers, total vs budget
   ├─ Trip DNA chips
   ├─ Tabs/sections: Itinerary | Budget | Why this plan
   ├─ What-changed panel (after a reshape)
   └─ Reshape bar (sticky bottom) + suggestion pills
```

## 12. Main screens
1. **Landing** — one headline, one CTA, one "see a demo trip" button.
2. **Plan form** — grouped into 3 steps: *Where & when*, *Who & budget*, *Your style*. Chips for interests, segmented controls for pace.
3. **Generating** — progress messages, skeleton cards.
4. **Trip view** — the main screen; 80% of polish time goes here.

## 13. AI capabilities (all Gemma)
| Capability | Input | Output |
|---|---|---|
| **Plan** | Preferences | Trip JSON (days → activities with time, cost, category, energy, why) |
| **Extract Trip DNA** | Preferences + every reshape request | Constraint list (hard/soft) |
| **Reshape** | Current trip JSON + Trip DNA + user instruction | New trip JSON + `changes[]` + `preserved[]` + short rationale |
| **Repair** | Invalid JSON or over-budget plan + error message | Corrected trip JSON |

Prompting rules: strict JSON schema in the prompt, INR currency, realistic Indian price ranges, a few-shot example, temperature ~0.4 for planning and ~0.2 for repair.

## 14. Real-world data
- **Curated cost baseline** (`data/destinations.json`): ~10 popular Indian destinations with typical per-night stay (hostel/mid/premium), meal cost, and local transport cost. Injected into the prompt so Gemma's estimates are grounded, and shown in the UI as "based on typical prices".
- **Open-Meteo** forecast/climate for dates (nice-to-have).
- **Google Maps search deep-links** for each place (no key).

## 15. APIs / services
- **Gemma via Google AI Studio** (Gemini API, Gemma model) — primary: fast and higher quality (larger model).
- **Gemma via Ollama** (`gemma3:4b`, local, GTX 1650) — offline fallback, which also shows Gemma is genuinely open source.
- **MongoDB Atlas** free tier — saved trips. The app runs with an in-memory store if no URI is set.
- **Open-Meteo** — weather (optional).

## 16. Technical architecture
```
React (Vite) ──HTTP──► Express API ──► AI layer
   form, trip view,        │           ├─ provider: AI Studio Gemma (primary)
   reshape bar, diff       │           ├─ provider: Ollama Gemma (fallback)
                           │           ├─ prompt builders (plan / reshape / repair)
                           │           └─ validator (zod schema) + budget engine
                           └──► Store: MongoDB Atlas | in-memory fallback
```
- Endpoints: `POST /api/trips` (generate), `POST /api/trips/:id/reshape`, `GET /api/trips/:id`, `GET /api/demo`, `GET /api/health` (shows which model is live).
- Pipeline for every AI call: build prompt → call provider (timeout) → extract JSON → zod-validate → budget-check → (repair once if needed) → compute diff → respond.
- The diff is computed **in code** by comparing activity IDs/titles between versions, so it is never hallucinated.

## 17. Data model
```js
Trip {
  _id, createdAt, updatedAt,
  preferences: { origin, destination, startDate, days, budget, travellers,
                 travellerType, interests[], pace, stay, transport, diet,
                 constraints, avoid[] },
  dna: [{ label, type: 'hard'|'soft', locked: bool }],
  versions: [ Plan ],        // index = version number
  currentVersion: Number
}
Plan {
  title, summary, totalCost, currency: 'INR',
  budget: { stay, food, transport, activities, buffer },
  days: [{ day, title, energy: 'relaxed'|'moderate'|'intense',
           activities: [{ id, time, title, place, category, cost, why, durationHrs }] }],
  tips: [String],
  changeLog?: { instruction, changes: [String], preserved: [String] },
  model: 'gemma-hosted'|'gemma-local'
}
```

## 18. Security considerations
- API keys live only in the server's `.env`; `.env` is gitignored, with `.env.example` committed.
- Validate and length-limit all inputs (zod); cap reshape instructions at ~300 chars.
- Prompt-injection hygiene: user text is placed in delimited fields, and the model output is *data* validated against a schema, never executed or rendered as HTML.
- Basic rate limiting on AI endpoints (`express-rate-limit`), and CORS restricted to the client origin.
- Trip IDs are random (not sequential); no personal data is collected.

## 19. Error & fallback strategy
| Failure | Response |
|---|---|
| Hosted Gemma timeout/error | Auto-switch to local Ollama Gemma; UI badge shows which model answered |
| Both models down | Friendly error + retry; landing still offers the cached demo trip |
| Malformed JSON | Extract the JSON block → retry once with a repair prompt including the parse error |
| Over budget | Repair prompt: "total is ₹X, cap is ₹Y, cut these categories"; if still over, show a warning badge rather than lying |
| Reshape breaks a hard constraint | Reject the change and tell the user which constraint blocked it |
| MongoDB unavailable | In-memory store; app keeps working |
| Slow generation | Progress messages + skeleton UI; timeouts at 60 s |

## 20. Hackathon demo story (live, ~2 min)
1. "Riya and a friend, Mumbai → Himachal, 5 days, ₹20,000, mountains + photography, moderate pace." Hit plan.
2. Show the plan: day cards, energy meter, budget chart that **adds up**, a "why this" note.
3. Reshape #1: *"Too expensive. Keep the mountain experiences but bring it under ₹15,000."* → highlighted changes, budget bar drops under the cap, "Preserved: mountain treks, photography spots".
4. Reshape #2: *"Actually, my parents are coming now."* → traveller count updates, intense days become moderate, a vegetarian/comfort note appears, and the budget is re-balanced for 4 people (and honestly flagged if it can't fit).
5. Show the health badge: "Powered by Gemma, with local Gemma fallback." Pull the network cable if brave.

Backup: pre-generated demo trip + screen recording.

## 21. 3-minute pitch
- **0:00 Hook.** "Every trip plan breaks the moment reality shows up: the budget's tighter, your parents want to come, day 2 is exhausting. Today you start over."
- **0:25 Product.** "WanderWise is an AI travel architect. It builds the trip, and more importantly, it lets you renegotiate it."
- **0:40 Live demo** (steps 1–4 above, ~1:45).
- **2:25 Under the hood.** "Gemma plans and reshapes; our code validates every plan against a schema and does the budget maths itself, so the numbers always add up. It runs on hosted Gemma and falls back to Gemma on this laptop."
- **2:45 Close.** "Next: live prices, weather, group voting. WanderWise: plans that adapt like you do."

## 22. How this could look like a generic AI wrapper, and how we avoid it
| Wrapper smell | Our answer |
|---|---|
| Output is a wall of markdown | Structured JSON → designed cards, charts, energy meters |
| "Chat with AI about travel" | No chatbot. Reshaping commands act on a concrete plan, and the result is a diff |
| Numbers that don't add up | Budget engine in code + repair loop + honest over-budget badge |
| Every edit regenerates everything | Patch semantics; we show what changed *and* what was preserved |
| Black-box answers | "Why this for you" per activity + visible Trip DNA |
| Breaks during the demo | Fallback model, cached demo trip, validation + retries |

---

## Build schedule (commit every hour)
| Commit | Target |
|---|---|
| **12:00** | This plan + repo scaffold (client + server running, health endpoint) |
| **13:00** | Gemma provider layer + `/api/trips` generate with schema validation + budget engine |
| **14:00** | Form + trip view (cards, budget chart, why-notes) end-to-end |
| **15:00** | Reshape + diff highlighting + What-changed panel + fallback + demo trip |
| **15:45** | Polish, README, screenshots, final demo rehearsal |
