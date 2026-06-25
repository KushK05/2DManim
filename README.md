# 2DManim

2DManim is now a TypeScript Next.js application for creating AI-powered Manim animation jobs from natural language prompts.

The current implementation follows the MVP contracts in `SYSTEM_DESIGN.md`:

- Next.js app router for UI and API routes
- token auth backed by Postgres users
- Prisma-backed chat/message/job/video records
- `POST /api/generations` creates a queued generation job and returns quickly
- `GET /api/jobs/:id` polls job progress and returns job metadata
- BullMQ enqueues generation work into Redis
- worker service generates Manim code and optionally renders video through Docker

## Stack

- App: Next.js 14 + React + TypeScript
- UI: Material UI
- Local auth: HMAC-signed bearer tokens
- Database: Postgres + Prisma
- Queue: Redis + BullMQ
- Rendering: Dockerized Manim Community image
- Storage: S3-compatible object storage, including MinIO locally

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

## Local Postgres

If you do not use Docker Compose, run Postgres locally with:

```bash
docker run --name 2dmanim-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=2dmanim \
  -p 5432:5432 \
  -d postgres:16
```

Your local `.env` should include:

```text
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/2dmanim
```

## Local Redis

If you do not use Docker Compose, run Redis locally with:

```bash
docker run --name 2dmanim-redis \
  -p 6379:6379 \
  -d redis:7 redis-server --appendonly yes
```

Your local `.env` should include:

```text
REDIS_URL=redis://localhost:6379
```

Useful Redis checks:

```bash
docker exec -it 2dmanim-redis redis-cli ping
docker logs -f 2dmanim-redis
```

## Local Object Storage

Docker Compose starts MinIO for local S3-compatible object storage:

```text
API:     http://localhost:9000
Console: http://localhost:9001
Login:   minioadmin / minioadmin
Bucket:  2dmanim-videos
```

If you run MinIO manually instead of Compose:

```bash
docker run --name 2dmanim-minio \
  -p 9000:9000 \
  -p 9001:9001 \
  -e MINIO_ROOT_USER=minioadmin \
  -e MINIO_ROOT_PASSWORD=minioadmin \
  -d minio/minio server /data --console-address ":9001"
```

Then create a public-download bucket:

```bash
docker run --rm --network container:2dmanim-minio minio/mc \
  sh -c 'mc alias set local http://127.0.0.1:9000 minioadmin minioadmin && mc mb -p local/2dmanim-videos && mc anonymous set download local/2dmanim-videos'
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
- `ENABLE_DOCKER_RENDER`
- `MANIM_DOCKER_IMAGE`
- `MANIM_OUTPUT_DIR`
- `REDIS_URL`
- `OBJECT_STORAGE_BUCKET`
- `OBJECT_STORAGE_REGION`
- `OBJECT_STORAGE_ENDPOINT`
- `OBJECT_STORAGE_FORCE_PATH_STYLE`
- `OBJECT_STORAGE_ACCESS_KEY_ID`
- `OBJECT_STORAGE_SECRET_ACCESS_KEY`
- `OBJECT_STORAGE_PUBLIC_BASE_URL`
- `CDN_BASE_URL`

`OBJECT_STORAGE_*` is provider-neutral. It works with MinIO, Cloudflare R2, DigitalOcean Spaces, Backblaze B2, Wasabi, AWS S3, and other S3-compatible providers. The older `S3_*` names are still accepted as aliases.

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

## Worker

Start the BullMQ generation worker:

```bash
npm run worker:dev
```

The worker currently:

- listens on the `generation-jobs` BullMQ queue
- reads `{ jobId }` from each queue job
- atomically claims Postgres jobs whose status is `QUEUED` or `FAILED_RETRYABLE`
- generates Manim Python code with Gemini or Mistral when an API key is configured
- falls back to local mock Manim code when no AI provider key exists
- validates that generated code defines `GeneratedScene(Scene)` and avoids blocked Python APIs
- writes `JobStatusHistory` rows for each state transition
- marks jobs as code-only completed when Docker rendering is disabled
- renders MP4s through Docker when `ENABLE_DOCKER_RENDER=true`
- uploads rendered MP4s to S3-compatible object storage
- marks exhausted BullMQ retries as `DEAD_LETTER_QUEUE`

Set one of these for real AI code generation:

```text
GEMINI_API_KEY=...
# or
MISTRAL_API_KEY=...
```

Without an API key, the worker still completes jobs using deterministic local preview code.

## Local Manim Rendering

Pull the Manim Docker image:

```bash
docker pull manimcommunity/manim:stable
```

Enable rendering in `.env`:

```text
ENABLE_DOCKER_RENDER=true
MANIM_DOCKER_IMAGE=manimcommunity/manim:stable
MANIM_OUTPUT_DIR=public/generated/videos
MANIM_PUBLIC_BASE_PATH=/generated/videos
OBJECT_STORAGE_BUCKET=2dmanim-videos
OBJECT_STORAGE_REGION=us-east-1
OBJECT_STORAGE_ENDPOINT=http://localhost:9000
OBJECT_STORAGE_FORCE_PATH_STYLE=true
OBJECT_STORAGE_ACCESS_KEY_ID=minioadmin
OBJECT_STORAGE_SECRET_ACCESS_KEY=minioadmin
OBJECT_STORAGE_PUBLIC_BASE_URL=http://localhost:9000/2dmanim-videos
```

Rendered local videos are written to:

```text
public/generated/videos/<jobId>/output.mp4
```

The worker uploads that MP4 to object storage and stores the playable URL in Postgres. With local MinIO, the stored URL looks like:

```text
http://localhost:9000/2dmanim-videos/videos/<userId>/<jobId>/output.mp4
```

When running the worker inside Docker Compose, the worker container mounts `/var/run/docker.sock` so it can start Manim render containers on the host Docker daemon.

## Production Object Storage

For a non-Amazon provider, set `OBJECT_STORAGE_ENDPOINT` to the provider's S3-compatible endpoint and keep `OBJECT_STORAGE_FORCE_PATH_STYLE=true` if that provider expects path-style bucket URLs.

Example shape:

```text
OBJECT_STORAGE_BUCKET=2dmanim-videos-prod
OBJECT_STORAGE_REGION=auto
OBJECT_STORAGE_ENDPOINT=https://<provider-s3-endpoint>
OBJECT_STORAGE_FORCE_PATH_STYLE=true
OBJECT_STORAGE_ACCESS_KEY_ID=...
OBJECT_STORAGE_SECRET_ACCESS_KEY=...
OBJECT_STORAGE_PUBLIC_BASE_URL=https://<public-bucket-or-r2-domain>
CDN_BASE_URL=https://cdn.example.com
```

If `CDN_BASE_URL` is set, it is preferred for video playback URLs. Otherwise `OBJECT_STORAGE_PUBLIC_BASE_URL` is used.

## Docker

Run Postgres, Redis, the Next.js app, and the worker:

```bash
docker compose up --build
```

Run only the worker with Compose:

```bash
docker compose up --build worker
```
