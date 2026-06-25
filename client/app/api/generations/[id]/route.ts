import { readDb } from '@/lib/db';
import { json, requireUser } from '@/lib/http';
import { refreshJob, toGeneration } from '@/lib/jobs';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const auth = await requireUser(request);
  if ('error' in auth) return auth.error;

  const job = await refreshJob(params.id);
  if (!job || job.userId !== auth.user.id) {
    return json({ error: 'Generation not found' }, { status: 404 });
  }

  const db = await readDb();
  return json({ generation: toGeneration(job, db) });
}
