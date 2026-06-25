import { requireUser } from '@/lib/http';

export async function GET(request: Request) {
  const auth = await requireUser(request);
  if ('error' in auth) return auth.error;
  return Response.json({ user: auth.safeUser });
}
