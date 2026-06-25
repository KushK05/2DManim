# 2DManim System Design

## 1. Problem Statement

2DManim is an AI-powered animation generation platform. A user enters a natural language prompt, the system generates Manim Python code, renders the animation in an isolated environment, stores the final video, and shows it back inside a chat-like interface.

The system is designed with production concerns in mind: asynchronous processing, worker-based rendering, queue retries, sandboxed execution, persistent job tracking, object storage, and CDN-based video delivery.

---

## 2. MVP Scope

The first production-minded MVP should support this flow:

1. User signs in.
2. User creates or opens a chat.
3. User submits a prompt.
4. System creates a message and a generation job.
5. Job is queued through BullMQ.
6. Worker picks the job asynchronously.
7. Worker generates Manim code using an AI model.
8. Worker validates the generated code.
9. Worker renders the video inside a Dockerized Manim container.
10. Worker uploads the rendered video to S3-compatible storage.
11. Worker updates the job status and video reference in Postgres.
12. User sees job progress and later watches the video through CDN or S3.

Out of scope for MVP:

- Billing
- Teams/workspaces
- Public sharing
- Admin dashboard
- Advanced analytics
- Collaborative editing
- Complex model-routing

These can be added after the core generation pipeline is stable.

---

## 3. High-Level Architecture

```text
User
 ↓
DNS
 ↓
CDN / Load Balancer
 ↓
Next.js App Server
 ↓
Postgres: source of truth
 ↓
BullMQ + Redis: queue execution
 ↓
Worker Service
 ↓
AI Code Generation Service
 ↓
Dockerized Manim Renderer
 ↓
S3 / Object Storage
 ↓
CDN
 ↓
User watches video
```

### Responsibility of each component

```text
Next.js Server:
- Authentication
- API routes
- Chat/message creation
- Job creation
- Job status fetching
- History fetching
- Returning video metadata

Postgres:
- Permanent source of truth
- Users
- Chats
- Messages
- Jobs
- Videos
- Status history

Redis:
- BullMQ queue storage
- Temporary cache
- Rate-limit counters
- Active job counters

BullMQ:
- Job queue abstraction
- Worker coordination
- Retries
- Delayed jobs
- Backoff
- Failed job handling

Worker Service:
- Consumes jobs from BullMQ
- Claims jobs through Postgres
- Calls AI service
- Validates generated code
- Runs Docker renderer
- Uploads video
- Updates job status

Dockerized Manim Renderer:
- Runs generated Python code in isolation
- Restricts CPU, memory, network, and filesystem access

S3 / Object Storage:
- Stores rendered videos
- Stores thumbnails or generated artifacts later

CDN:
- Serves videos efficiently
- Reduces load on backend and storage
```

---

## 4. Core Architecture Diagram

```text
                         ┌──────────────┐
                         │     User     │
                         └──────┬───────┘
                                │
                                ▼
                         ┌──────────────┐
                         │     DNS      │
                         └──────┬───────┘
                                │
                                ▼
                  ┌──────────────────────────┐
                  │ CDN / Load Balancer       │
                  └──────┬───────────┬───────┘
                         │           │
                         │           ▼
                         │     Static/video delivery
                         │
                         ▼
                  ┌──────────────────┐
                  │ Next.js Server   │
                  │ API + Frontend   │
                  └──────┬─────┬─────┘
                         │     │
           read/write DB │     │ enqueue jobId
                         │     ▼
                         │  ┌────────────────┐
                         │  │ BullMQ + Redis │
                         │  └───────┬────────┘
                         │          │
                         ▼          ▼
                  ┌──────────┐  ┌──────────────┐
                  │ Postgres │  │ Worker Pool  │
                  └────▲─────┘  └──────┬───────┘
                       │               │
                       │ status update │
                       │ s3Key update  ▼
                       │        ┌──────────────┐
                       │        │ Docker Manim │
                       │        │ Renderer     │
                       │        └──────┬───────┘
                       │               │
                       │               ▼
                       │        ┌──────────────┐
                       └────────│ S3 Storage   │
                                └──────┬───────┘
                                       │
                                       ▼
                                ┌──────────────┐
                                │ CDN          │
                                └──────┬───────┘
                                       │
                                       ▼
                                User watches video
```

---

## 5. Database Design

### Main entities

```text
User
Chat
Message
GenerationJob
Video
```

### Relationships

