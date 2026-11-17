const express = require('express');
const http = require('http');
const path = require('path');
const { WebSocketServer } = require('ws');

const PORT = process.env.PORT || 3005;
const INTERNAL_KEY = process.env.INTERNAL_KEY || 'internal-dev-key';

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });
const subs = new Map(); // auctionId -> Set<ws>

wss.on('connection', (ws) => {
  ws.on('message', (raw) => {
    let msg;
    try { msg = JSON.parse(raw); } catch { return ws.send(JSON.stringify({ type: 'error', error: 'invalid json' })); }
    if (msg.action === 'subscribe' && msg.auctionId) {
      if (!subs.has(msg.auctionId)) subs.set(msg.auctionId, new Set());
      subs.get(msg.auctionId).add(ws);
      ws.send(JSON.stringify({ type: 'subscribed', auctionId: msg.auctionId }));
    }
  });
  ws.on('close', () => subs.forEach((set) => set.delete(ws)));
});

// Internal: other services push events here; we fan out to subscribers
app.post('/events', (req, res) => {
  if (req.headers['x-internal-key'] !== INTERNAL_KEY) return res.status(403).json({ error: 'forbidden' });
  const ev = req.body || {};
  const set = subs.get(ev.auctionId) || new Set();
  for (const ws of set) if (ws.readyState === 1) ws.send(JSON.stringify(ev));
  res.json({ delivered: set.size });
});

server.listen(PORT, () => console.log(`realtime-service on :${PORT} (ws path /ws)`));
