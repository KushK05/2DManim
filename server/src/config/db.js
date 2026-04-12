import mongoose from 'mongoose';
import env from './env.js';

const connectDB = async () => {
  try {
    if (!env.mongodbUri) {
      throw new Error('MONGODB_URI is not configured. Copy .env.example to .env and set the required values.');
    }

    const conn = await mongoose.connect(env.mongodbUri);
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    process.exit(1);
  }
};

export default connectDB;