```text
User has many Chats
Chat has many Messages
Message may trigger zero or one GenerationJob
GenerationJob may have zero or one Video
```

A job may not have a video if it is still queued, rendering, failed, or cancelled.

### Conceptual model

```text
User
 └── Chat
      └── Message
           └── GenerationJob?
                └── Video?
```

### Entity responsibilities

```text
User:
- Owns chats, jobs, and videos.

Chat:
- Groups conversation messages.

Message:
- Stores user/assistant/system conversation content.

GenerationJob:
- Tracks background execution state.

Video:
- Stores metadata and storage reference for rendered output.
```

---

## 6. Suggested Tables

### User

```text
id
email
name
image
createdAt
updatedAt
```

### Chat

```text
id
userId
title
createdAt
updatedAt
```

### Message

```text
id
chatId
role: USER | ASSISTANT | SYSTEM
content
createdAt
updatedAt
```

### GenerationJob

```text
id
userId
chatId
messageId
status
prompt
model
manimCode
finalManimCode
errorMessage
errorType
retryCount
maxRetries
queueJobId
workerId
heartbeatAt
startedAt
completedAt
createdAt
updatedAt
```

### Video

```text
id
userId
jobId
s3Key
cdnUrl
fileSize
duration
format
resolution
createdAt
updatedAt
```

---

## 7. Job Status Lifecycle

### Success path

```text
QUEUED
 ↓
GENERATING_CODE
 ↓
VALIDATING_CODE
 ↓
RENDERING
 ↓
UPLOADING
 ↓
COMPLETED
```

### Failure path

```text
FAILED_RETRYABLE
 ↓
REQUEUED
 ↓
FAILED_PERMANENT
 ↓
DEAD_LETTER_QUEUE
```

### Cancellation path

```text
CANCEL_REQUESTED
 ↓
CANCELLED
```

### Status meaning

```text
QUEUED:
Job has been created and is waiting for a worker.

GENERATING_CODE:
Worker is generating Manim code using the AI model.

VALIDATING_CODE:
System is checking generated code for unsafe or invalid patterns.

RENDERING:
Dockerized Manim renderer is generating the video.

UPLOADING:
Rendered video is being uploaded to S3/object storage.

COMPLETED:
Video was rendered, uploaded, and stored successfully.

FAILED_RETRYABLE:
Temporary failure occurred. Job may be retried.

FAILED_PERMANENT:
Job failed after retries or failed due to a permanent issue.

CANCEL_REQUESTED:
User requested cancellation.

CANCELLED:
Job was cancelled and should not be processed further.
```

---

## 8. Generation Request Flow

### API route

```text
POST /api/generations
```

### Flow

```text
1. User submits prompt.

2. Next.js API authenticates the user.

3. API validates:
   - prompt is not empty
   - prompt is within size limit
   - user has quota
   - user has not exceeded rate limit
   - user has not exceeded active job limit

4. API creates user message in Postgres.

5. API creates assistant placeholder message:
   Example: "Generating animation..."

6. API creates GenerationJob:
   status = QUEUED

7. API pushes only jobId to BullMQ.

8. API returns:
   {
     jobId,
     status: "QUEUED",
     assistantMessageId
   }

9. Frontend starts polling job status or subscribes through SSE/WebSocket.
```

The API should not generate code or render video directly. It should only create a job and return quickly.

---

## 9. Worker Processing Flow

```text
1. Worker receives jobId from BullMQ.

2. Worker tries to claim the job in Postgres using an atomic update.

3. If claim fails, worker exits.

4. If claim succeeds:
   - update status to GENERATING_CODE
   - call AI code generation service
   - store generated Manim code
   - update status to VALIDATING_CODE
   - validate generated code
   - update status to RENDERING
   - run Dockerized Manim renderer
   - update status to UPLOADING
   - upload video to S3
   - create Video row
   - update job status to COMPLETED
   - update assistant message with final result
```

### Atomic job claim

The queue gives a worker a jobId, but Postgres decides whether the worker is allowed to process it.

Example claim logic:

```sql
UPDATE generation_jobs
SET status = 'GENERATING_CODE',
    worker_id = '<worker-id>',
    started_at = NOW(),
    heartbeat_at = NOW()
WHERE id = '<job-id>'
AND status IN ('QUEUED', 'FAILED_RETRYABLE');
```

If one row is updated, the worker owns the job.

