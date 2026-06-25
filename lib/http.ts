import { NextResponse } from 'next/server';
import { readDb } from './db';
import { publicUser, readToken } from './auth';

export function json(data: unknown, init: ResponseInit = {}) {
  return NextResponse.json(data, init);
}

export async function requireUser(request: Request) {
  const token = readToken(request);
  if (!token) {
    return { error: json({ error: 'Authentication required' }, { status: 401 }) };
  }

  const db = await readDb();
  const user = db.users.find((item) => item.id === token.userId);
  if (!user) {
    return { error: json({ error: 'User not found' }, { status: 401 }) };
  }

  return { db, user, safeUser: publicUser(user) };
}
