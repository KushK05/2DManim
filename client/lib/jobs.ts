import { id, mutateDb, nowIso, type Db, type GenerationJob, type JobStatus } from './db';

export const JOB_STATUSES: JobStatus[] = [
  'QUEUED',
  'GENERATING_CODE',
  'VALIDATING_CODE',
  'RENDERING',
  'UPLOADING',
  'COMPLETED',
  'FAILED_RETRYABLE',
  'FAILED_PERMANENT',
  'CANCEL_REQUESTED',
  'CANCELLED',
];

export function buildManimCode(prompt: string) {
  const cleanPrompt = String(prompt).replace(/"""/g, '\\"\\"\\"').slice(0, 900);
  return `from manim import *

class GeneratedScene(Scene):
    def construct(self):
        title = Text("2DManim", font_size=48)
        prompt = Paragraph(
            """${cleanPrompt}""",
            width=10,
            font_size=26,
            alignment="center",
        )
        prompt.next_to(title, DOWN, buff=0.6)
        box = SurroundingRectangle(prompt, color=BLUE, buff=0.35)

        self.play(Write(title))
        self.play(FadeIn(prompt), Create(box))
        self.wait(1)
        self.play(title.animate.to_edge(UP), prompt.animate.scale(0.86))
        self.wait(2)
`;
}

function deriveStatus(job: GenerationJob): JobStatus {
  if (job.status === 'FAILED_PERMANENT' || job.status === 'CANCELLED') return job.status;
  const age = Date.now() - new Date(job.createdAt).getTime();
  if (age < 1200) return 'QUEUED';
  if (age < 2600) return 'GENERATING_CODE';
  if (age < 3600) return 'VALIDATING_CODE';
  if (age < 5200) return 'RENDERING';
  if (age < 6400) return 'UPLOADING';
  return 'COMPLETED';
}

export async function refreshJob(jobId: string) {
  return mutateDb((db) => {
    const job = db.generationJobs.find((item) => item.id === jobId);
    if (!job) return null;

    const nextStatus = deriveStatus(job);
    const changed = nextStatus !== job.status;
    job.status = nextStatus;
    job.heartbeatAt = nowIso();
    job.updatedAt = nowIso();

    if (nextStatus === 'GENERATING_CODE' && !job.startedAt) {
      job.startedAt = nowIso();
      job.workerId = 'local-next-worker';
    }

    if (nextStatus === 'VALIDATING_CODE' && !job.manimCode) {
      job.manimCode = buildManimCode(job.prompt);
      job.finalManimCode = job.manimCode;
    }

    if (nextStatus === 'COMPLETED' && !job.completedAt) {
      job.completedAt = nowIso();
      job.finalManimCode = job.finalManimCode || buildManimCode(job.prompt);
      const existingVideo = db.videos.find((video) => video.jobId === job.id);
      const video = existingVideo || {
        id: id('video'),
        userId: job.userId,
        jobId: job.id,
        s3Key: `videos/${job.userId}/${job.id}/output.mp4`,
        cdnUrl: null,
        fileSize: null,
        duration: null,
        format: 'mp4',
        resolution: '1920x1080',
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      if (!existingVideo) db.videos.push(video);
      job.videoId = video.id;

      const message = db.messages.find((item) => item.id === job.assistantMessageId);
      if (message) {
        message.content = 'Animation code is ready. Rendering storage is configured for S3/CDN in production.';
        message.updatedAt = nowIso();
      }
    }

    if (changed) {
      db.messages
        .filter((message) => message.jobId === job.id && message.role === 'ASSISTANT')
        .forEach((message) => {
          if (nextStatus !== 'COMPLETED') {
            message.content = `Job status: ${nextStatus}`;
            message.updatedAt = nowIso();
          }
        });
    }

    return job;
  });
}

export function toGeneration(job: GenerationJob, db: Db) {
  const video = db.videos.find((item) => item.jobId === job.id) || null;
  return {
    id: job.id,
    _id: job.id,
    userId: job.userId,
    chatId: job.chatId,
    messageId: job.messageId,
    assistantMessageId: job.assistantMessageId,
    prompt: job.prompt,
    model: job.model,
    status: job.status,
    manimCode: job.finalManimCode || job.manimCode,
    videoUrl: video?.cdnUrl || null,
    video,
    error: job.errorMessage,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
  };
}
