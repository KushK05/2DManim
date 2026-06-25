import { MessageRole } from '@prisma/client';
import { json, requireUser } from '@/lib/http';
import { prisma } from '@/lib/prisma';
import { serializeMessage } from '@/lib/serializers';

export const runtime = 'nodejs';

const allowedRoles = new Set<string>(Object.values(MessageRole));

export async function GET(request: Request) {
  const auth = await requireUser(request);
  if ('error' in auth) return auth.error;

  const url = new URL(request.url);
  const chatId = String(url.searchParams.get('chatId') || '');

  if (!chatId) {
    return json({ error: 'chatId is required' }, { status: 400 });
  }

  const chat = await prisma.chat.findFirst({
    where: {
      id: chatId,
      userId: auth.user.id,
    },
  });

  if (!chat) {
    return json({ error: 'Chat not found' }, { status: 404 });
  }

  const messages = await prisma.message.findMany({
    where: { chatId },
    orderBy: { createdAt: 'asc' },
  });

  return json({ messages: messages.map(serializeMessage) });
}

export async function POST(request: Request) {
  const auth = await requireUser(request);
  if ('error' in auth) return auth.error;

  const body = await request.json().catch(() => ({}));
  const chatId = String(body.chatId || '');
  const content = String(body.content || '').trim();
  const role = String(body.role || MessageRole.USER).toUpperCase();

  if (!chatId) {
    return json({ error: 'chatId is required' }, { status: 400 });
  }

  if (!content) {
    return json({ error: 'Message content is required' }, { status: 400 });
  }

  if (!allowedRoles.has(role)) {
    return json({ error: 'Invalid message role' }, { status: 400 });
  }

  const chat = await prisma.chat.findFirst({
    where: {
      id: chatId,
      userId: auth.user.id,
    },
  });

  if (!chat) {
    return json({ error: 'Chat not found' }, { status: 404 });
  }

  const message = await prisma.message.create({
    data: {
      chatId,
      content,
      role: role as MessageRole,
    },
  });

  await prisma.chat.update({
    where: { id: chatId },
    data: { updatedAt: new Date() },
  });

  return json({ message: serializeMessage(message) }, { status: 201 });
}
