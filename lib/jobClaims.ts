import { GenerationJobStatus } from '@prisma/client';
import { prisma } from './prisma';

const claimableStatuses = [
  GenerationJobStatus.QUEUED,
  GenerationJobStatus.FAILED_RETRYABLE,
];

export async function claimGenerationJob(jobId: string, workerId: string) {
  return prisma.$transaction(async (tx) => {
    const claimed = await tx.generationJob.updateMany({
      where: {
        id: jobId,
        status: {
          in: claimableStatuses,
        },
      },
      data: {
        status: GenerationJobStatus.GENERATING_CODE,
        workerId,
        startedAt: new Date(),
        heartbeatAt: new Date(),
        errorMessage: null,
        errorType: null,
      },
    });

    if (claimed.count !== 1) {
      return null;
    }

    const job = await tx.generationJob.findUniqueOrThrow({
      where: { id: jobId },
      include: {
        assistantMessage: true,
      },
    });

    await tx.jobStatusHistory.create({
      data: {
        jobId,
        messageId: job.assistantMessageId,
        fromStatus: null,
        toStatus: GenerationJobStatus.GENERATING_CODE,
        workerId,
        reason: 'Worker claimed job',
      },
    });

    if (job.assistantMessageId) {
      await tx.message.update({
        where: { id: job.assistantMessageId },
        data: {
          content: `Job status: ${GenerationJobStatus.GENERATING_CODE}`,
        },
      });
    }

    return job;
  });
}
