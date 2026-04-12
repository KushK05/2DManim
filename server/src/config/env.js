import dotenv from 'dotenv';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const CONFIG_DIR = dirname(fileURLToPath(import.meta.url));
const SERVER_ROOT = resolve(CONFIG_DIR, '..', '..');
const REPO_ROOT = resolve(SERVER_ROOT, '..');

// Load root .env first so local `server/.env` placeholders cannot shadow valid values.
dotenv.config({ path: resolve(REPO_ROOT, '.env') });
dotenv.config({ path: resolve(SERVER_ROOT, '.env') });

function cleanSecret(value) {
  if (typeof value !== 'string') return '';

  const trimmed = value.trim().replace(/^['"]|['"]$/g, '');
  if (!trimmed) return '';

  const lower = trimmed.toLowerCase();
  if (
    lower === 'your-gemini-api-key-here'
    || lower === 'your-mistral-api-key-here'
    || lower === 'replace-me'
    || lower === 'changeme'
  ) {
    return '';
  }

  return trimmed;
}

const geminiApiKey = cleanSecret(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY);
const mistralApiKey = cleanSecret(process.env.MISTRAL_API_KEY);
const geminiModel = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const mistralModel = process.env.MISTRAL_MODEL || 'mistral-medium-latest';
const defaultModel = process.env.DEFAULT_MODEL || (mistralApiKey ? mistralModel : geminiModel);

export default {
  port: process.env.PORT || 5000,
  mongodbUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
  geminiApiKey,
  mistralApiKey,
  geminiModel,
  mistralModel,
  defaultModel,
  enableLocalRender: process.env.ENABLE_LOCAL_RENDER === 'true',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  nodeEnv: process.env.NODE_ENV || 'development',
};
