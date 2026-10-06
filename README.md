# WanderWise

**Your AI travel architect.** Tell WanderWise the trip you want. It designs every day, explains its choices, balances your budget, and lets you reshape the plan just by saying what changed. Powered by open-source **Gemma 4**.

Built for the Hacktoberfest × MLH Gemma hackathon. Problem statement #14: *AI Travel Planner*.

## What makes it different
- **Reshape, don't regenerate.** "Bring it under ₹15,000 but keep the photography spots" edits the existing plan. Changes are highlighted, and what was deliberately kept is listed.
- **Budgets that add up.** Gemma proposes line items; WanderWise's budget engine does the maths and asks Gemma to fix overruns.
- **Honest trade-offs.** Impossible requests (4 people, ₹15,000, 5 days) are caught by code, and Gemma offers costed options instead of a fake plan.
- **Grounded in real data.** Curated prices and routes, real places from Wikipedia, live weather from Open-Meteo. Every activity is labelled *Curated*, *Real place* or *AI estimate*.
- **Scope-safe edits.** Ask about day 2 and days 1, 3, 4 are guaranteed unchanged (enforced in code).

## Stack
MERN: **React** (Vite, Tailwind) · **Express** · **MongoDB** (optional; in-memory fallback) · **Node.js**
AI: **Gemma 4 26B-A4B** via Google AI Studio → Gemma 4 31B → local Gemma via Ollama (automatic fallback chain).

## Run locally
```bash
npm run install:all
cp backend/.env.example backend/.env    # add GEMINI_API_KEY (and optionally MONGODB_URI)
npm run dev                             # API :5000 · web :5173
```

## Docs
- [Product plan](docs/PRODUCT.md)
- [Technical architecture](docs/ARCHITECTURE.md)
- [AI / Gemma layer design](docs/AI_DESIGN.md)
- [Real-world data sources](docs/DATA_SOURCES.md)
- [Technical judging guide (AI/Gemma)](docs/JUDGING.md)
- [Evaluation run](docs/EVAL.md)
- [Demo script](docs/DEMO.md)
- Photo credits: [frontend/public/images/CREDITS.md](frontend/public/images/CREDITS.md)