If zero rows are updated, the worker must stop because the job may already be completed, cancelled, failed permanently, or claimed by another worker.

---

## 10. Queue Design

BullMQ is the queue library. Redis is the storage engine used by BullMQ.

```text
BullMQ = queue abstraction
Redis = backend storage for queue data
```

The application code interacts with BullMQ:

```text
queue.add("render-video", { jobId })
```

BullMQ stores this job in Redis.

Workers consume jobs from BullMQ.

### Queue payload

The queue should carry only minimal data:

```json
{
  "jobId": "..."
}
```

Do not put the full prompt, generated code, or video data inside the queue. That data belongs in Postgres or S3.

### Retry policy

Example:

```text
maxAttempts = 3
backoff = exponential
```

Retryable errors:

```text
AI API timeout
temporary S3 upload failure
temporary Docker failure
worker crash
network issue during upload
```

Permanent errors:

```text
invalid prompt
unsafe generated code
unsupported request
repeated Manim syntax failure
user cancellation
quota exceeded
```

---

## 11. Dead Letter Queue

Jobs should not be retried forever.

If a job fails after the maximum retry count, it should be moved to a failed state or dead letter queue.

```text
Retryable failure
 ↓
Retry with backoff
 ↓
Retry limit exceeded
 ↓
DLQ
 ↓
Postgres status = FAILED_PERMANENT
 ↓
Assistant message updated with user-facing error
```

DLQ is mainly for developer/admin inspection. The user-facing truth is stored in Postgres.

```text
DLQ = operational debugging
Postgres = application truth
Assistant message = user-facing result
```

---

## 12. Failure Handling

### Worker crash

Problem:

```text
Postgres says RENDERING, but worker died.
```

Solution:

Worker updates heartbeat:

```text
heartbeatAt = current time
```

A recovery scheduler checks for stale jobs:

```text
status IN ('GENERATING_CODE', 'VALIDATING_CODE', 'RENDERING', 'UPLOADING')
heartbeatAt older than threshold
```

Then:

```text
mark FAILED_RETRYABLE
requeue job
```

### S3 upload succeeds but DB update fails

Use deterministic S3 key:

```text
videos/{userId}/{jobId}/output.mp4
```

If upload succeeds but DB update fails, the worker still knows the key.

Correct handling:

```text
1. Retry DB update.
2. If still failing, leave object temporarily.
3. Reconciliation/cleanup job later checks orphaned S3 files.
4. Either link the object to DB or delete it.
```

Do not immediately delete a successfully uploaded video unless recovery is impossible.

### Duplicate processing

BullMQ normally prevents two workers from processing the same queue job at the same time, but production systems still need DB-level protection.

Reasons duplicate processing can happen:

```text
worker crash
stalled job recovery
manual requeue
network failure
retry race condition
```

Solution:

```text
Atomic DB claim
Idempotent S3 key
Status transition rules
```

---

## 13. Docker Rendering Security

AI-generated Python code is untrusted. It should never run directly on the host machine.

Use multiple layers of protection.

### Static validation

Reject dangerous Python patterns such as:

```text
import os
import subprocess
import socket
import requests
open(...)
eval(...)
exec(...)
__import__
pathlib
shutil
```

### Docker restrictions

The Manim renderer should run with restrictions:

```text
--network none
--memory 512m
--cpus 1
--pids-limit 128
--read-only
--user nonroot
--security-opt no-new-privileges
```

### Filesystem control

Only mount the required files:

```text
input code file = read-only
output folder = writable
```

Do not mount the whole project directory.

### Timeout

Every render must have a timeout:

```text
60 seconds or 120 seconds depending on quality setting
```

If timeout is exceeded, kill the container.

---

## 14. Storage Design

### S3 object key

Use deterministic object keys:

```text
videos/{userId}/{jobId}/output.mp4
```

Optional later:

```text
videos/{userId}/{jobId}/thumbnail.png
videos/{userId}/{jobId}/source.py
```

### What goes where

```text
Postgres:
- video metadata
- s3Key
- cdnUrl
- duration
- file size
- owner

S3:
- actual mp4 file
- thumbnail
- generated assets

CDN:
- serves video to users
```

Do not store actual videos in Postgres or Redis.

---

## 15. Redis Cache Design

Redis can be used for temporary fast-access data.

Cache:

```text
job status
recent chat metadata
recent generation metadata
active job count per user
rate-limit counters
quota counters
short-lived signed URLs
```

