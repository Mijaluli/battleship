const express = require('express');
const cors = require('cors');
const gamesRouter = require('./routes/games');

const app = express();

const LOCAL_ORIGIN = 'http://localhost:5173';
const NETLIFY_PATTERN = /^https:\/\/[a-z0-9-]+\.netlify\.app$/;

function isAllowedOrigin(origin) {
  if (!origin) return true;
  if (origin === LOCAL_ORIGIN) return true;
  if (process.env.CLIENT_ORIGIN && origin === process.env.CLIENT_ORIGIN) return true;
  if (NETLIFY_PATTERN.test(origin)) return true;
  return false;
}

app.use(cors({
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin)) return callback(null, true);
    callback(new Error(`Not allowed by CORS: ${origin}`));
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
}));

app.use(express.json());
app.use('/api/games', gamesRouter);

// 404 — unknown routes
app.use((req, res) => {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Route not found.' } });
});

// Global error handler
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: { code: 'INVALID_JSON', message: 'Malformed JSON body.' } });
  }
  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error.' } });
});

module.exports = app;
