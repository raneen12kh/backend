import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let memoryServer = null;

export async function connectDB() {
  let uri = process.env.MONGO_URI;

  if (process.env.USE_EMBEDDED_MONGO === 'true') {
    if (!memoryServer) {
      memoryServer = await MongoMemoryServer.create({
        instance: { launchTimeout: 60000 },
      });
      console.log('Using embedded local MongoDB (no Atlas/Docker needed)');
    }
    uri = memoryServer.getUri('myDatabase');
  }

  if (!uri) {
    throw new Error('MONGO_URI is missing — add it to backend/.env');
  }

  mongoose.set('strictQuery', true);

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10000,
    family: 4,
  });

  console.log('MongoDB connected');
}

export function getDbStatus() {
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  return states[mongoose.connection.readyState] ?? 'unknown';
}

export async function getPublicIp() {
  try {
    const res = await fetch('https://api.ipify.org?format=json');
    const data = await res.json();
    return data.ip;
  } catch {
    return null;
  }
}

export async function printConnectionHelp(error) {
  const ip = await getPublicIp();
  console.error('\n❌ MongoDB connection failed');
  console.error('Reason:', error.message);
  if (process.env.USE_EMBEDDED_MONGO !== 'true') {
    if (ip) {
      console.error(`\nYour public IP right now: ${ip}`);
      console.error('Add this IP in MongoDB Atlas → Network Access → Add IP Address');
    }
    console.error('\nOr use embedded MongoDB for development:');
    console.error('Set USE_EMBEDDED_MONGO=true in backend/.env and restart.\n');
  }
}
