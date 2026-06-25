# 2DManim

2DManim is now a TypeScript Next.js application for creating AI-powered Manim animation jobs from natural language prompts.

The current implementation follows the MVP contracts in `SYSTEM_DESIGN.md`:

- Next.js app router for UI and API routes
- local token auth
- chat/message/job/video records
- `POST /api/generations` creates a queued generation job and returns quickly
- `GET /api/jobs/:id` polls job progress and returns generated Manim code
- local JSON persistence in `.data/db.json` for development

The production design still expects Postgres, Redis/BullMQ, workers, Dockerized Manim rendering, and S3/CDN delivery. The current local storage and deterministic job progression are intentionally shaped so those pieces can replace the local adapter later without rewriting the UI.

## Stack

- App: Next.js 14 + React + TypeScript
- UI: Material UI
- Local auth: HMAC-signed bearer tokens
- Local persistence: `.data/db.json`
- Future infrastructure: Postgres, Redis/BullMQ, worker service, Docker Manim renderer, S3-compatible storage

## Local Development

Install dependencies:

```bash
npm install
```

Start the app:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

Build check:

```bash
npm run build
```

## Environment

Copy the example file if needed:

```bash
cp .env.example .env
```

Important local variables:

- `AUTH_SECRET`
- `DATABASE_URL`
- `GEMINI_API_KEY`
- `GEMINI_MODEL`
- `MISTRAL_API_KEY`
- `MISTRAL_MODEL`

Future production variables are also listed in `.env.example`:

- `REDIS_URL`
- `S3_BUCKET`
- `S3_REGION`
- `S3_ENDPOINT`
- `CDN_BASE_URL`

## Prisma

The Prisma schema lives at:

```text
prisma/schema.prisma
```

Generate the Prisma client:

```bash
npm run db:generate
```

Validate the schema:

```bash
npm run db:validate
```

Apply the schema to a local Postgres database:

```bash
npm run db:push
```

Create a migration once the schema is ready to commit as a database change:

```bash
npm run db:migrate
```

## Docker

The app container now serves Next.js on port `3000`:

```bash
docker compose up --build app
```

Local development data is mounted at:

```text
.data
```
