import express from 'express';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { chatRouter } from './routes/chat.js';
import { agentRouter } from './routes/agents.js';
import { lineRouter } from './routes/line.js';
import { setupSocketHandlers } from './socket/handler.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN ?? '*',
    methods: ['GET', 'POST'],
  },
});

// ─── Middleware ─────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ─── REST routes ───────────────────────────────────────────────────────────
app.use('/api/chat', chatRouter);
app.use('/api/agents', agentRouter);
app.use('/api/line', lineRouter);

// Health-check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// ─── WebSocket ─────────────────────────────────────────────────────────────
setupSocketHandlers(io);

// ─── Start ─────────────────────────────────────────────────────────────────
const PORT = Number(process.env.PORT) || 3000;
httpServer.listen(PORT, () => {
  console.log(`🚀 OpenClaw Connect server running on port ${PORT}`);
});

export { app, io };
