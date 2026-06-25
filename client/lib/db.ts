import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';

const DB_PATH = path.join(process.cwd(), '.data', 'db.json');

export type Role = 'USER' | 'ASSISTANT' | 'SYSTEM';
export type JobStatus =
  | 'QUEUED'
  | 'GENERATING_CODE'
  | 'VALIDATING_CODE'
  | 'RENDERING'
  | 'UPLOADING'
  | 'COMPLETED'
  | 'FAILED_RETRYABLE'
  | 'FAILED_PERMANENT'
  | 'CANCEL_REQUESTED'
  | 'CANCELLED';

export type User = {
  id: string;
  email: string;
  name: string;
  image: string | null;
  passwordHash: string;
  credits: number;
  plan: 'free' | 'pro' | 'unlimited';
  createdAt: string;
  updatedAt: string;
};

export type Chat = {
  id: string;
  userId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
};

export type Message = {
  id: string;
  chatId: string;
  role: Role;
  content: string;
  jobId?: string;
  createdAt: string;
  updatedAt: string;
};

export type GenerationJob = {
  id: string;
  userId: string;
  chatId: string;
  messageId: string;
  assistantMessageId: string;
  status: JobStatus;
  prompt: string;
  model: string;
  manimCode: string | null;
  finalManimCode: string | null;
  errorMessage: string | null;
  errorType: string | null;
  retryCount: number;
  maxRetries: number;
  queueJobId: string;
  workerId: string | null;
  heartbeatAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  videoId?: string;
  createdAt: string;
  updatedAt: string;
};

export type Video = {
  id: string;
  userId: string;
  jobId: string;
  s3Key: string;
  cdnUrl: string | null;
  fileSize: number | null;
  duration: number | null;
  format: string;
  resolution: string;
  createdAt: string;
  updatedAt: string;
};

export type Db = {
  users: User[];
  chats: Chat[];
  messages: Message[];
  generationJobs: GenerationJob[];
  videos: Video[];
};

const emptyDb = {
  users: [],
  chats: [],
  messages: [],
  generationJobs: [],
  videos: [],
} satisfies Db;

export function id(prefix: string) {
  return `${prefix}_${crypto.randomUUID()}`;
}

async function ensureDb() {
  await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
  try {
    await fs.access(DB_PATH);
  } catch {
    await fs.writeFile(DB_PATH, JSON.stringify(emptyDb, null, 2));
  }
}

export async function readDb(): Promise<Db> {
  await ensureDb();
  const raw = await fs.readFile(DB_PATH, 'utf8');
  return { ...emptyDb, ...JSON.parse(raw || '{}') };
}

export async function writeDb(db: Db) {
  await ensureDb();
  await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2));
}

export async function mutateDb<T>(mutator: (db: Db) => T | Promise<T>): Promise<T> {
  const db = await readDb();
  const result = await mutator(db);
  await writeDb(db);
  return result;
}

export function nowIso() {
  return new Date().toISOString();
}
