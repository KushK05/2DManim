import { json, requireUser } from '@/lib/http';
import { prisma } from '@/lib/prisma';
import { serializeGeneration, serializeJob, serializeMessage } from '@/lib/serializers';

export const runtime = 'nodejs';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const auth = await requireUser(request);
  if ('error' in auth) return auth.error;

  const job = await prisma.generationJob.findFirst({
    where: {
      id: params.id,
      userId: auth.user.id,
    },
    include: {
      video: true,
    },
  });

  if (!job) {
    return json({ error: 'Job not found' }, { status: 404 });
  }

  const messages = await prisma.message.findMany({
    where: {
      chatId: job.chatId,
    },
    orderBy: { createdAt: 'asc' },
  });

  return json({
    job: serializeJob(job),
    generation: serializeGeneration(job),
    messages: messages.map(serializeMessage),
  });
}
