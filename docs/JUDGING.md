# WanderWise — Technical Judging Guide (AI / Gemma)

Everything here maps to code in this repo and to runs recorded in [EVAL.md](EVAL.md). Nothing is projected or simulated.

**Model:** `gemma-4-26b-a4b-it` (Google AI Studio, `thinkingLevel: minimal`), falling back to `gemma-4-31b-it`, then local Gemma via Ollama (`gemma3:4b`).
**One-line architecture:** *real-world data → Gemma reasons → code verifies → personalised plan.*

---

## 1. Exactly where is Gemma used?
All model access goes through one function, `generateJSON()` in [`backend/src/ai/gateway.js`](../backend/src/ai/gateway.js). It is called from three places in [`backend/src/ai/index.js`](../backend/src/ai/index.js):

| Function | Task | Prompt builder | Output schema |
|---|---|---|---|
| `generatePlan()` | Design a full day-by-day trip | [`prompts/plan.js`](../backend/src/ai/prompts/plan.js) | `PlanSchema` |
| `editPlan()` | Remix an existing plan; also used for budget repair and correction passes | [`prompts/modify.js`](../backend/src/ai/prompts/modify.js) | `ModifiedPlanSchema` |
| `proposeTradeoffs()` | Explain an impossible request and offer 2–3 costed options | [`prompts/conflict.js`](../backend/src/ai/prompts/conflict.js) | `ConflictSchema` |

Schemas: [`backend/src/domain/planSchema.js`](../backend/src/domain/planSchema.js). Orchestration: [`backend/src/services/tripService.js`](../backend/src/services/tripService.js).

## 2. Why is Gemma necessary?
The tasks that need language understanding and judgment are done by Gemma; nothing else in the system can do them:
- turning "make day 3 more relaxed" or "I'm travelling with my parents" into concrete edits of specific activities
- choosing and sequencing activities from real places for a specific traveller (interests, pace, diet, group)
- deciding what to keep and what to cut when money or time is short, and explaining why
- writing trade-off options when a request can't be met

Code handles everything that must be exact: arithmetic, constraint checks, diffs, provenance. Each part does what it is reliable at.

## 3. What if we replaced Gemma with a generic chatbot?
Asked the same things, a chat model returns prose. It would not:
- produce a plan whose **totals are recomputed** from line items (`backend/src/domain/budget.js`)
- **guarantee untouched days stay identical** (`applyScope()` in `backend/src/domain/planOps.js`)
- **show an exact before/after** computed from stable activity IDs (`backend/src/domain/diff.js`)
- **refuse an impossible request** with costed options, based on a deterministic cost floor (`backend/src/domain/feasibility.js`)
- **mark which places are real**: provenance is assigned by code, not claimed by the model

The model is replaceable (a provider is ~40 lines: `ai/providers/aiStudio.js`, `ai/providers/ollama.js`). The *system* around it is the product.

## 4. Structured reasoning tasks Gemma performs
| Task | Where | Evidence |
|---|---|---|
| Multi-day planning under a budget cap, pace and group constraints | `generatePlan` | 5 destinations generated in EVAL.md |
| Preference prioritisation (explicit priority order in every prompt) | `PRIORITY_ORDER` in `prompts/shared.js` | `tradeoffNotes` in outputs |
| Minimal-edit modification with ID preservation | `editPlan` + editing rules in `prompts/modify.js` | e.g. 11/11 activities kept on a budget cut |
| Strategy-specific edits (budget, fatigue, family, food, hidden gem, adventure, stay, timing, replace) | `STRATEGIES` in `prompts/modify.js`, routed by `domain/instruction.js` | Remix table in EVAL.md |
| Conflict explanation + trade-off generation | `proposeTradeoffs` | "30% cheaper" and "parents" conflicts in EVAL.md |

## 5. How do we control hallucinations?
1. **Grounding in the prompt:** curated prices, routes and attractions (`<baseline_data>`) plus live data (`<live_data>`: geocoded location, real nearby places from Wikipedia, Open-Meteo forecast). See `prompts/shared.js`.
2. **Honesty rules in every prompt** (`HONESTY_RULES`): no opening hours, ticket prices, train numbers or permits stated as fact; uncertain things go to `checkBefore`; no invented hotel names.
3. **The model cannot mark anything verified.** `annotateProvenance()` in `domain/planOps.js` labels each activity `baseline` / `real_place` / `ai_estimate` by matching against the dataset and Wikipedia places. The destination's own name is excluded from matching, so "Check-in and rest, Manali" can't be passed off as a real place.
4. **Weather is never generated.** If no forecast exists, the prompt says so explicitly and the UI shows no weather chip.
5. **Fake places are rejected before Gemma is called:** an unknown destination returns 400 (QA case 5).
6. **Claims are checked against data:** if Gemma says "added paragliding" but the plan data has no new adventure activity, `unmetRequirement()` in `tripService.js` triggers a correction pass, then an honest warning or `NO_CHANGE`.

