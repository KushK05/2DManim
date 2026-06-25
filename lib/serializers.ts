import type { Chat, GenerationJob, Message, User, Video } from '@prisma/client';

type JobWithVideo = GenerationJob & {
  video?: Video | null;
};

export function serializeUser(user: User) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    image: user.image,
    credits: user.credits,
    plan: user.plan.toLowerCase(),
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

export function serializeChat(chat: Chat) {
  return {
    id: chat.id,
    userId: chat.userId,
    title: chat.title,
    createdAt: chat.createdAt.toISOString(),
    updatedAt: chat.updatedAt.toISOString(),
  };
}

export function serializeMessage(message: Message) {
  return {
    id: message.id,
    chatId: message.chatId,
    role: message.role,
    content: message.content,
    createdAt: message.createdAt.toISOString(),
    updatedAt: message.updatedAt.toISOString(),
  };
}

export function serializeVideo(video: Video | null | undefined) {
  if (!video) return null;

  return {
    id: video.id,
    userId: video.userId,
    jobId: video.jobId,
    s3Key: video.s3Key,
    cdnUrl: video.cdnUrl,
    fileSize: video.fileSize === null ? null : Number(video.fileSize),
    duration: video.duration,
    format: video.format,
    resolution: video.resolution,
    createdAt: video.createdAt.toISOString(),
    updatedAt: video.updatedAt.toISOString(),
  };
}

export function serializeJob(job: JobWithVideo) {
  const video = serializeVideo(job.video);

  return {
    id: job.id,
    userId: job.userId,
    chatId: job.chatId,
    messageId: job.messageId,
    assistantMessageId: job.assistantMessageId,
    status: job.status,
    prompt: job.prompt,
    model: job.model,
    manimCode: job.manimCode,
    finalManimCode: job.finalManimCode,
    errorMessage: job.errorMessage,
    errorType: job.errorType,
    retryCount: job.retryCount,
    maxRetries: job.maxRetries,
    queueJobId: job.queueJobId,
    workerId: job.workerId,
    heartbeatAt: job.heartbeatAt?.toISOString() ?? null,
    startedAt: job.startedAt?.toISOString() ?? null,
    completedAt: job.completedAt?.toISOString() ?? null,
    createdAt: job.createdAt.toISOString(),
    updatedAt: job.updatedAt.toISOString(),
    video,
  };
}

export function serializeGeneration(job: JobWithVideo) {
  const video = serializeVideo(job.video);

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
    videoUrl: video?.cdnUrl ?? null,
    video,
    error: job.errorMessage,
    createdAt: job.createdAt.toISOString(),
    updatedAt: job.updatedAt.toISOString(),
  };
}
