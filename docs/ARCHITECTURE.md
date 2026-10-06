# WanderWise — Technical Architecture

Guiding rule: **one deployable app, one AI gateway, zero hard dependencies on third-party APIs.** Every external thing (Gemma host, MongoDB, weather) has a fallback, so the demo cannot be killed by someone else's outage.

Measured on 6 Oct 2026 with our key: `gemma-4-26b-a4b-it` answered in ~20 s; `gemma-4-31b-it` returned **503 (high demand)**. Gemma 4 also emits reasoning text before its JSON. These two facts drive the AI gateway design below.

---

## 1. System architecture

```
┌──────────────────────────┐        ┌──────────────────────────────────────────────┐
│ React + Vite + Tailwind  │  HTTP  │ Express API (single Node process)            │
│ Landing · Plan · Trip    │ ─────► │ routes → services → AI gateway / store       │
└──────────────────────────┘  /api  │                                              │
                                    │  AI gateway ─► Gemma 4 26B-A4B (AI Studio)   │
                                    │      │      └► Gemma 4 31B   (AI Studio)     │
                                    │      │      └► Gemma (Ollama, local)         │
                                    │      │      └► cached demo responses         │
                                    │  Domain: schema · budget · feasibility · diff│
                                    │  Data: destinations.json (curated)           │
                                    │  Store: MongoDB Atlas │ in-memory            │
                                    │  Optional: Open-Meteo weather                │
                                    └──────────────────────────────────────────────┘
```

**Why:** a modular monolith. One process, one deploy, one log stream. Microservices would add networking, CORS and deploy work with no demo benefit. The modules are cleanly separated, so they can be split later if this becomes a real product.

## 2. Frontend architecture
- **React + Vite + Tailwind CSS v4 + lucide-react icons.** No heavy component library. *Why:* Tailwind is the fastest way to a custom, polished look; component libraries add setup time and make apps look generic. We write ~10 small components ourselves.
- **Routing:** `react-router` with 3 routes: `/`, `/plan`, `/trip/:id`. *Why:* real URLs make trips shareable and the demo can deep-link to a cached trip.
- **State:** plain React state + one `useTrip(id)` hook (fetch, reshape, undo, loading/error). No Redux or React Query. *Why:* one main entity (the trip); a global store is overkill.
- **API layer:** `src/api.js`, a single `request()` wrapper that normalises errors into `{ code, message, retryable }`.
- **Budget chart:** a hand-built stacked bar + legend (CSS). *Why:* 5 categories don't need a chart library, and it animates nicely on reshape.
- **Diff highlighting:** the server returns `changes` with activity IDs; cards with `added`/`modified` status get a highlight ring and badge; removed items appear struck through in the "What changed" panel.
- **Loading UX:** rotating progress messages ("Checking travel times…", "Balancing ₹20,000 across 5 days…") + skeleton cards. *Why:* 20–40 s waits feel shorter when narrated; real streaming (SSE) costs time we don't have.

## 3. Backend architecture
```
routes/      HTTP only: parse, validate input (zod), call a service, shape the response
services/    tripService: generate, reshape, undo, the orchestration
ai/          gateway (provider chain), providers, prompts, JSON extraction
domain/      pure functions: schema, budget engine, feasibility check, diff
data/        destinations.json (curated real-world baseline)
store/       repository interface → mongoStore | memoryStore
middleware/  error handler, rate limiters, request id
```
**Why:** the domain logic (budget, feasibility, diff) is pure and testable without the AI. It is also what makes the project more than a wrapper, so it needs to be easy to point at in the code.

## 4. AI architecture
**AI gateway** (`ai/gateway.js`) exposes one function: `generateJSON({ task, prompt, schema })`.
- Tries providers in order: **hosted Gemma 4 26B-A4B → hosted Gemma 4 31B → local Ollama Gemma**. Each has a timeout (45 s hosted, 90 s local). 429/503/timeout moves to the next provider.
- **Extracts JSON** from the reply (strips reasoning and markdown fences, takes the outermost `{…}`), then validates with zod.
- **Repair loop:** on parse/validation failure, one retry with a repair prompt containing the error.
- Returns `{ data, meta: { provider, model, latencyMs, repaired } }`. `meta` drives the "Answered by Gemma 4 26B" badge.

**Providers** implement one interface: `complete({ prompt, temperature, json }) → string`. Swapping Gemma hosts (AI Studio, Ollama, Vertex, vLLM) is a new 30-line file. *Why:* the AI layer is replaceable, and we can show the same Gemma running in the cloud and on a laptop.

