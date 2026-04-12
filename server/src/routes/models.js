import { Router } from 'express';
import auth from '../middleware/auth.js';
import { getAvailableModels } from '../services/gemini.js';

const router = Router();

router.get('/', auth, (req, res) => {
  res.json({ models: getAvailableModels() });
});

export default router;
