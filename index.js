import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import { connectDB, getDbStatus, printConnectionHelp } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import { ensureAdminUser } from './scripts/seedAdmin.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5500' }));
app.use(express.json());

app.get('/api/health', (_req, res) => {
  const db = getDbStatus();
  res.json({
    ok: db === 'connected',
    db,
    message: db === 'connected' ? 'Server and database are running' : 'Server running but database not connected',
  });
});

app.use('/api/auth', authRoutes);

async function tryConnectDB() {
  try {
    await connectDB();
    if (process.env.USE_EMBEDDED_MONGO === 'true') {
      await ensureAdminUser();
    }
    return true;
  } catch (error) {
    await printConnectionHelp(error);
    return false;
  }
}

async function start() {
  if (!process.env.JWT_SECRET) {
    console.error('JWT_SECRET is missing — add it to backend/.env');
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  const connected = await tryConnectDB();

  if (!connected) {
    console.log('Server is up, but login will not work until MongoDB connects.');
    console.log('Tip: set USE_EMBEDDED_MONGO=true in backend/.env and restart.\n');

    setInterval(async () => {
      if (getDbStatus() !== 'connected') {
        console.log('Retrying MongoDB connection...');
        await tryConnectDB();
      }
    }, 30000);
  }
}

start();
