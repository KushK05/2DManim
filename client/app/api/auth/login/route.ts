import { createToken, publicUser, verifyPassword } from '@/lib/auth';
import { json } from '@/lib/http';
import { readDb } from '@/lib/db';

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');

  if (!email || !password) {
    return json({ error: 'Email and password are required' }, { status: 400 });
  }

  const db = await readDb();
  const user = db.users.find((item) => item.email === email);

  if (!user || !verifyPassword(password, user.passwordHash)) {
    return json({ error: 'Invalid email or password' }, { status: 401 });
  }

  return json({
    user: publicUser(user),
    accessToken: createToken(user.id),
    refreshToken: createToken(user.id),
  });
}