## 6. How do we validate model output?
Four layers, in order (`ai/gateway.js`, `ai/index.js`, `tripService.js`):
1. **Extraction:** `extractJson()` (`ai/json.js`) handles fences, prose and trailing commas. Gemma 4's reasoning parts (`thought: true`) are dropped at the provider.
2. **Schema:** zod `safeParse` against the task schema.
3. **Semantics:** exact day count and numbering (`dayCountCheck`), unique IDs (`normalizeIds`), avoid-list, notBefore times, unrealistic food spend, stay price vs dataset tier (`constraintWarnings`).
4. **Budget:** `computeBudget()` recomputes everything; over the cap, Gemma gets one targeted repair pass (`enforceBudget`), then the UI shows an honest "over by ₹X".

Failure at layers 1–3 triggers one repair prompt with the exact error, then the next provider.

## 7. How does the model modify an existing itinerary?
`runModification()` in `tripService.js`:
1. **Code parses the request first** (`parseInstruction`): budget (₹, "15k", "30% cheaper"), travellers, "parents", days, diet, earliest start, day scope ("day 3"), things to keep, and which strategies apply. Instant and deterministic.
2. **Feasibility check (code):** if the new constraints are below the cost floor, Gemma writes trade-offs instead of a plan.
3. **Gemma edits the current plan** with: the compact current plan, what the system understood, scope, must-keep items, budget gap, strategy blocks, and the rule "keep unchanged activities with the same id".
4. **Code enforces the scope:** days outside the request are restored from the previous version.
5. **Code verifies the request was actually applied** (`unmetRequirement`), recomputes the budget, diffs versions by ID, and saves a new version (undo = previous version).

Real excerpt of what Gemma is told for "I don't want to wake up before 8 AM" (generated by the code, not hand-written):
```
## What the system understood
Updated constraints:
- notBefore: undefined → "08:00"
Scope: The whole trip, but change only what the request requires.
Must keep represented: Mountains, Photography
```

## 8. How do external data and AI interact?
`buildContext()` in [`backend/src/grounding/index.js`](../backend/src/grounding/index.js) runs **before** Gemma, in parallel, with 5 s timeouts and caching:

| Source | Used for | Passed to Gemma as |
|---|---|---|
| Curated dataset (12 destinations) | Prices, routes from Delhi/Mumbai/Bengaluru, attractions, savings levers, **cost floor** | `<baseline_data>` JSON |
| Open-Meteo Geocoding | Location, distance from origin | `location`, `straightLineDistanceFromOriginKm` |
| Wikipedia GeoSearch | Real places within 10 km | `realPlacesNearby` |
| Open-Meteo Forecast | Daily weather when the trip is ≤ 16 days away | `weatherForecast` (or an explicit "no forecast, don't state weather") |
| Wikipedia/Commons images | Destination and activity photos (UI only) | not sent |

After Gemma answers, the same data is used to **check** it (provenance, cost sanity). Details: [DATA_SOURCES.md](DATA_SOURCES.md).

## 9. What happens when external data is unavailable?
Each source returns `null` within its timeout and planning continues (verified in `scripts/qa-failures.js`: dead API → null in 2 ms; slow API → null at the 1.5 s test timeout; unknown place → empty context, no crash). The prompt then tells Gemma the data is missing, activities are labelled **AI estimate**, and the UI's "Grounded in real data" card says what was missing. If Gemma itself is unavailable: retry once → `gemma-4-31b-it` → Ollama → a clean 503 "Gemma is busy" in ~2 s (measured with a bad key), and the instant sample trip still works.

## 10. Evaluation examples
All in [EVAL.md](EVAL.md), produced by scripts in `backend/scripts/`:
- `scenarios.js`: 4 trips (Goa, Rishikesh, Jaipur family, Chikmagalur with no curated data) and 6 chained edits
- `remix-test.js`: 6 remix requests on the sample trip
- `check-domain.js`: offline checks of parsing, feasibility, provenance, JSON extraction (all pass)
- `qa.js`: 19 API edge cases (19/19 pass); `qa-failures.js`: 7 failure modes (7/7 pass)

