import { json, requireUser } from '@/lib/http';
import { prisma } from '@/lib/prisma';
import { serializeGeneration } from '@/lib/serializers';

export const runtime = 'nodejs';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const auth = await requireUser(request);
  if ('error' in auth) return auth.error;

  const job = await prisma.generationJob.findFirst({
    where: {
      id: params.id,
      userId: auth.user.id,
    },
    include: { video: true },
  });

  if (!job) {
    return json({ error: 'Generation not found' }, { status: 404 });
  }

  return json({ generation: serializeGeneration(job) });
}