**Division of labour (the core technical story):**
| Gemma decides | Code decides |
|---|---|
| Which activities, in what order, and why | Total cost, per-category totals |
| How to interpret "less tiring" or "parents are coming" | Whether the plan fits the budget |
| What to keep vs change, and how to phrase the trade-offs | Whether the request is feasible at all (cost floor) |
| Natural-language explanations | The diff between versions |

## 5. Database schema (MongoDB, one collection)
```js
trips {
  _id: String,                // nanoid, unguessable, used in URLs
  createdAt, updatedAt,
  preferences: {
    origin, destination, startDate?, days, budget, travellers,
    travellerType: 'solo'|'friends'|'couple'|'family'|'parents',
    interests: [String], pace: 'relaxed'|'moderate'|'packed',
    stay: 'budget'|'mid'|'premium', transport: 'train'|'bus'|'flight'|'any',
    diet?, constraints?, avoid: [String]
  },
  constraints: [{ label, kind: 'hard'|'soft', source: 'form'|'reshape' }],  // "Trip DNA"
  versions: [Plan],           // embedded, capped at 15
  current: Number,            // index into versions
  history: [{ instruction, at, outcome: 'applied'|'tradeoff'|'rejected' }]
}

Plan {
  title, summary,
  days: [{ day, date?, title, type: 'travel'|'explore'|'rest', energy: 1|2|3,
           activities: [{ id, time, title, place, category, costPerPerson, durationHrs, why }] }],
  stay: [{ nights, name, area, tier, costPerNight }],
  transport: [{ leg, mode, costPerPerson, hours }],
  budget: { stay, food, transport, activities, buffer, total, perPerson, cap, status: 'under'|'near'|'over' }, // computed by code
  tips: [String],
  change?: { instruction, summary, added: [id], modified: [id], removed: [{id,title}], preserved: [String] },
  meta: { provider, model, latencyMs }
}
```
**Why embedded versions:** a trip and its versions are always read together, a document is far below 16 MB, and there are no joins. Undo is just `current -= 1`. *Why no users collection:* see §7.

## 6. API endpoints
| Method | Path | Purpose |
|---|---|---|
| GET | `/api/health` | Live providers, store type (shown in UI badge) |
| GET | `/api/destinations` | Names from the curated dataset (form autocomplete) |
| POST | `/api/intent` | `{ text }` → preferences (one-sentence magic fill) |
| POST | `/api/trips` | `{ preferences }` → trip with version 0 |
| GET | `/api/trips/:id` | Full trip |
| POST | `/api/trips/:id/reshape` | `{ instruction }` or `{ optionId }` → `{ kind: 'applied', trip }` or `{ kind: 'tradeoff', message, options[] }` |
| POST | `/api/trips/:id/undo` | Step back one version |
| GET | `/api/demo` | Pre-generated showcase trip (never calls the AI) |
| GET | `/api/trips/:id/weather` | *(optional)* Open-Meteo forecast for the destination |

**Why REST, not GraphQL or WebSockets:** 9 endpoints, one client. The simplest thing works.

## 7. Authentication
**None for the hackathon.** Trips are addressed by unguessable nanoid URLs (like an unlisted Google Doc); the browser keeps a "My trips" list in localStorage.
*Why:* auth costs ~45 min, adds a login step to the demo, and protects nothing of value (no personal data is stored). *Later:* magic-link email or Google OAuth, adding `ownerId` to trips.

## 8. AI request flow

**Generate**
```
validate prefs (zod) → load destination baseline → feasibility check (code)
→ build plan prompt → gateway (provider chain, JSON extract, zod)
→ budget engine recomputes totals → if over cap: repair prompt once
→ save version 0 → respond
```

**Reshape**
```
validate instruction → load trip + current plan + constraints
→ classify intent + extract new constraints (folded into the same call)
→ feasibility check against the updated constraints (code)
   ├─ infeasible → Gemma writes 2–3 trade-off options → respond { kind: 'tradeoff' }
   └─ feasible   → reshape prompt (current plan + constraints + instruction)
                  → gateway → budget engine → diff (code) → save new version → respond
```
Choosing a trade-off option re-enters the reshape flow with that option's concrete instruction and relaxed constraint (for example budget raised to ₹18,500).

**Why the feasibility check is in code:** it makes the "impossible request → trade-offs" demo moment **deterministic**. We never rely on the model noticing that the numbers don't add up.

