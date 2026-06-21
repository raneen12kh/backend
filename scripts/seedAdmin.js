import 'dotenv/config';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { connectDB } from '../config/db.js';

const ADMIN_EMAIL = 'raneenkharma848@gmail.com';
const ADMIN_PASSWORD = '123123';
const ADMIN_NAME = 'Raneen';

export async function ensureAdminUser() {
  const existing = await User.findOne({ email: ADMIN_EMAIL });
  if (existing) return;

  const hashed = await bcrypt.hash(ADMIN_PASSWORD, 10);
  await User.create({
    name: ADMIN_NAME,
    email: ADMIN_EMAIL,
    password: hashed,
    role: 'admin',
  });

  console.log('Default admin ready:', ADMIN_EMAIL);
}
