import 'dotenv/config';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import User from '../models/User.js';
import { connectDB } from '../config/db.js';

const ADMIN_EMAIL = 'raneenkharma848@gmail.com';
const ADMIN_PASSWORD = '123123';
const ADMIN_NAME = 'Raneen';

async function seedAdmin() {
  const existing = await User.findOne({ email: ADMIN_EMAIL });
  if (existing) {
    console.log('Admin already exists:', ADMIN_EMAIL);
    return;
  }

  const hashed = await bcrypt.hash(ADMIN_PASSWORD, 10);
  await User.create({
    name: ADMIN_NAME,
    email: ADMIN_EMAIL,
    password: hashed,
    role: 'admin',
  });

  console.log('Admin created:', ADMIN_EMAIL);
}

async function main() {
  try {
    await connectDB();
    await seedAdmin();
    console.log('\n✅ Ready!');
    console.log('Email:   ', ADMIN_EMAIL);
    console.log('Password:', ADMIN_PASSWORD);
    console.log('\nNow run: npm run dev\n');
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Setup failed:', error.message);
    process.exit(1);
  }
}

main();
