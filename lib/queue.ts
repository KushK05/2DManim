import { Queue, type ConnectionOptions } from 'bullmq';

export const GENERATION_QUEUE_NAME = 'generation-jobs';

const redisUrl = new URL(process.env.REDIS_URL || 'redis://localhost:6379');

export const redisConnectionOptions: ConnectionOptions = {
  host: redisUrl.hostname,
  port: Number(redisUrl.port || 6379),
  username: redisUrl.username || undefined,
  password: redisUrl.password || undefined,
  db: redisUrl.pathname && redisUrl.pathname !== '/'
    ? Number(redisUrl.pathname.replace('/', ''))
    : undefined,
  maxRetriesPerRequest: null,
};

const globalForQueue = globalThis as unknown as {
  generationQueue?: Queue;
};

export function getGenerationQueue() {
  if (!globalForQueue.generationQueue) {
    globalForQueue.generationQueue = new Queue(GENERATION_QUEUE_NAME, {
      connection: redisConnectionOptions,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: {
          age: 60 * 60 * 24,
          count: 1000,
        },
        removeOnFail: {
          age: 60 * 60 * 24 * 7,
        },
      },
    });
  }

  return globalForQueue.generationQueue;
}

export async function enqueueGenerationJob(jobId: string) {
  return getGenerationQueue().add(
    'render-video',
    { jobId },
    {
      jobId,
    },
  );
}
