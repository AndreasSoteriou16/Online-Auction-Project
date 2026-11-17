const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const PORT = process.env.PORT || 3001;
const SECRET = process.env.JWT_SECRET || 'dev-secret';
const app = express();
app.use(express.json());

const users = new Map(); // id -> {id, username, salt, hash}
let nextId = 1;

const hash = (pw, salt) => crypto.scryptSync(pw, salt, 32).toString('hex');

app.post('/users/register', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: 'username and password required' });
  if ([...users.values()].some((u) => u.username === username)) return res.status(409).json({ error: 'username taken' });
  const salt = crypto.randomBytes(16).toString('hex');
  const user = { id: String(nextId++), username, salt, hash: hash(password, salt) };
  users.set(user.id, user);
  res.status(201).json({ id: user.id, username });
});

app.post('/users/login', (req, res) => {
  const { username, password } = req.body || {};
  const u = [...users.values()].find((x) => x.username === username);
  if (!u || hash(password || '', u.salt) !== u.hash) return res.status(401).json({ error: 'invalid credentials' });
  const token = jwt.sign({ id: u.id, username: u.username }, SECRET, { expiresIn: '2h' });
  res.json({ token });
});

app.get('/users/:id', (req, res) => {
  const u = users.get(req.params.id);
  if (!u) return res.status(404).json({ error: 'not found' });
  res.json({ id: u.id, username: u.username });
});

app.listen(PORT, () => console.log(`user-service on :${PORT}`));
