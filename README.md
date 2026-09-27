# GridSense Web App

The production frontend for **GridSense**, the consumer energy intelligence product from Evervia Innovations Ltd. GridSense helps UK home users, landlords, building owners, and developers understand what their energy costs, what it should cost, and exactly when to act to save money.

**Live:** [gridsense.evervia.co.uk](https://gridsense.evervia.co.uk)

## What it does

- **Live UK grid view:** real-time demand, price, frequency, renewable mix, and carbon intensity
- **48 hour AI demand forecast:** a Random Forest model using weather regressors (R² 0.9838 and MAE 399 MW under time-series cross-validation), retrained weekly on 18 months of data
- **Postcode intelligence:** maps a postcode to its DNO region and current Ofgem price cap rates, then lists addresses with their EPC property profile
- **Peak and off-peak alerts:** the best upcoming windows to shift usage, based on the forecast
- **Bill intelligence:** users upload an energy bill, an LLM (Claude) extracts consumption and rates, and the system compares actual usage against the EPC baseline and estimates supplier switch savings
- **Accounts and billing:** Supabase authentication and Stripe checkout across three tiers (Essential, Premier, Elite)

## Tech stack

- Next.js 14 (App Router) with TypeScript
- Tailwind CSS
- Chart.js via react-chartjs-2
- Supabase Auth (JWT sent to the backend on every request)
- Stripe billing through the Evervia API
- Docker multi-stage build with Next.js standalone output
- Deployed with Coolify on a Hetzner VPS
- Backend: Python API, self-hosted Postgres, n8n for scheduled pipelines, Claude API for bill extraction

## Architecture

The app is the client for three backend intelligence engines:

```
Browser (Next.js app)
   |  Supabase session token
   v
Evervia API (Python, Dockerised on Hetzner VPS)
   |
   |-- Engine 1: Grid Intelligence
   |     Elexon BMRS, Carbon Intensity API, Open-Meteo weather,
   |     Random Forest forecast, postcode to DNO region and tariffs
   |
   |-- Engine 2: Property Intelligence
   |     11.5M domestic and 622k commercial EPC records,
   |     with OS Places address lookup
   |
   |-- Engine 3: Bill Intelligence
   |     LLM bill extraction, usage gap analysis,
   |     supplier switch savings, peak/off-peak alerts
   |
   v
Postgres (self-hosted) + Supabase (Auth)       Stripe (billing)
```

Scheduled jobs retrain the forecast model weekly and refresh Ofgem price cap tariffs every Monday.

The frontend is a thin client. All data access, tier checks, and billing run server-side in the Evervia API. The app attaches the user's Supabase token to each request through a single `apiFetch` helper in `lib/api.ts`.

## Project structure

```
app/
  page.tsx        Minimal wrapper: styles + AuthGate
  components/
    AuthGate.tsx  Routes between landing page, auth, and dashboard
    landing/      Savings calculator, FAQ, footer
    dashboard/    KPIs, forecast chart, business intelligence,
                  home savings, bill report, pricing, support
  lib/            Pure helpers and shared types
lib/
  api.ts          Authenticated API client
  supabase.ts     Supabase client
Dockerfile        Production container
```

The app was refactored from a single 1,900-line page into per-component files so each feature can change without touching unrelated code.

## Running locally

```bash
npm install
cp .env.example .env.local   # then add your values
npm run dev
```

Required environment variables:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_API_URL=
```

## Deployment

Production deploys build from `main` using the Dockerfile:

```
npm run build  ->  git push  ->  Coolify redeploy
```

To run the container yourself:

```bash
docker build -t gridsense .
docker run -p 3000:3000 --env-file .env.local gridsense
```

## Status

In active development. Backend services are private; this repo contains the public client only.

## Author

**Nnamdi Onuigbo**, Founder and AI Systems Engineer, Evervia Innovations Ltd
