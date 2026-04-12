import { Router } from 'express';
import auth from '../middleware/auth.js';
import Generation from '../models/Generation.js';

const router = Router();

router.get('/', auth, async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
  const skip = (page - 1) * limit;

  const [generations, total] = await Promise.all([
    Generation.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Generation.countDocuments({ userId: req.user._id }),
  ]);

  res.json({
    generations,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
});

router.get('/:id', auth, async (req, res) => {
  const generation = await Generation.findOne({
    _id: req.params.id,
    userId: req.user._id,
  });

  if (!generation) {
    return res.status(404).json({ error: 'Generation not found' });
  }

  res.json({ generation });
});

export default router;
