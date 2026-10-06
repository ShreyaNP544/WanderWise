# WanderWise

**Your AI travel architect.** Tell WanderWise what kind of trip you want. It designs the trip, explains its choices, balances your budget, and lets you reshape the trip through conversation. Powered by Gemma.

Built for the Hacktoberfest × MLH Gemma hackathon. Problem statement #14: AI Travel Planner.

> 🚧 Work in progress.
>
> - [Product plan](docs/PRODUCT.md)
> - [Technical architecture](docs/ARCHITECTURE.md)
> - [AI / Gemma layer design](docs/AI_DESIGN.md)

## Run locally

```bash
# API
cd backend
cp .env.example .env   # add GEMINI_API_KEY
npm install
npm run dev            # http://localhost:5000

# Web
cd frontend
npm install
npm run dev            # http://localhost:5173
```