## 11. Metrics we can demonstrate (measured, not estimated)
| Metric | Value | Source |
|---|---|---|
| Plan generation latency | 33–80 s (4 trips) | EVAL.md scenario run |
| Remix latency | 37–89 s; conflicts ~10–12 s | EVAL.md |
| Activities preserved on edits | 11/11 (budget cut), 10/11 (day 3), 8/9 (hidden gem) | EVAL.md |
| Scope guard | days outside the request identical in every day-scoped test | EVAL.md notes |
| Impossible requests caught | 3/3 ("parents" ×2, "30% cheaper") | EVAL.md |
| Grounding coverage, sample trip | 6 of 8 activities matched to curated data | sample trip "Grounded" card |
| API edge cases / failure modes | 19/19, 7/7 | `qa.js`, `qa-failures.js` |
| Gemma errors survived | Google returned 500/503 several times today; retry/fallback handled them | server logs, EVAL.md |

## 12. Examples that the AI respects user constraints
- **Budget cap:** "₹25,000 → ₹18,000, keep beach and food": total ₹16,380 under the new cap, beaches and food listed as preserved.
- **Day scope:** "Make day 3 less tiring": only day 3 changed; days 1, 2, 4, 5 restored by code if touched.
- **Time:** "Not before 8 AM": the single 08:00 activity moved to 09:00, nothing else changed.
- **Group:** "Parents are coming": 4 travellers don't fit the budget, so trade-offs were offered, including a budget raised to ≥ floor × 1.15 (enforced by `normalizeOptions`).
- **Family with kids (Jaipur):** max day energy 2, no strenuous activity.

---

## Example model output (real, from the sample trip)
Generated by `gemma-4-26b-a4b-it` in 40.8 s, not repaired, no fallback. One activity after code annotation:
```json
{
  "id": "d2a1", "time": "10:00", "title": "Hadimba Devi Temple Visit", "place": "Hadimba Devi Temple",
  "category": "culture", "costPerPerson": 0, "durationHrs": 1, "energy": 1,
  "why": "Iconic wooden architecture perfect for mountain photography.", "confidence": "high",
  "source": "baseline", "baselineName": "Hadimba Devi Temple", "baselineCost": 0,
  "placeName": "Hidimba Devi Temple", "placeUrl": "https://en.wikipedia.org/wiki/Hidimba_Devi_Temple"
}
```
Gemma wrote the first 10 fields. **Code** added `source`, `baseline*` and `place*`. Budget computed by code from all line items:
`stay ₹2,000 · transport ₹8,800 · food ₹3,600 · activities ₹1,800 · buffer ₹810 = ₹17,010 of ₹20,000`.

## Prompt structure (real, `buildPlanPrompt`, ~6.7k characters)
```
You are WanderWise, a meticulous Indian travel planner…
## Task
<traveller_brief>…</traveller_brief>
<baseline_data>{curated prices, routes, attractions, savings levers}</baseline_data>
<live_data source="Open-Meteo, Wikipedia">{location, realPlacesNearby, weatherForecast}</live_data>
## Computed by the system      ← cost floor, travel hours
## When constraints conflict, follow this priority
## Planning rules · ## Cost rules · ## Honesty rules
## Output                      ← exact JSON shape
Return ONLY the JSON object.
```
User text is always inside delimiters and labelled as data, not instructions.

## Failure cases we found (and what we did)
| Found | Fix |
|---|---|
| "Manali" geocoded to a Chennai suburb | Curated coordinates; region hint must match the result's state |
| "Check-in and Rest" labelled a real place (shared word "Manali") | Destination name excluded from provenance matching |
| "Under 16,000" (no ₹) ignored, so Gemma's claim of fitting went unchecked | Bare amounts after budget words parsed |
| Raised-budget option equal to the bare floor, still over | Code enforces ≥ floor × 1.15 |
| Gemma described changes it never made (paragliding, hotel upgrade) | Per-request data checks, correction pass, honest warning / `NO_CHANGE` |
| Unrelated remix cut food to ₹200/day on an over-budget trip | Cost-cutting only for cost-related requests; low food spend flagged |
| Gemma labelled a ₹900 room "mid-tier" (dataset ~₹2,500) | Stay price checked against dataset tier |

**Known limitations, stated honestly:** generation takes 30–90 s on the free hosted endpoint; prices are typical estimates, not live quotes; Wikipedia photo coverage varies by place; curated route data covers Delhi, Mumbai and Bengaluru origins.

## Fallback strategy (summary)
| Failure | Behaviour |
|---|---|
| Transient 5xx | 1 retry after 1.5 s |
| Primary model down / rate-limited / timeout (90 s) | `gemma-4-31b-it` (162 s timeout) → Ollama local Gemma |
| Invalid JSON / schema / semantics | 1 repair prompt with the exact error, then next provider |
| All providers fail | 503 "Gemma is busy", plan on screen unchanged; sample trip still instant |
| External data down | That source is skipped; prompt and UI say so |
| MongoDB down | In-memory store at boot |
| Repeated rehearsal requests | 6 h response cache: identical prompts replay instantly |
