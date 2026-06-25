import { spawn } from 'node:child_process';
import { cp, mkdir, readdir, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

export type ManimRenderResult = {
  localPath: string;
  fileSize: number;
  format: 'mp4';
  resolution: string | null;
};

export class ManimRenderError extends Error {
  stdout: string;
  stderr: string;
  exitCode: number | null;

  constructor(message: string, details: { stdout: string; stderr: string; exitCode: number | null }) {
    super(message);
    this.name = 'ManimRenderError';
    this.stdout = details.stdout;
    this.stderr = details.stderr;
    this.exitCode = details.exitCode;
  }
}

export function isDockerRenderingEnabled() {
  return process.env.ENABLE_DOCKER_RENDER === 'true';
}

export async function renderManimCode(params: {
  jobId: string;
  code: string;
}): Promise<ManimRenderResult> {
  const outputRoot = path.resolve(process.cwd(), process.env.MANIM_OUTPUT_DIR || 'public/generated/videos');
  const jobRoot = path.join(outputRoot, params.jobId);
  const workDir = path.join(jobRoot, 'work');
  const mediaDir = path.join(workDir, 'media');
  const scenePath = path.join(workDir, 'scene.py');
  const finalPath = path.join(jobRoot, 'output.mp4');

  await rm(workDir, { recursive: true, force: true });
  await mkdir(workDir, { recursive: true });
  await writeFile(scenePath, params.code, 'utf8');

  const image = process.env.MANIM_DOCKER_IMAGE || 'manimcommunity/manim:stable';
  const quality = process.env.MANIM_RENDER_QUALITY || '-ql';
  const timeoutMs = Number(process.env.MANIM_RENDER_TIMEOUT_MS || 120000);
  const cpus = process.env.MANIM_RENDER_CPUS || '1';
  const memory = process.env.MANIM_RENDER_MEMORY || '1g';

  await runDocker([
    'run',
    '--rm',
    '--network',
    'none',
    '--cpus',
    cpus,
    '--memory',
    memory,
    '-v',
    `${workDir}:/workspace`,
    '-w',
    '/workspace',
    '--entrypoint',
    'python',
    image,
    '-m',
    'manim',
    quality,
    '--media_dir',
    '/workspace/media',
    'scene.py',
    'GeneratedScene',
  ], timeoutMs);

  const renderedPath = await findFirstMp4(mediaDir);

  if (!renderedPath) {
    throw new ManimRenderError('Manim finished without producing an MP4', {
      stdout: '',
      stderr: `No MP4 found in ${mediaDir}`,
      exitCode: 0,
    });
  }

  await mkdir(jobRoot, { recursive: true });
  await cp(renderedPath, finalPath);

  const fileStats = await stat(finalPath);

  return {
    localPath: finalPath,
    fileSize: fileStats.size,
    format: 'mp4',
    resolution: null,
  };
}

function runDocker(args: string[], timeoutMs: number) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn('docker', args, {
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';
    let settled = false;

    const timeout = setTimeout(() => {
      if (settled) return;
      child.kill('SIGKILL');
      settled = true;
      reject(new ManimRenderError(`Manim render timed out after ${timeoutMs}ms`, {
        stdout,
        stderr,
        exitCode: null,
      }));
    }, timeoutMs);

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('error', (error) => {
      if (settled) return;
      clearTimeout(timeout);
      settled = true;
      reject(new ManimRenderError(`Failed to start Docker: ${error.message}`, {
        stdout,
        stderr,
        exitCode: null,
      }));
    });

    child.on('close', (exitCode) => {
      if (settled) return;
      clearTimeout(timeout);
      settled = true;

      if (exitCode === 0) {
        resolve();
        return;
      }

      reject(new ManimRenderError(`Manim render failed with exit code ${exitCode}`, {
        stdout,
        stderr,
        exitCode,
      }));
    });
  });
}

async function findFirstMp4(directory: string): Promise<string | null> {
  const entries = await readdir(directory, { withFileTypes: true }).catch(() => []);

  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      const result = await findFirstMp4(entryPath);
      if (result) return result;
    }

    if (entry.isFile() && entry.name.endsWith('.mp4')) {
      return entryPath;
    }
  }

  return null;
}