## 9. Structured AI output format
Gemma returns *plan content*, never totals:
```json
{
  "title": "Peaks & Pixels: 5 days in Himachal",
  "summary": "…",
  "days": [{ "day": 1, "title": "Overnight to Chandigarh", "type": "travel", "energy": 1,
             "activities": [{ "id": "d1a1", "time": "18:00", "title": "Paschim Express to Chandigarh",
                              "place": "Mumbai Central", "category": "transport",
                              "costPerPerson": 900, "durationHrs": 26, "why": "Cheapest way to cover 1,700 km" }] }],
  "stay": [{ "nights": 2, "name": "Zostel Manali", "area": "Old Manali", "tier": "budget", "costPerNight": 1400 }],
  "tips": ["Carry a warm layer: nights drop to 8°C in October"],
  "change": { "summary": "…", "preserved": ["Solang valley sunrise shoot (photography)"] }
}
```
Rules: activity IDs are stable (`d{day}a{n}`), and the reshape prompt requires unchanged activities to keep their IDs. That is what lets code compute an exact diff. Trade-off output:
```json
{ "message": "4 people for 5 days can't fit in ₹15,000…",
  "options": [{ "id": "A", "label": "Shorten to 4 days", "estimate": 14600,
                "tradeoff": "Drops Kasol", "instruction": "Cut to 4 days, remove Kasol" }] }
```

## 10. Prompt architecture
Prompts are **functions in `ai/prompts/`**, one per task (`intent`, `plan`, `reshape`, `tradeoff`, `repair`), each built from shared blocks:
1. **Role** – "You are WanderWise, an expert Indian travel planner…"
2. **Grounding** – destination baseline (typical costs, travel times, best areas) from `destinations.json`
3. **Constraints** – preferences + Trip DNA, hard vs soft clearly labelled
4. **Task** – what to do now
5. **Output contract** – exact JSON shape + rules ("costs in INR per person", "no text outside JSON")

User text is always placed inside delimiters (`<user_request>…</user_request>`) and described as data. Temperature: 0.2 for intent/repair, 0.5 for plan, 0.4 for reshape.
**Why functions, not a template engine:** testable, versionable in git, and no extra dependency.

## 11. Context management for trip modifications
Each reshape call sends:
- the **current plan only** (not the whole version history), in compact form (no `why` strings, which saves ~30% of tokens)
- the **Trip DNA**: accumulated constraints, e.g. `budget ≤ ₹15,000 (hard)`, `travellers: 4 incl. 2 parents (hard)`, `loves mountains (soft)`
- the **last 3 instructions** as one-line summaries (so "actually, undo that" style requests make sense)
- the new instruction

New constraints are extracted from each instruction and merged into the Trip DNA (a later value overrides an earlier one, e.g. a new budget). *Why:* the model gets everything relevant and nothing stale, prompts stay ~3–4k tokens (fast), and the constraints the system remembers are shown in the UI.

## 12. Validation strategy
Four layers:
1. **Input** – zod schemas on every request body (lengths, enums, numeric ranges: budget ₹1k–₹10L, days 1–14, travellers 1–12).
2. **AI output shape** – zod schema of the plan; failure → repair prompt → failure → next provider.
3. **AI output semantics** – code checks: day count matches, IDs are unique, costs are non-negative and within 0.3×–3× of baseline (outliers flagged), no item in `avoid[]`.
4. **Budget** – recomputed from items; `over` triggers one repair, then an honest "over budget by ₹X" badge.

## 13. Error handling
- Central Express error middleware → `{ error: { code, message, retryable } }` with correct HTTP status. Never leak stack traces.
- Error codes: `VALIDATION_ERROR` 400, `NOT_FOUND` 404, `BUSY` 409 (reshape already running), `RATE_LIMITED` 429, `AI_UNAVAILABLE` 503, `INTERNAL` 500.
- Frontend maps codes to friendly copy + a Retry button when `retryable`. The previous plan stays on screen if a reshape fails, so nothing is ever lost.

## 14. Rate limiting
- `express-rate-limit`: AI endpoints 12 req/min/IP; everything else 120/min.
- **Per-trip lock:** one in-flight reshape per trip (409 `BUSY`). Prevents double-clicks from burning quota.
- Gateway respects 429 from AI Studio: no hammering, move to the next provider.
*Why:* the free Gemma quota is the scarcest resource during the demo.

## 15. Caching
| What | How | Why |
|---|---|---|
| AI responses | In-memory LRU keyed by hash(task + model + prompt), 6 h TTL | Rehearsing the demo doesn't burn quota; identical requests are instant |
| Demo trip | Static JSON in `data/demo-trip.json` | The showcase always works, even fully offline |
| Destination baseline | Loaded once at boot | Static data |
| Weather | In-memory, 1 h TTL per destination | Free API, be polite |

