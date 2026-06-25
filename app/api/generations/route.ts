import { id, mutateDb, nowIso, readDb, type Chat, type GenerationJob, type Message } from '@/lib/db';
import { json, requireUser } from '@/lib/http';
import { refreshJob, toGeneration } from '@/lib/jobs';

export async function GET(request: Request) {
  const auth = await requireUser(request);
  if ('error' in auth) return auth.error;

  const url = new URL(request.url);
  const page = Math.max(1, Number(url.searchParams.get('page') || 1));
  const limit = Math.min(50, Math.max(1, Number(url.searchParams.get('limit') || 10)));

  await Promise.all(
    auth.db.generationJobs
      .filter((job) => job.userId === auth.user.id)
      .map((job) => refreshJob(job.id)),
  );

  const db = await readDb();
  const jobs = db.generationJobs
    .filter((job) => job.userId === auth.user.id)
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  const start = (page - 1) * limit;
  const generations = jobs.slice(start, start + limit).map((job) => toGeneration(job, db));

  return json({
    generations,
    pagination: {
      page,
      limit,
      total: jobs.length,
      pages: Math.ceil(jobs.length / limit),
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

  const result = await mutateDb((db) => {
    const timestamp = nowIso();
    let chat = chatId
      ? db.chats.find((item) => item.id === chatId && item.userId === auth.user.id)
      : null;

    if (!chat) {
      chat = {
        id: id('chat'),
        userId: auth.user.id,
        title: prompt.slice(0, 72),
        createdAt: timestamp,
        updatedAt: timestamp,
      } satisfies Chat;
      db.chats.push(chat);
    }

    const userMessage: Message = {
      id: id('msg'),
      chatId: chat.id,
      role: 'USER',
      content: prompt,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    const assistantMessage: Message = {
      id: id('msg'),
      chatId: chat.id,
      role: 'ASSISTANT',
      content: 'Job status: QUEUED',
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    const job: GenerationJob = {
      id: id('job'),
      userId: auth.user.id,
      chatId: chat.id,
      messageId: userMessage.id,
      assistantMessageId: assistantMessage.id,
      status: 'QUEUED',
      prompt,
      model,
      manimCode: null,
      finalManimCode: null,
      errorMessage: null,
      errorType: null,
      retryCount: 0,
      maxRetries: 3,
      queueJobId: id('queue'),
      workerId: null,
      heartbeatAt: null,
      startedAt: null,
      completedAt: null,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    assistantMessage.jobId = job.id;
    db.messages.push(userMessage, assistantMessage);
    db.generationJobs.push(job);
    chat.updatedAt = timestamp;

    return { job, chat, assistantMessage };
  });

  return json({
    jobId: result.job.id,
    chatId: result.chat.id,
    status: result.job.status,
    assistantMessageId: result.assistantMessage.id,
  }, { status: 202 });
}
