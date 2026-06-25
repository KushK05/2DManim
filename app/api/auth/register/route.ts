import { createToken, hashPassword } from '@/lib/auth';
import { json } from '@/lib/http';
import { prisma } from '@/lib/prisma';
import { serializeUser } from '@/lib/serializers';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const name = String(body.name || '').trim();
  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');

  if (!name || !email || !password) {
    return json({ error: 'All fields are required' }, { status: 400 });
  }

  if (password.length < 6) {
    return json({ error: 'Password must be at least 6 characters' }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({
    where: { email },
  });

  if (existing) {
    return json({ error: 'Email already registered' }, { status: 400 });
  }

  const user = await prisma.user.create({
    data: {
      email,
      name,
      passwordHash: hashPassword(password),
    },
  });

  return json({
    user: serializeUser(user),
    accessToken: createToken(user.id),
    refreshToken: createToken(user.id),
  }, { status: 201 });
}
