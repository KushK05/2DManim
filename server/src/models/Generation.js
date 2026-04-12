import mongoose from 'mongoose';

const generationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  prompt: {
    type: String,
    required: true,
  },
  model: {
    type: String,
    required: true,
  },
  manimCode: {
    type: String,
    default: null,
  },
  videoUrl: {
    type: String,
    default: null,
  },
  status: {
    type: String,
    enum: ['pending', 'generating', 'rendering', 'completed', 'failed'],
    default: 'pending',
  },
  error: {
    type: String,
    default: null,
  },
}, { timestamps: true });

export default mongoose.model('Generation', generationSchema);
