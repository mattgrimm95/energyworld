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
node --version   # should show v20.x.x
```

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

## Data

Seed data includes three countries (USA, China, Germany) with energy consumption, export, and import stats for 2022. To add real data, update the seed script and re-run `npm run db:seed`.
