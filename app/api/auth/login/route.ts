import { createToken, verifyPassword } from '@/lib/auth';
import { json } from '@/lib/http';
import { prisma } from '@/lib/prisma';
import { serializeUser } from '@/lib/serializers';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');

  if (!email || !password) {
    return json({ error: 'Email and password are required' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user || !verifyPassword(password, user.passwordHash)) {
    return json({ error: 'Invalid email or password' }, { status: 401 });
  }

  return json({
    user: serializeUser(user),
    accessToken: createToken(user.id),
    refreshToken: createToken(user.id),
  });
}
