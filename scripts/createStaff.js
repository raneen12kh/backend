import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { connectDB } from '../config/db.js';

const [, , email, password, name = 'מנהל/ת', role = 'admin'] = process.argv;

if (!email || !password) {
  console.log('Usage: node scripts/createStaff.js <email> <password> [name] [role]');
  process.exit(1);
}

async function run() {
  await connectDB();

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    console.log('User already exists:', email);
    process.exit(0);
  }

  const hashed = await bcrypt.hash(password, 10);
  await User.create({
    name,
    email: email.toLowerCase(),
    password: hashed,
    role,
  });

  console.log(`Staff user created: ${email} (${role})`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
