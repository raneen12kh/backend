import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import PasswordReset, { createResetToken } from '../models/PasswordReset.js';

const router = Router();
const STAFF_ROLES = ['admin', 'technician'];

function signToken(user) {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function isStaff(user) {
  return STAFF_ROLES.includes(user.role);
}

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email?.trim() || !password) {
      return res.status(400).json({ message: 'אימייל וסיסמה הם שדות חובה' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
    if (!user || !isStaff(user)) {
      return res.status(401).json({ message: 'אימייל או סיסמה שגויים' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ message: 'אימייל או סיסמה שגויים' });
    }

    const token = signToken(user);

    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'שגיאה בהתחברות' });
  }
});

router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email?.trim()) {
      return res.status(400).json({ message: 'יש להזין כתובת אימייל' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    const message =
      'אם האימייל קיים במערכת, נשלחו אליך הוראות לאיפוס הסיסמה.';

    if (user && isStaff(user)) {
      await PasswordReset.deleteMany({ userId: user._id });

      const token = createResetToken();
      await PasswordReset.create({
        userId: user._id,
        token,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      });

      if (process.env.NODE_ENV !== 'production') {
        console.log(`Password reset token for ${user.email}: ${token}`);
      }
    }

    res.json({ message });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'שגיאה בשליחת בקשת איפוס' });
  }
});

router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ message: 'טוקן וסיסמה חדשה הם שדות חובה' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'הסיסמה חייבת להכיל לפחות 6 תווים' });
    }

    const reset = await PasswordReset.findOne({
      token,
      expiresAt: { $gt: new Date() },
    });

    if (!reset) {
      return res.status(400).json({ message: 'קישור האיפוס אינו תקף או שפג תוקפו' });
    }

    const user = await User.findById(reset.userId);
    if (!user || !isStaff(user)) {
      return res.status(400).json({ message: 'קישור האיפוס אינו תקף' });
    }

    user.password = await bcrypt.hash(password, 10);
    await user.save();
    await PasswordReset.deleteMany({ userId: user._id });

    res.json({ message: 'הסיסמה עודכנה בהצלחה. אפשר להתחבר.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'שגיאה באיפוס הסיסמה' });
  }
});

export default router;
