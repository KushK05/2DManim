import { createToken, publicUser, readToken } from '@/lib/auth';
import { readDb } from '@/lib/db';
import { json } from '@/lib/http';

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

  const db = await readDb();
  const user = db.users.find((item) => item.id === token.userId);
  if (!user) {
    return json({ error: 'User not found' }, { status: 401 });
  }

  return json({
    user: publicUser(user),
    accessToken: createToken(user.id),
    refreshToken: createToken(user.id),
  });
}
