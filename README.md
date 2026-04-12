# 2DManim

Local-first project for generating Manim code and optionally rendering videos with a local Docker Manim image.

Recommended local workflow is:

- run `server` and `client` with npm in dev mode
- use Docker only for `mongodb` (optional) and `manim-runner` image build

## Stack

- Client: React + Vite
- Server: Node.js + Express + Mongoose
- Database: MongoDB (local instance)
- Renderer: Docker image `2dmanim-manim` (Manim + ffmpeg)

## Local Architecture

- API runs on `http://localhost:5001`
- Client dev server runs on `http://localhost:5173`
- MongoDB runs on `127.0.0.1:27017`
- Generated videos are served from `/api/videos/*` and stored in `server/uploads/videos`

## Prerequisites

- Node.js `20+`
- npm
- MongoDB running locally (or via Docker)
- Docker Desktop running (required for video rendering)
- `mongosh` (recommended for local DB verification)

## 1) Install Dependencies

```bash
cd server && npm install
cd ../client && npm install
cd ..
```

## 2) Configure Environment

Copy env file:

```bash
cp .env.example .env
cp .env server/.env
```

Important defaults in `.env.example`:

- `PORT=5001`
- `MONGODB_URI=mongodb://127.0.0.1:27017/2dmanim?...`
- `ENABLE_LOCAL_RENDER=true`
- test user placeholders:
  - `TEST_USER_EMAIL=testuser@2dmanim.local`
  - `TEST_USER_PASSWORD=TestUser@123`

Set these before real usage:

- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `GEMINI_API_KEY`

## 3) Start MongoDB

If you already run Mongo locally, just verify:

```bash
mongosh "mongodb://127.0.0.1:27017/?directConnection=true&serverSelectionTimeoutMS=2000&appName=mongosh+2.8.2" --quiet --eval "db.adminCommand({ ping: 1 })"
```

If not running locally, use Docker:

```bash
docker compose up -d mongodb
```

## 4) Build Local Manim Image (Required for video output)

```bash
docker compose build manim-runner
```

This builds the image `2dmanim-manim` used by the server render pipeline.

## 5) Start Backend

```bash
cd server
npm run dev
```

Health check:

```bash
curl -s http://localhost:5001/api/health
```

## 6) Create Test User

With backend running:

```bash
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"testuser@2dmanim.local","password":"TestUser@123"}'
```

If user already exists, you will get an `Email already registered` response.

## 7) Start Frontend

```bash
cd client
npm run dev
```

Open `http://localhost:5173`.

## 8) Verify Video Rendering

Video rendering requires:

- Docker Desktop is running
- `ENABLE_LOCAL_RENDER=true` in `.env`/`server/.env`
- `2dmanim-manim` image exists

Rendered files are written to:

- `server/uploads/videos`

## Useful Checks

Verify DB + collections + seeded user:

```bash
mongosh "mongodb://127.0.0.1:27017/?directConnection=true&serverSelectionTimeoutMS=2000&appName=mongosh+2.8.2" --quiet --eval 'const d=db.getSiblingDB("2dmanim"); printjson({collections:d.getCollectionNames(), userCount:d.users.countDocuments({email:"testuser@2dmanim.local"})});'
```

Check renderer image:

```bash
docker images | rg 2dmanim-manim
```

## Troubleshooting

- `Cannot connect to Docker daemon`
  - Start Docker Desktop and retry `docker compose build manim-runner`.

- `No video output produced`
  - Ensure `2dmanim-manim` exists and was built successfully.
  - Ensure Docker is running when you hit generate with video rendering enabled.

- `EADDRINUSE` on backend startup
  - Port `5000` may be occupied on macOS by ControlCenter/AirTunes.
  - This project uses `PORT=5001` by default.

- Mongo connection errors
  - Confirm Mongo is reachable at `127.0.0.1:27017`.
  - Re-run the ping command from section 3.
