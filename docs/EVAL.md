# WanderWise — Evaluation Run

Real end-to-end runs against **Gemma 4 26B-A4B** (Google AI Studio, `thinkingLevel: minimal`), 6 Oct 2026.
Reproduce: `cd backend && node --env-file=.env scripts/scenarios.js`. Offline logic checks: `node scripts/check-domain.js`.

Totals are computed by WanderWise's budget engine, not by the model. "Baseline" = activity matched to the curated dataset.

| # | Scenario | Step | Result | Time |
|---|---|---|---|---|
| 1 | Mumbai → Goa, 2 friends, 5 days, ₹25,000, beaches/food/nightlife | Generate | 5 days, ₹18,480 (within), 11 activities, 6 grounded in baseline | 45.6 s |
| 1 | | "Reduce the budget from ₹25,000 to ₹18,000 but keep the beach and food experiences." | Applied. ₹18,480 → ₹16,380. All 11 activities kept; savings from stay/transport/food. Model listed beaches + food as preserved | 44.4 s |
| 1 | | "Make day 3 less tiring" | Applied. Only day 3 touched; scope guard confirmed days 1, 2, 4, 5 identical | 43.6 s |
| 1 | | "Actually, we're travelling with my parents now" | **Conflict detected by code** (4 people need ≥ ₹29,600; budget ₹18,000). Gemma offered: raise budget / shorten to 3 days / fewer travellers | 9.7 s |
| 1 | | Choose "raise budget" | Applied for 4 travellers, relaxed energy (12221 → 12121), but ended ₹3,160 over. **Fixed after this run:** raised-budget options are now forced ≥ 15% above the floor | 88.7 s |
| 2 | Delhi → Rishikesh, solo, 3 days, ₹12,000, adventure/spiritual, packed | Generate | 3 days, ₹7,487, 9 activities (7 baseline) | 37.0 s |
| 2 | | "Add one hidden-gem experience" | Applied. +1 (Vashistha Gufa cave), −1, 8 unchanged; budget ₹7,434 | 38.4 s |
| 3 | Delhi → Jaipur, family of 4 with a 6-year-old, 3 days, ₹30,000 | Generate | 3 days, ₹19,320, 9 activities (7 baseline), max energy 2 | 79.5 s |
| 3 | | "I care more about food than sightseeing" | Applied. +2 food experiences, −1, core heritage sights kept; ₹24,570 (within) | 84.0 s |
| 4 | Bengaluru → Chikmagalur (no curated data), couple, veg, 4 days, ₹20,000 | Generate | 4 days, ₹18,480; 0 baseline matches, so every item is shown as an AI estimate | 32.9 s |

## Remix My Trip run (sample trip: Delhi → Manali, 4 days, ₹17,010 of ₹20,000)
Reproduce against a running server: `node scripts/remix-test.js`.

| Request | Result | Time |
|---|---|---|
| "Make this trip 30% cheaper" | **Conflict, correctly.** 30% off (₹11,900) is below the ₹13,500 realistic floor for this route; Gemma offered raise budget / shorten / cheaper stays | 10.7 s |
| "Make day 3 more relaxed" | Day 3 only: later start, Solang swapped for a café block. Days 1, 2, 4 locked by the scope guard | 37.3 s |
| "I don't want to wake up before 8 AM" | The single 08:00 activity moved to 09:00; nothing else touched; knock-on effect flagged | 37.8 s |
| "Give me one adventurous activity" | **Bug found:** summary said "Added paragliding" but no activity was added. **Fixed:** additive requests are now verified against the diff, with a correction pass and an honest warning if Gemma still doesn't add it | 75.2 s |
| "Keep the budget unchanged but improve the hotel" | Hostel beds → private hotel room, total stayed within budget. **Found:** Gemma labelled ₹900/room "mid-tier" (dataset: ~₹2,500). **Fixed:** stay prices are now checked against the dataset tier and flagged | 70.6 s |
| "I'm travelling with my parents" | **Conflict, correctly.** 4 people need more than ₹20,000; options: ₹31,500 budget (code-enforced ≥ floor × 1.15) / 2 travellers / 3 days | 11.0 s |

## What this shows
- **Edits, not regenerations:** across 6 modifications, unchanged activities kept their IDs (e.g. 11/11, 10/11, 8/9 preserved).
- **Scope guard works:** a day-3 request cannot alter other days.
- **Honest conflicts:** impossible requests return trade-offs (in ~10 s, no plan generated) instead of a fake plan.
- **Provenance:** destinations without curated data are clearly estimate-only.

## Known issues found by this run (and status)
| Issue | Status |
|---|---|
| Raised-budget option equal to the bare-minimum floor → plan still over | Fixed: code enforces ≥ floor × 1.15 |
| "Cheapest version costs ₹X" shown even when X = the budget | Fixed: shown only when the floor exceeds the budget |
| "Less tiring" sometimes only shifts a start time | Prompt tightened (day must get lighter: fewer hours, no energy-3) |
| Model occasionally returns "None." as a warning | Filtered |
| Latency 35–90 s per call | Mitigated: narrated loading states + 6 h response cache for rehearsed demos |
