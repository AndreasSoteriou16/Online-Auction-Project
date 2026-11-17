const express = require('express');
const jwt = require('jsonwebtoken');

const PORT = process.env.PORT || 3003;
const SECRET = process.env.JWT_SECRET || 'dev-secret';
const INTERNAL_KEY = process.env.INTERNAL_KEY || 'internal-dev-key';
const ITEM_URL = process.env.ITEM_URL || 'http://localhost:3002';
const REALTIME_URL = process.env.REALTIME_URL || 'http://localhost:3005';

const app = express();
app.use(express.json());

const bids = []; // {id, itemId, bidderId, amount, at}

function auth(req, res, next) {
  try { req.user = jwt.verify((req.headers.authorization || '').replace('Bearer ', ''), SECRET); next(); }
  catch { res.status(401).json({ error: 'unauthorized' }); }
}

app.post('/items/:id/bids', auth, async (req, res) => {
  const amount = Number(req.body && req.body.amount);
  if (!(amount > 0)) return res.status(400).json({ error: 'amount required' });
  try {
    const r = await fetch(`${ITEM_URL}/internal/items/${req.params.id}/bid`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-internal-key': INTERNAL_KEY },
      body: JSON.stringify({ amount, bidderId: req.user.id }),
    });
    const body = await r.json();
    if (!r.ok) return res.status(r.status).json(body);
    const bid = { id: String(bids.length + 1), itemId: req.params.id, bidderId: req.user.id, bidderName: req.user.username, amount, at: new Date().toISOString() };
    bids.push(bid);
    fetch(`${REALTIME_URL}/events`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-internal-key': INTERNAL_KEY },
      body: JSON.stringify({ type: 'bid.placed', auctionId: bid.itemId, bid }),
    }).catch((e) => console.error('realtime notify failed', e.message));
    res.status(201).json(bid);
  } catch (e) {
    res.status(502).json({ error: 'item-service unavailable' });
  }
});

app.get('/items/:id/bids', (req, res) => res.json(bids.filter((b) => b.itemId === req.params.id)));

app.listen(PORT, () => console.log(`bid-service on :${PORT}`));
