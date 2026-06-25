import { createToken, readToken } from '@/lib/auth';
import { json } from '@/lib/http';
import { prisma } from '@/lib/prisma';
import { serializeUser } from '@/lib/serializers';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const refreshToken = String(body.refreshToken || '');
  const tokenRequest = new Request(request.url, {
    headers: { authorization: `Bearer ${refreshToken}` },
  });
  const token = readToken(tokenRequest);

  if (!token) {
    return json({ error: 'Invalid refresh token' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: token.userId },
  });
  if (!user) {
    return json({ error: 'User not found' }, { status: 401 });
  }

  return json({
    user: serializeUser(user),
    accessToken: createToken(user.id),
    refreshToken: createToken(user.id),
  });
}
