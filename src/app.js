const express = require('express');
const cors = require('cors');
const gamesRouter = require('./routes/games');

const app = express();

app.use(cors({
  origin: 'http://localhost:5173',
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
