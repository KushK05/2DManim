import { json, requireUser } from '@/lib/http';
import { prisma } from '@/lib/prisma';
import { serializeChat, serializeMessage } from '@/lib/serializers';

export const runtime = 'nodejs';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const auth = await requireUser(request);
  if ('error' in auth) return auth.error;

  const chat = await prisma.chat.findFirst({
    where: {
      id: params.id,
      userId: auth.user.id,
    },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!chat) {
    return json({ error: 'Chat not found' }, { status: 404 });
  }

  return json({
    chat: serializeChat(chat),
    messages: chat.messages.map(serializeMessage),
  });
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const auth = await requireUser(request);
  if ('error' in auth) return auth.error;

  const body = await request.json().catch(() => ({}));
  const title = String(body.title || '').trim().slice(0, 120);

  if (!title) {
    return json({ error: 'Title is required' }, { status: 400 });
  }

  const existing = await prisma.chat.findFirst({
    where: {
      id: params.id,
      userId: auth.user.id,
    },
  });

  if (!existing) {
    return json({ error: 'Chat not found' }, { status: 404 });
  }

  const chat = await prisma.chat.update({
    where: { id: params.id },
    data: { title },
  });

  return json({ chat: serializeChat(chat) });
}
