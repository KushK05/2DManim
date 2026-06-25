import { createToken, hashPassword, publicUser } from '@/lib/auth';
import { id, mutateDb, nowIso, type User } from '@/lib/db';
import { json } from '@/lib/http';

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

  const result = await mutateDb((db) => {
    if (db.users.some((user) => user.email === email)) return null;

    const user: User = {
      id: id('user'),
      email,
      name,
      image: null,
      passwordHash: hashPassword(password),
      credits: 5,
      plan: 'free',
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    db.users.push(user);
    return user;
  });

  if (!result) {
    return json({ error: 'Email already registered' }, { status: 400 });
  }

  return json({
    user: publicUser(result),
    accessToken: createToken(result.id),
    refreshToken: createToken(result.id),
  }, { status: 201 });
}
