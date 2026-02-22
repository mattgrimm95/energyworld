# Energy World

A web app with a 3D globe to explore energy, export, and import statistics by country. Built with React, Vite, react-globe.gl, Fastify, PostgreSQL, and Drizzle.

**Requirements:** Node.js 18+ and Docker (optional, for PostgreSQL).

## Quick start

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Start PostgreSQL** (if using Docker)
   ```bash
   docker compose up -d postgres
   ```

3. **Configure database** (optional; defaults work with Docker Compose)
   - Copy `.env.example` to `.env` and set `DATABASE_URL` if needed.

4. **Run migrations and seed**
   ```bash
   npm run db:migrate --workspace=server
   npm run db:seed --workspace=server
   ```

5. **Start backend and frontend**
   ```bash
   npm run dev:server
   npm run dev:client
   ```
   - API: http://localhost:3000  
   - App: http://localhost:5173 (proxies `/api` to the server)

## Scripts

| Command | Description |
|--------|-------------|
| `npm run dev:client` | Start Vite dev server (client) |
| `npm run dev:server` | Start Fastify dev server (API) |
| `npm run build:client` | Build client for production |
| `npm run build:server` | Build server for production |
| `npm run db:generate` | Generate Drizzle migrations (server) |
| `npm run db:migrate` | Run migrations (server) |
| `npm run db:seed` | Seed countries and stats (server) |
| `npm run db:studio` | Open Drizzle Studio (server) |

## Deployment

- **Client:** Build with `npm run build:client`. Serve the `client/dist` folder with Nginx, Vercel, Netlify, or any static host. Point the app’s API base URL to your backend (e.g. via env or proxy).
- **Server:** Set `DATABASE_URL` and run `npm run build:server` then `npm run start` (from the `server` directory). Run behind a process manager (e.g. PM2) or in a container. Set CORS to your production frontend origin (e.g. in Fastify CORS config).
- **Database:** Use a managed PostgreSQL instance (e.g. Neon, Supabase, RDS) and run migrations + seed in your deploy pipeline.

## Data

Seed data includes sample countries (USA, China, Germany) and example energy/export/import stats. To use real data, replace the seed script with imports from World Bank, IEA, or UN Comtrade (see plan) and re-run `npm run db:seed`.
