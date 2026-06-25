import { json, requireUser } from '@/lib/http';
import { prisma } from '@/lib/prisma';
import { serializeChat, serializeMessage } from '@/lib/serializers';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const auth = await requireUser(request);
  if ('error' in auth) return auth.error;

  const url = new URL(request.url);
  const page = Math.max(1, Number(url.searchParams.get('page') || 1));
  const limit = Math.min(50, Math.max(1, Number(url.searchParams.get('limit') || 20)));
  const skip = (page - 1) * limit;

  const [chats, total] = await Promise.all([
    prisma.chat.findMany({
      where: { userId: auth.user.id },
      orderBy: { updatedAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.chat.count({
      where: { userId: auth.user.id },
    }),
  ]);

  return json({
    chats: chats.map(serializeChat),
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
  const title = String(body.title || 'Untitled chat').trim().slice(0, 120) || 'Untitled chat';

  const chat = await prisma.chat.create({
    data: {
      userId: auth.user.id,
      title,
    },
  });

  return json({ chat: serializeChat(chat) }, { status: 201 });
}
