import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';
import env from './config/env.js';
import connectDB from './config/db.js';
import { apiLimiter } from './middleware/rateLimit.js';

import authRoutes from './routes/auth.js';
import generateRoutes from './routes/generate.js';
import historyRoutes from './routes/history.js';
import billingRoutes from './routes/billing.js';
import modelsRoutes from './routes/models.js';

const app = express();
const SERVER_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const UPLOADS_DIR = join(SERVER_ROOT, 'uploads', 'videos');

app.use(helmet());
app.use(cors({ origin: env.clientUrl, credentials: true }));
app.use(express.json());
app.use('/api', apiLimiter);

// Serve uploaded videos
app.use('/api/videos', express.static(UPLOADS_DIR));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/generate', generateRoutes);
app.use('/api/generations', historyRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/models', modelsRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const start = async () => {
  await connectDB();
  app.listen(env.port, () => {
    console.log(`Server running on port ${env.port}`);
  });
};

start();
