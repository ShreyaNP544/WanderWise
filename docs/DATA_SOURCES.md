# WanderWise — Real-world Data Grounding

Flow: **real-world data → Gemma reasoning → code verification → personalised plan.**
Gemma never supplies a live fact; it chooses and explains. Provenance is assigned by code, not claimed by the model.

All external sources are free, need **no API keys**, are called **only from the backend**, have a **5 s timeout**, are **cached**, and are **optional**: if one fails, the trip is still planned and the UI says what is missing.

| # | Source | Value | Failure mode | Fallback | What Gemma receives |
|---|---|---|---|---|---|
| 1 | **Curated dataset** (`backend/src/data/destinations.json`) | Typical stay/food/transport prices, routes and travel times from Delhi/Mumbai/Bengaluru, attractions with entry costs, savings levers. Drives the budget floor and feasibility check | Destination not covered | Live sources below + AI estimates, clearly labelled | `<baseline_data>` JSON |
| 2 | **Geocoding**: Open-Meteo Geocoding (GeoNames) | Confirms the place exists; coordinates for places + weather; straight-line distance from origin | Ambiguous names (e.g. "Manali" also matches a Chennai suburb); API down | Curated destinations use fixed coordinates; region hints ("Chikmagalur, Karnataka") must match the result's state; otherwise skip | `location`, `straightLineDistanceFromOriginKm` |
| 3 | **Points of interest**: Wikipedia GeoSearch (10 km) + short descriptions | Real, notable places near the destination, so Gemma picks from real options instead of inventing them | Few results in small towns; administrative pages | Filter keeps attractions (temple, fort, lake, falls, peak…) and drops admin pages; with no results, activities stay "AI estimate" | `realPlacesNearby: ["Hidimba Devi Temple (Hindu temple…)", …]` |
| 4 | **Weather**: Open-Meteo daily forecast | Gemma moves outdoor or strenuous plans off rainy days; UI shows a per-day forecast | Trip dates > 16 days away, no dates, or API down | **No forecast is invented.** Prompt says "do not state weather as fact"; UI explains why no forecast is shown | `weatherForecast: ["Day 1 2026-10-12: Clear, 9–22°C, rain 5%", …]` or an explicit "no forecast" instruction |
| 5 | **Maps**: Google Maps search deep-link per activity | One tap to see a place on a map | None (it's just a URL) | n/a | nothing |

## Deliberately not integrated
| Idea | Why not |
|---|---|
| Routing / directions APIs | Need keys and billing; curated routes + straight-line distance cover planning-level accuracy |
| Live hotel / flight / train prices | No reliable free source; scraping is fragile. We show typical prices and say so |
| Overpass (OpenStreetMap) POIs | Frequently slow or timing out; Wikipedia GeoSearch is faster and returns better-known places |
| Embedded interactive map | Big UI cost, small planning value for a demo |

## Provenance labels in the UI (assigned by code)
| Label | Meaning |
|---|---|
| **Curated data** | Activity matches the WanderWise dataset (place + typical cost) |
| **Real place** ✓ | Activity matches a Wikipedia article near the destination (links to it). The place exists; the cost is an estimate |
| **AI estimate** | Suggested by Gemma, not matched to any source |

Weather chips appear only from a real forecast. Budget totals are always computed by code from line items.

## Where it lives
`backend/src/grounding/`: `geo.js`, `places.js`, `weather.js`, `http.js` (timeout + cache), `index.js` (`buildContext`, `contextForPrompt`).
Prompt block: `liveDataBlock()` in `backend/src/ai/prompts/shared.js`. Provenance: `annotateProvenance()` in `backend/src/domain/planOps.js`.
