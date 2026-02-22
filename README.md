# Energy World

A web app with a 3D globe to explore energy, export, and import statistics by country. Built with React, Vite, react-globe.gl, Fastify, SQLite, and Drizzle.

**Requirements:** Node.js 20+ (see setup below).

## Setup

### 1. Install Node.js 20 via fnm

If you don't already have Node 20+, install [fnm](https://github.com/Schniz/fnm) (Fast Node Manager):

```powershell
winget install Schniz.fnm
```

Close and reopen your terminal, then run:

```powershell
fnm install 20
fnm use 20
fnm default 20
```

Add this line to your PowerShell profile so fnm activates automatically (`notepad $PROFILE`):

```powershell
fnm env --use-on-cd --shell power-shell | Out-String | Invoke-Expression
```

Verify:

```powershell
node --version   # You should see v20.20.0 (or another v20.x.x)
```

After that you can run the app: from the project root run `npm run db:migrate`, `npm run db:seed`, then `npm run dev:server` and `npm run dev:client` in two terminals.

### 2. Install dependencies

```powershell
cd energyworld
npm install
```

### 3. Create the database and seed it

No Docker or external database needed -- this uses SQLite (a local file).

```powershell
npm run db:migrate
npm run db:seed
```

### 4. Start the app

Open **two terminals** (both in the `energyworld` folder):

**Terminal 1 -- API server:**

```powershell
npm run dev:server
```

**Terminal 2 -- Frontend:**

```powershell
npm run dev:client
```

- API: http://localhost:3000
- App: http://localhost:5173 (proxies `/api` to the server automatically)

Open http://localhost:5173 in your browser, rotate the globe, and click a country.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev:client` | Start Vite dev server (frontend) |
| `npm run dev:server` | Start Fastify dev server (API) |
| `npm run build:client` | Build frontend for production |
| `npm run build:server` | Build server for production |
| `npm run db:generate` | Generate Drizzle migrations from schema changes |
| `npm run db:migrate` | Run database migrations |
| `npm run db:seed` | Seed sample countries and stats |
| `npm run db:fetch` | Fetch latest stats from World Bank API and upsert into DB |

## Data

### Source

The seed data is **curated in code**, not downloaded at runtime. Values for **2015–2022** are based on real-world references:

- **Energy consumption** (TWh): [IEA](https://www.iea.org/), [BP Statistical Review of World Energy](https://www.bp.com/statisticalreview), [EIA](https://www.eia.gov/).
- **Exports / Imports** (billion USD): [World Bank Open Data](https://data.worldbank.org/) (trade in goods and services).

**2023–2026** are **extrapolated** from 2022 using simple annual growth rates (about 1.5% for energy, 3% for trade) so the app can show a “latest year” and time series through 2026. They are illustrative, not official.

### How it gets ingested

1. **Seed data** lives in `server/src/db/seed-data.ts`: country list (ISO3 + name) and three metric objects (energy consumption, exports, imports) with one value per country per year for 2015–2022.
2. **Seed script** `server/src/db/seed.ts` runs on `npm run db:seed`. It clears the SQLite DB, inserts all countries, then for each metric and country inserts one row per year. For years **after the last year in the file** (e.g. 2023–2026), it **extrapolates** from the last known value using the growth rates above, so no manual 2023–2026 figures are required in `seed-data.ts`.
3. The result is written to **`server/data/energyworld.db`** (SQLite). The API reads from this file; nothing is fetched from external APIs when you run the app.

To refresh or change data, edit `server/src/db/seed-data.ts` (and optionally the extrapolation logic in `seed.ts`), then run `npm run db:seed` again.

### Pull latest from APIs

You can refresh the database with **latest data from the World Bank** (no API key required):

```powershell
npm run db:fetch
```

This runs `server/src/db/fetch-latest.ts`, which:

1. **Fetches** from the [World Bank API v2](https://datahelpdesk.worldbank.org/knowledgebase/articles/889392-about-the-indicators-api-documentation) (public, no auth):
   - **NE.EXP.GNFS.CD** — Exports of goods and services (current US$) → stored as billion USD
   - **NE.IMP.GNFS.CD** — Imports of goods and services (current US$) → stored as billion USD
   - **EG.USE.ELEC.KH** — Electric power consumption (kWh) → converted to TWh (note: this is *electricity* consumption, not total primary energy)
2. **Upserts** into `server/data/energyworld.db`: for each (country, year, metric) in the response, it replaces any existing row then inserts the new value. Only countries already in the DB (from seed) are updated.

**Optional env:** `FETCH_YEAR_START` and `FETCH_YEAR_END` (default: 2018 through current year). Example:

```powershell
$env:FETCH_YEAR_START="2020"; $env:FETCH_YEAR_END="2024"; npm run db:fetch
```

Run `npm run db:seed` first so the countries table is populated; then `npm run db:fetch` can fill or refresh stats from the World Bank.
