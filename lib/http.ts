import { NextResponse } from 'next/server';
import { readToken } from './auth';
import { prisma } from './prisma';
import { serializeUser } from './serializers';

export function json(data: unknown, init: ResponseInit = {}) {
  return NextResponse.json(data, init);
}

export async function requireUser(request: Request) {
  const token = readToken(request);
  if (!token) {
    return { error: json({ error: 'Authentication required' }, { status: 401 }) };
  }

  const user = await prisma.user.findUnique({
    where: {
      id: token.userId,
    },
  });

  if (!user) {
    return { error: json({ error: 'User not found' }, { status: 401 }) };
  }

  return { user, safeUser: serializeUser(user) };
}
