import crypto from 'crypto';
import type { User } from './db';

const TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 7;

function secret() {
  return process.env.AUTH_SECRET || process.env.JWT_SECRET || 'local-2dmanim-dev-secret';
}

export type PublicUser = Omit<User, 'passwordHash'>;

function base64url(input: string) {
  return Buffer.from(input).toString('base64url');
}

function sign(payload: string) {
  return crypto
    .createHmac('sha256', secret())
    .update(payload)
    .digest('base64url');
}

export function hashPassword(password: string, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string) {
  const [salt, hash] = String(stored || '').split(':');
  if (!salt || !hash) return false;
  const candidate = hashPassword(password, salt).split(':')[1];
  return crypto.timingSafeEqual(Buffer.from(candidate, 'hex'), Buffer.from(hash, 'hex'));
}

export function createToken(userId: string) {
  const payload = base64url(JSON.stringify({
    userId,
    expiresAt: Date.now() + TOKEN_TTL_MS,
  }));
  return `${payload}.${sign(payload)}`;
}

export function readToken(request: Request): { userId: string; expiresAt: number } | null {
  const header = request.headers.get('authorization') || '';
  const [, token] = header.match(/^Bearer\s+(.+)$/i) || [];
  if (!token) return null;

  const [payload, signature] = token.split('.');
  if (!payload || !signature || sign(payload) !== signature) return null;

  try {
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (!decoded.userId || decoded.expiresAt < Date.now()) return null;
    return decoded;
  } catch {
    return null;
  }
}

export function publicUser(user: User | null): PublicUser | null {
  if (!user) return null;
  const { passwordHash, ...safeUser } = user;
  return safeUser;
}
