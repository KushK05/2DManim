import 'dotenv/config';
import { GenerationJobStatus, type Prisma } from '@prisma/client';
import { Worker } from 'bullmq';
import { claimGenerationJob } from '../lib/jobClaims';
import { prisma } from '../lib/prisma';
import { GENERATION_QUEUE_NAME, redisConnectionOptions } from '../lib/queue';
import {
  generateManimCode,
  ManimCodeValidationError,
  validateManimCode,
} from '../lib/services/aiCodeGeneration';
import {
  isDockerRenderingEnabled,
  ManimRenderError,
  renderManimCode,
} from '../lib/services/manimRenderer';
import { ObjectStorageUploadError, uploadRenderedVideo } from '../lib/services/objectStorage';

type GenerationQueuePayload = {
  jobId?: string;
};

const workerId = process.env.WORKER_ID || `generation-worker-${process.pid}`;
const concurrency = Number(process.env.WORKER_CONCURRENCY || 1);

const worker = new Worker<GenerationQueuePayload>(
  GENERATION_QUEUE_NAME,
  async (queueJob) => {
    const jobId = queueJob.data.jobId;

    if (!jobId) {
      console.warn(`[${workerId}] Received queue job ${queueJob.id} without a jobId`);
      return { claimed: false, reason: 'missing_job_id' };
    }

    console.log(`[${workerId}] Received queue job ${queueJob.id} for generation job ${jobId}`);

    const claimedJob = await claimGenerationJob(jobId, workerId);

    if (!claimedJob) {
      console.log(`[${workerId}] Skipped generation job ${jobId}; it was already claimed or is not claimable`);
      return { claimed: false, jobId };
    }

    console.log(`[${workerId}] Claimed generation job ${jobId}`);

    try {
      const generated = await generateManimCode({
        prompt: claimedJob.prompt,
        model: claimedJob.model,
      });

      await transitionGenerationJob(jobId, GenerationJobStatus.VALIDATING_CODE, {
        data: {
          manimCode: generated.code,
        },
        reason: generated.usedMock
          ? 'Generated local mock Manim code because no AI provider key is configured'
          : `Generated Manim code with ${generated.provider}:${generated.model}`,
      });

      const finalManimCode = validateManimCode(generated.code);

      if (!isDockerRenderingEnabled()) {
        await transitionGenerationJob(jobId, GenerationJobStatus.COMPLETED, {
          data: {
            finalManimCode,
            completedAt: new Date(),
          },
          reason: 'Code generation completed; Docker rendering is disabled',
          assistantMessage: [
            'Animation code is ready.',
            'Docker rendering is disabled locally, so no video was rendered for this job.',
          ].join('\n'),
        });

        console.log(`[${workerId}] Completed generation job ${jobId} without rendering`);
        return { claimed: true, jobId, rendered: false };
      }

      await transitionGenerationJob(jobId, GenerationJobStatus.RENDERING, {
        data: {
          finalManimCode,
        },
        reason: 'Validated Manim code; starting Docker render',
      });

      const rendered = await renderManimCode({
        jobId,
        code: finalManimCode,
      });

      await transitionGenerationJob(jobId, GenerationJobStatus.UPLOADING, {
        reason: `Rendered video to ${rendered.localPath}`,
      });

      const uploaded = await uploadRenderedVideo({
        filePath: rendered.localPath,
        userId: claimedJob.userId,
        jobId,
      });

      await prisma.video.upsert({
        where: {
          jobId,
        },
        update: {
          s3Key: uploaded.key,
          cdnUrl: uploaded.url,
          fileSize: BigInt(uploaded.fileSize),
          format: rendered.format,
          resolution: rendered.resolution,
        },
        create: {
          userId: claimedJob.userId,
          jobId,
          s3Key: uploaded.key,
          cdnUrl: uploaded.url,
          fileSize: BigInt(uploaded.fileSize),
          format: rendered.format,
          resolution: rendered.resolution,
        },
      });

      await transitionGenerationJob(jobId, GenerationJobStatus.COMPLETED, {
        data: {
          completedAt: new Date(),
        },
        reason: 'Rendered video is available',
        assistantMessage: 'Animation video is ready.',
      });

      console.log(`[${workerId}] Completed generation job ${jobId} with Docker render`);
      return { claimed: true, jobId, rendered: true };
    } catch (error) {
      const isPermanentFailure = error instanceof ManimCodeValidationError;
      const status = isPermanentFailure
        ? GenerationJobStatus.FAILED_PERMANENT
        : GenerationJobStatus.FAILED_RETRYABLE;
      const message = error instanceof Error ? error.message : 'Generation worker failed';

      await transitionGenerationJob(jobId, status, {
        data: {
          errorMessage: message,
          errorType: error instanceof ManimRenderError
            ? 'MANIM_RENDER_FAILED'
            : error instanceof ObjectStorageUploadError
              ? 'OBJECT_STORAGE_UPLOAD_FAILED'
            : error instanceof ManimCodeValidationError
              ? 'MANIM_CODE_VALIDATION_FAILED'
              : 'GENERATION_WORKER_FAILED',
          retryCount: {
            increment: isPermanentFailure ? 0 : 1,
          },
        },
        reason: message,
        assistantMessage: isPermanentFailure
          ? `Generated code failed validation: ${message}`
          : `Generation failed and will be retried if attempts remain: ${message}`,
      });

      if (isPermanentFailure) {
        console.error(`[${workerId}] Permanently failed generation job ${jobId}: ${message}`);
        return { claimed: true, jobId, failed: true, permanent: true };
      }

      throw error;
    }
  },
  {
    connection: redisConnectionOptions,
    concurrency,
  },
);

