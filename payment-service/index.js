const express = require('express');
const jwt = require('jsonwebtoken');

const PORT = process.env.PORT || 3004;
const SECRET = process.env.JWT_SECRET || 'dev-secret';
const INTERNAL_KEY = process.env.INTERNAL_KEY || 'internal-dev-key';

const app = express();
app.use(express.json());

const payments = new Map();
let nextId = 1;

function auth(req, res, next) {
  try { req.user = jwt.verify((req.headers.authorization || '').replace('Bearer ', ''), SECRET); next(); }
  catch { res.status(401).json({ error: 'unauthorized' }); }
}

// Internal: created by item-service when an auction closes with a winner
app.post('/payments', (req, res) => {
  if (req.headers['x-internal-key'] !== INTERNAL_KEY) return res.status(403).json({ error: 'forbidden' });
  const { itemId, buyerId, sellerId, amount } = req.body || {};
  const p = { id: String(nextId++), itemId, buyerId, sellerId, amount, status: 'pending', createdAt: new Date().toISOString() };
  payments.set(p.id, p);
  res.status(201).json(p);
});

app.get('/payments', auth, (req, res) =>
  res.json([...payments.values()].filter((p) => p.buyerId === req.user.id || p.sellerId === req.user.id)));

app.get('/payments/:id', auth, (req, res) => {
  const p = payments.get(req.params.id);
  if (!p) return res.status(404).json({ error: 'not found' });
  if (p.buyerId !== req.user.id && p.sellerId !== req.user.id) return res.status(403).json({ error: 'forbidden' });
  res.json(p);
});

// Simulated payment (no real provider)
app.post('/payments/:id/pay', auth, (req, res) => {
  const p = payments.get(req.params.id);
  if (!p) return res.status(404).json({ error: 'not found' });
  if (p.buyerId !== req.user.id) return res.status(403).json({ error: 'only the buyer can pay' });
  if (p.status === 'paid') return res.status(409).json({ error: 'already paid' });
  p.status = 'paid';
  p.paidAt = new Date().toISOString();
  res.json(p);
});

app.listen(PORT, () => console.log(`payment-service on :${PORT}`));
