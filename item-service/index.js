const express = require('express');
const jwt = require('jsonwebtoken');

const PORT = process.env.PORT || 3002;
const SECRET = process.env.JWT_SECRET || 'dev-secret';
const INTERNAL_KEY = process.env.INTERNAL_KEY || 'internal-dev-key';
const REALTIME_URL = process.env.REALTIME_URL || 'http://localhost:3005';
const PAYMENT_URL = process.env.PAYMENT_URL || 'http://localhost:3004';

const app = express();
app.use(express.json());

const items = new Map();
let nextId = 1;

function auth(req, res, next) {
  try { req.user = jwt.verify((req.headers.authorization || '').replace('Bearer ', ''), SECRET); next(); }
  catch { res.status(401).json({ error: 'unauthorized' }); }
}
function internal(req, res, next) {
  if (req.headers['x-internal-key'] !== INTERNAL_KEY) return res.status(403).json({ error: 'forbidden' });
  next();
}
const post = (url, body) => fetch(url, {
  method: 'POST',
  headers: { 'content-type': 'application/json', 'x-internal-key': INTERNAL_KEY },
  body: JSON.stringify(body),
}).catch((e) => console.error('call failed', url, e.message));

app.post('/items', auth, (req, res) => {
  const { title, description = '', startingPrice, durationSeconds } = req.body || {};
  if (!title || !(startingPrice > 0) || !(durationSeconds > 0))
    return res.status(400).json({ error: 'title, startingPrice > 0 and durationSeconds > 0 required' });
  const item = {
    id: String(nextId++), title, description, sellerId: req.user.id,
    startingPrice, currentPrice: startingPrice, highestBidderId: null,
    endsAt: new Date(Date.now() + durationSeconds * 1000).toISOString(), status: 'open',
  };
  items.set(item.id, item);
  res.status(201).json(item);
});

app.get('/items', (req, res) => res.json([...items.values()]));
app.get('/items/:id', (req, res) => {
  const i = items.get(req.params.id);
  i ? res.json(i) : res.status(404).json({ error: 'not found' });
});

// Internal: called by bid-service. This service owns the current price, so the check is atomic here.
app.post('/internal/items/:id/bid', internal, (req, res) => {
  const i = items.get(req.params.id);
  const { amount, bidderId } = req.body || {};
  if (!i) return res.status(404).json({ error: 'not found' });
  if (i.status !== 'open') return res.status(409).json({ error: 'auction closed' });
  if (i.sellerId === bidderId) return res.status(403).json({ error: 'seller cannot bid on own item' });
  if (!(amount > i.currentPrice)) return res.status(409).json({ error: `bid must exceed ${i.currentPrice}` });
  i.currentPrice = amount;
  i.highestBidderId = bidderId;
  res.json(i);
});

// Close expired auctions
setInterval(() => {
  for (const i of items.values()) {
    if (i.status === 'open' && Date.now() >= new Date(i.endsAt).getTime()) {
      i.status = 'closed';
      console.log(`auction ${i.id} closed, winner: ${i.highestBidderId}`);
      post(`${REALTIME_URL}/events`, { type: 'auction.closed', auctionId: i.id, winnerId: i.highestBidderId, finalPrice: i.currentPrice });
      if (i.highestBidderId)
        post(`${PAYMENT_URL}/payments`, { itemId: i.id, buyerId: i.highestBidderId, sellerId: i.sellerId, amount: i.currentPrice });
    }
  }
}, 1000);

app.listen(PORT, () => console.log(`item-service on :${PORT}`));