worker.on('completed', (job) => {
  console.log(`[${workerId}] Queue job ${job.id} completed`);
});

worker.on('failed', (job, error) => {
  console.error(`[${workerId}] Queue job ${job?.id ?? 'unknown'} failed`, error);

  if (!job?.data.jobId) return;

  const maxAttempts = job.opts.attempts || 1;

  if (job.attemptsMade >= maxAttempts) {
    void transitionGenerationJob(job.data.jobId, GenerationJobStatus.DEAD_LETTER_QUEUE, {
      data: {
        errorMessage: error.message,
        errorType: 'QUEUE_ATTEMPTS_EXHAUSTED',
      },
      reason: `BullMQ attempts exhausted after ${job.attemptsMade} attempts`,
      assistantMessage: `Generation failed after ${job.attemptsMade} attempts: ${error.message}`,
    }).catch((transitionError) => {
      console.error(`[${workerId}] Could not mark generation job ${job.data.jobId} as dead-lettered`, transitionError);
    });
  }
});

async function shutdown(signal: string) {
  console.log(`[${workerId}] Received ${signal}; shutting down`);
  await worker.close();
  await prisma.$disconnect();
  process.exit(0);
}

process.on('SIGINT', () => {
  void shutdown('SIGINT');
});

process.on('SIGTERM', () => {
  void shutdown('SIGTERM');
});

console.log(`[${workerId}] Listening on BullMQ queue "${GENERATION_QUEUE_NAME}" with concurrency ${concurrency}`);

async function transitionGenerationJob(
  jobId: string,
  toStatus: GenerationJobStatus,
  options: {
    data?: Prisma.GenerationJobUpdateInput;
    reason?: string;
    assistantMessage?: string;
  } = {},
) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.generationJob.findUniqueOrThrow({
      where: { id: jobId },
      select: {
        status: true,
        assistantMessageId: true,
      },
    });

    const job = await tx.generationJob.update({
      where: { id: jobId },
      data: {
        ...options.data,
        status: toStatus,
        heartbeatAt: new Date(),
      },
    });

    await tx.jobStatusHistory.create({
      data: {
        jobId,
        messageId: existing.assistantMessageId,
        fromStatus: existing.status,
        toStatus,
        workerId,
        reason: options.reason,
      },
    });

    if (existing.assistantMessageId) {
      await tx.message.update({
        where: {
          id: existing.assistantMessageId,
        },
        data: {
          content: options.assistantMessage || `Job status: ${toStatus}`,
        },
      });
    }

    return job;
  });
}
