import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { checkJwt } from './middleware/auth.js';
import chatRouter from './routes/chat.js';
import goalsRouter from './routes/goals.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Protected routes
app.use('/api/chat', checkJwt, chatRouter);
app.use('/api/goals', checkJwt, goalsRouter);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Coach Agent API running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});
