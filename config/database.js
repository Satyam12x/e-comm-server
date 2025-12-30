import mongoose from 'mongoose';
import logger from './logger.js';

// ✅ Cache connection for serverless
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
  // ✅ Return cached connection if exists
  if (cached.conn) {
    logger.info('Using cached database connection');
    return cached.conn;
  }

  if (!process.env.MONGO_URI) {
    logger.error('MONGO_URI is not defined');
    throw new Error('MONGO_URI is not defined');
  }

  // ✅ If no cached promise, create new connection
  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
    };

    cached.promise = mongoose.connect(process.env.MONGO_URI, opts)
      .then((mongoose) => {
        logger.info(`MongoDB Connected: ${mongoose.connection.host}`);
        return mongoose;
      })
      .catch((error) => {
        logger.error(`MongoDB Connection Error: ${error.message}`);
        cached.promise = null;
        throw error;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    throw error;
  }

  return cached.conn;
};

// ✅ Only add event listeners once
if (!global.mongooseListenersAdded) {
  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB disconnected');
    cached.conn = null;
    cached.promise = null;
  });

  mongoose.connection.on('error', (err) => {
    logger.error(`MongoDB error: ${err.message}`);
  });

  global.mongooseListenersAdded = true;
}

export default connectDB;
