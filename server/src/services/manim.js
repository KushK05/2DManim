import { execFile } from 'child_process';
import { writeFile, mkdir, readdir, unlink, rmdir } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

const TIMEOUT_MS = 120_000;
const UPLOADS_DIR = join(process.cwd(), 'uploads', 'videos');

export async function renderManim(manimCode) {
  const jobId = uuidv4();
  const tempDir = join('/tmp', `manim-${jobId}`);
  await mkdir(tempDir, { recursive: true });

  const scriptPath = join(tempDir, 'scene.py');
  await writeFile(scriptPath, manimCode, 'utf-8');

  return new Promise((resolve, reject) => {
    const args = [
      'run', '--rm',
      '--network', 'none',
      '--memory', '512m',
      '--cpus', '1',
      '-v', `${tempDir}:/manim/input:ro`,
      '-v', `${tempDir}/output:/manim/media`,
      '-w', '/manim',
      '2dmanim-manim',
      '-ql',
      'input/scene.py',
      'GeneratedScene',
    ];

    const child = execFile('docker', args, {
      timeout: TIMEOUT_MS,
      maxBuffer: 5 * 1024 * 1024,
    }, async (error, stdout, stderr) => {
      if (error) {
        await cleanup(tempDir);
        return reject(new Error(`Manim render failed: ${stderr || error.message}`));
      }

      try {
        // Find the output video file
        const mediaDir = join(tempDir, 'output');
        const videoFile = await findVideo(mediaDir);

        if (!videoFile) {
          await cleanup(tempDir);
          return reject(new Error('No video output produced'));
        }

        // Copy video to uploads directory
        await mkdir(UPLOADS_DIR, { recursive: true });
        const outputFilename = `${jobId}.mp4`;
        const outputPath = join(UPLOADS_DIR, outputFilename);

        const { copyFile } = await import('fs/promises');
        await copyFile(videoFile, outputPath);

        await cleanup(tempDir);
        resolve({
          videoUrl: `/api/videos/${outputFilename}`,
          jobId,
        });
      } catch (err) {
        await cleanup(tempDir);
        reject(err);
      }
    });
  });
}

async function findVideo(dir) {
  try {
    const entries = await readdir(dir, { withFileTypes: true, recursive: true });
    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith('.mp4')) {
        return join(entry.parentPath || entry.path, entry.name);
      }
    }
  } catch {
    return null;
  }
  return null;
}

async function cleanup(dir) {
  try {
    const { rm } = await import('fs/promises');
    await rm(dir, { recursive: true, force: true });
  } catch {
    // ignore cleanup errors
  }
}