Do not cache:

```text
actual videos
large Manim code blobs
permanent chat history
source-of-truth job data
```

Postgres remains the source of truth.

Redis can be split later:

```text
Redis Queue Instance
Redis Cache Instance
```

This prevents cache pressure from affecting job execution.

---

## 16. API Routes

### Chat routes

```text
POST /api/chats
GET /api/chats
GET /api/chats/:chatId
```

### Message routes

```text
POST /api/chats/:chatId/messages
GET /api/chats/:chatId/messages
```

### Generation routes

```text
POST /api/generations
GET /api/generations/:jobId
POST /api/generations/:jobId/cancel
```

### Video routes

```text
GET /api/videos/:videoId
```

The video route should return metadata and a CDN/signed URL, not stream large files directly through the Next.js server in production.

---

## 17. Rate Limiting and Concurrency Control

Rate limiting and concurrency control are different.

```text
Rate limiting:
Controls how many requests a user can make.

Concurrency control:
Controls how many active render jobs a user can run.
```

Example:

```text
Free user:
- 20 generation requests/day
- 1 active render at a time

Paid user:
- 200 generation requests/day
- 3 active renders at a time
```

Before enqueueing a job, check active jobs:

```text
QUEUED
GENERATING_CODE
VALIDATING_CODE
RENDERING
UPLOADING
```

If active count exceeds limit, reject or delay the job.

---

## 18. Observability

Add structured logs for each phase:

```text
jobId
userId
chatId
workerId
status
phase
durationMs
errorType
retryCount
createdAt
completedAt
```

Useful metrics:

```text
queue length
active jobs
average render time
AI generation latency
S3 upload latency
failure rate
retry count
DLQ count
worker heartbeat age
```

Later, these can be shown in an admin dashboard.

---

## 19. Scaling Strategy

### API scaling

Next.js servers should remain lightweight and mostly stateless.

They can scale horizontally behind a load balancer.

### Worker scaling

Workers can scale independently based on queue size.

```text
More queued jobs
 ↓
Add more workers
```

Worker concurrency must be controlled because rendering is CPU/memory-heavy.

Example:

```text
WORKER_CONCURRENCY=2
MAX_ACTIVE_RENDER_CONTAINERS=3
```

### Storage scaling

Videos should go to S3/object storage, not local disk.

This allows API servers and workers to be replaced without losing files.

### Delivery scaling

CDN should serve videos instead of the backend server.

---

## 20. Final Request Lifecycle

```text
1. User submits prompt.

2. Next.js authenticates user.

3. Next.js validates prompt, rate limit, quota, and active job count.

4. Next.js creates:
   - user message
   - assistant placeholder message
   - generation job with status QUEUED

5. Next.js enqueues { jobId } in BullMQ.

6. Next.js returns jobId.

7. Frontend shows "Generating..." and polls job status.

8. Worker receives jobId.

9. Worker claims job using atomic DB update.

10. Worker generates Manim code.

11. Worker validates generated code.

12. Worker renders video in Docker.

13. Worker uploads video to S3.

14. Worker creates Video row.

15. Worker updates job to COMPLETED.

16. Worker updates assistant message.

17. Frontend receives completed status.

18. Browser loads video from CDN.
```

---

## 21. Interview-Ready Explanation

2DManim is designed as an asynchronous AI video rendering system. When a user submits a prompt, the Next.js API stores the chat message and creates a generation job in Postgres with `QUEUED` status. Only the `jobId` is pushed to BullMQ, keeping the queue payload small and making Postgres the source of truth.

A worker consumes the job and first claims it through an atomic database update. This prevents duplicate processing during retries, worker crashes, or stalled-job recovery. After claiming the job, the worker generates Manim code using an AI service, validates the generated code, renders it inside a restricted Docker container, uploads the final video to S3, and updates Postgres with the completed status and video key.

The frontend does not wait for rendering inside the request-response cycle. It receives a `jobId` immediately and polls or subscribes to job status updates. Completed videos are served through CDN backed by S3. Failures are retried with backoff, and permanently failed jobs are moved to a dead letter queue while Postgres and the assistant message are updated with the final failure state.

This design demonstrates queue-based processing, worker architecture, background job scheduling, retry handling, dead letter queues, database-backed state machines, sandboxed execution, object storage, CDN delivery, and independent scaling of API and worker services.