## 16. API failure fallbacks
| Dependency | Fallback |
|---|---|
| Gemma 4 26B (hosted) | Gemma 4 31B (hosted) → Ollama local Gemma → friendly error + "Try the demo trip" |
| MongoDB | In-memory store (selected at boot when `MONGODB_URI` is empty or unreachable); badge says "not persisted" |
| Weather | Hide the weather strip; plan unaffected |
| Destination not in dataset | Gemma plans without the baseline; UI labels the costs "AI estimate (unverified)" |

## 17. Security
- Secrets only in `backend/.env` (gitignored); `.env.example` documents them. The frontend never sees the API key, and all AI calls go through the backend.
- `helmet` headers; CORS limited to `CLIENT_ORIGIN`; JSON body limit 100 kb.
- Prompt-injection containment: user text delimited, model output is schema-validated **data**, React escapes all strings (no `dangerouslySetInnerHTML`), and the model has no tools or side effects.
- Unguessable trip IDs; no PII collected; Mongo queries only by `_id` (string-validated, so no operator injection).
- Rate limits as in §14.
- *Hackathon note:* the API key was shared in a chat during setup, so **rotate it after the event**.

## 18. Environment variables
| Var | Required | Default | Purpose |
|---|---|---|---|
| `PORT` | no | 5000 | API port |
| `CLIENT_ORIGIN` | no | http://localhost:5173 | CORS |
| `GEMINI_API_KEY` | yes* | – | AI Studio key (*app falls back to Ollama/demo without it) |
| `GEMMA_HOSTED_MODEL` | no | gemma-4-26b-a4b-it | Primary model |
| `GEMMA_HOSTED_FALLBACK_MODEL` | no | gemma-4-31b-it | Second hosted model |
| `OLLAMA_URL` | no | http://localhost:11434 | Local Gemma |
| `GEMMA_LOCAL_MODEL` | no | gemma3:4b | Local model tag |
| `MONGODB_URI` | no | – | Atlas; empty = in-memory |
| `AI_CACHE` | no | on | Response cache toggle |

## 19. Folder structure
```
wanderwise/
├─ docs/                 PRODUCT.md · ARCHITECTURE.md · DEMO.md
├─ backend/
│  ├─ src/
│  │  ├─ index.js        boot: config, store, listen
│  │  ├─ app.js          express app, middleware, routes
│  │  ├─ config.js
│  │  ├─ routes/         trips.js · intent.js · meta.js
│  │  ├─ services/       tripService.js
│  │  ├─ ai/
│  │  │  ├─ gateway.js   provider chain, cache, repair loop
│  │  │  ├─ json.js      extract JSON from model text
│  │  │  ├─ providers/   aiStudio.js · ollama.js
│  │  │  └─ prompts/     shared.js · intent.js · plan.js · reshape.js · tradeoff.js · repair.js
│  │  ├─ domain/         schemas.js · budget.js · feasibility.js · diff.js
│  │  ├─ store/          index.js · memoryStore.js · mongoStore.js
│  │  ├─ middleware/     errors.js · rateLimit.js
│  │  └─ data/           destinations.json · demo-trip.json
│  └─ .env.example
└─ frontend/
   └─ src/
      ├─ main.jsx · App.jsx · api.js · index.css
      ├─ pages/          Landing.jsx · Plan.jsx · Trip.jsx
      ├─ components/     MagicInput · PreferenceForm · TripHeader · DayCard · ActivityItem
      │                  BudgetBar · EnergyMeter · ReshapeBar · ChangePanel · TradeoffCards
      │                  ModelBadge · LoadingStory · ErrorState
      └─ hooks/          useTrip.js
```

## 20. Deployment architecture
- **Single service:** Express serves the built React app (`frontend/dist`) as static files plus `/api`. One URL, no CORS, one deploy. *Why:* halves deploy and debug time.
- **Host:** Render (free web service) or Railway, from the GitHub repo. Build: `npm run build` (frontend) then `node backend/src/index.js`.
- **DB:** MongoDB Atlas M0 (free), IP allowlist `0.0.0.0/0` for the hackathon.
- **Demo plan:** present from **localhost** (no cold starts, no venue Wi-Fi surprises for the app itself); the deployed URL is for judges and the submission. Warm the deployed instance 5 minutes before judging (free tiers sleep).
