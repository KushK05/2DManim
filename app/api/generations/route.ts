import { GenerationJobStatus, MessageRole } from '@prisma/client';
import { json, requireUser } from '@/lib/http';
import { prisma } from '@/lib/prisma';
import { enqueueGenerationJob } from '@/lib/queue';
import { serializeGeneration } from '@/lib/serializers';

export const runtime = 'nodejs';

const activeStatuses = [
  GenerationJobStatus.QUEUED,
  GenerationJobStatus.GENERATING_CODE,
  GenerationJobStatus.VALIDATING_CODE,
  GenerationJobStatus.RENDERING,
  GenerationJobStatus.UPLOADING,
];

export async function GET(request: Request) {
  const auth = await requireUser(request);
  if ('error' in auth) return auth.error;

  const url = new URL(request.url);
  const page = Math.max(1, Number(url.searchParams.get('page') || 1));
  const limit = Math.min(50, Math.max(1, Number(url.searchParams.get('limit') || 10)));
  const skip = (page - 1) * limit;

  const [jobs, total] = await Promise.all([
    prisma.generationJob.findMany({
      where: { userId: auth.user.id },
      include: { video: true },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.generationJob.count({
      where: { userId: auth.user.id },
    }),
  ]);

  return json({
    generations: jobs.map(serializeGeneration),
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
}

export async function POST(request: Request) {
  const auth = await requireUser(request);
  if ('error' in auth) return auth.error;

  const body = await request.json().catch(() => ({}));
  const prompt = String(body.prompt || '').trim();
  const model = String(body.model || process.env.DEFAULT_MODEL || 'gemini-2.5-flash');
  const chatId = body.chatId ? String(body.chatId) : null;

  if (!prompt) {
    return json({ error: 'Prompt is required' }, { status: 400 });
  }

  if (prompt.length > 2000) {
    return json({ error: 'Prompt too long (max 2000 characters)' }, { status: 400 });
  }

  if (auth.user.credits <= 0) {
    return json({ error: 'Quota exceeded' }, { status: 402 });
  }

  const activeJobCount = await prisma.generationJob.count({
    where: {
      userId: auth.user.id,
      status: { in: activeStatuses },
    },
  });

  if (activeJobCount >= 3) {
    return json({ error: 'Active job limit reached' }, { status: 429 });
  }

  if (chatId) {
    const existingChat = await prisma.chat.findFirst({
      where: {
        id: chatId,
        userId: auth.user.id,
      },
    });

    if (!existingChat) {
      return json({ error: 'Chat not found' }, { status: 404 });
    }
  }

  const result = await prisma.$transaction(async (tx) => {
    const chat = chatId
      ? await tx.chat.update({
        where: { id: chatId },
        data: { updatedAt: new Date() },
      })
      : await tx.chat.create({
        data: {
          userId: auth.user.id,
          title: prompt.slice(0, 72),
        },
      });

    const userMessage = await tx.message.create({
      data: {
        chatId: chat.id,
        role: MessageRole.USER,
        content: prompt,
      },
    });

    const assistantMessage = await tx.message.create({
      data: {
        chatId: chat.id,
        role: MessageRole.ASSISTANT,
        content: 'Job status: QUEUED',
      },
    });

    const job = await tx.generationJob.create({
      data: {
        userId: auth.user.id,
        chatId: chat.id,
        messageId: userMessage.id,
        assistantMessageId: assistantMessage.id,
        status: GenerationJobStatus.QUEUED,
        prompt,
        model,
      },
      include: { video: true },
    });

    await tx.jobStatusHistory.create({
      data: {
        jobId: job.id,
        messageId: assistantMessage.id,
        toStatus: GenerationJobStatus.QUEUED,
        reason: 'Generation job created by API',
      },
    });

    return { chat, assistantMessage, job };
  });

  try {
    const queueJob = await enqueueGenerationJob(result.job.id);
    const queueJobId = String(queueJob.id || result.job.id);

    await prisma.generationJob.update({
      where: { id: result.job.id },
      data: { queueJobId },
    });

    return json({
      jobId: result.job.id,
      chatId: result.chat.id,
      status: result.job.status,
      assistantMessageId: result.assistantMessage.id,
      queueJobId,
    }, { status: 202 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to enqueue generation job';

    await prisma.$transaction([
      prisma.generationJob.update({
        where: { id: result.job.id },
        data: {
          status: GenerationJobStatus.FAILED_RETRYABLE,
          errorMessage: message,
          errorType: 'QUEUE_ENQUEUE_FAILED',
        },
      }),
      prisma.jobStatusHistory.create({
        data: {
          jobId: result.job.id,
          messageId: result.assistantMessage.id,
          fromStatus: GenerationJobStatus.QUEUED,
          toStatus: GenerationJobStatus.FAILED_RETRYABLE,
          reason: message,
        },
      }),
      prisma.message.update({
        where: { id: result.assistantMessage.id },
        data: { content: 'Job could not be queued. Please check Redis and try again.' },
      }),
    ]);

    return json({
      error: 'Failed to enqueue generation job',
      jobId: result.job.id,
      details: message,
    }, { status: 503 });
  }
}
