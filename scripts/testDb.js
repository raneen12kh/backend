import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB, getPublicIp, printConnectionHelp } from '../config/db.js';

async function run() {
  console.log('Testing MongoDB connection...\n');

  const ip = await getPublicIp();
  if (ip) console.log('Your public IP:', ip);

  const host = process.env.MONGO_URI?.match(/@([^/?]+)/)?.[1];
  if (host) console.log('MongoDB host:', host);

  console.log('');

  try {
    await connectDB();
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('✅ Connection successful!');
    console.log('Collections:', collections.map((c) => c.name).join(', ') || '(none yet)');
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    await printConnectionHelp(error);
    process.exit(1);
  }
}

run();
