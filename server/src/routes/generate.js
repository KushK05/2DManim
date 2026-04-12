import { Router } from 'express';
import auth from '../middleware/auth.js';
import { generateLimiter } from '../middleware/rateLimit.js';
import { generateManimCode, repairManimCode } from '../services/gemini.js';
import { renderManim } from '../services/manim.js';
import Generation from '../models/Generation.js';
import env from '../config/env.js';

const router = Router();

function isSyntaxLikeRenderError(message) {
  const text = String(message || '').toLowerCase();
  return (
    text.includes('syntaxerror')
    || text.includes('was never closed')
    || text.includes('invalid syntax')
    || text.includes('eol while scanning')
    || text.includes('unexpected eof while parsing')
  );
}

router.post('/', auth, generateLimiter, async (req, res) => {
  const { prompt, model = env.defaultModel, renderVideo = false } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  if (prompt.length > 2000) {
    return res.status(400).json({ error: 'Prompt too long (max 2000 characters)' });
  }

  const generation = await Generation.create({
    userId: req.user._id,
    prompt,
    model,
    status: 'generating',
  });

  try {
    const manimCode = await generateManimCode(prompt, model);
    generation.manimCode = manimCode;
    await generation.save();

    const shouldRenderVideo = Boolean(renderVideo) && env.enableLocalRender;

    if (shouldRenderVideo) {
      generation.status = 'rendering';
      await generation.save();

      try {
        const { videoUrl } = await renderManim(manimCode);
        generation.videoUrl = videoUrl;
      } catch (renderError) {
        if (!isSyntaxLikeRenderError(renderError?.message)) {
          throw renderError;
        }

        const repairedCode = await repairManimCode(manimCode, renderError.message, model);
        generation.manimCode = repairedCode;
        generation.status = 'rendering';
        await generation.save();

        const retry = await renderManim(repairedCode);
        generation.videoUrl = retry.videoUrl;
      }

      generation.status = 'completed';
      await generation.save();
    } else {
      generation.status = 'completed';
      await generation.save();
    }

    res.json({
      generation,
      renderSkipped: Boolean(renderVideo) && !env.enableLocalRender,
    });
  } catch (error) {
    generation.status = 'failed';
    generation.error = error.message;
    await generation.save();
    res.status(500).json({ error: error.message, generation });
  }
});

export default router;
