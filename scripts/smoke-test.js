// End-to-end check. Run `npm start` in another terminal first, then `npm test`.
const U = 'http://localhost:3001', I = 'http://localhost:3002', B = 'http://localhost:3003', P = 'http://localhost:3004';
const j = async (url, method = 'GET', body, token) => {
  const r = await fetch(url, { method, headers: { 'content-type': 'application/json', ...(token && { authorization: `Bearer ${token}` }) }, body: body && JSON.stringify(body) });
  return { status: r.status, body: await r.json() };
};
const ok = (cond, msg) => { console.log(cond ? 'PASS' : 'FAIL', msg); if (!cond) process.exitCode = 1; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const suffix = Date.now();
  const seller = `seller${suffix}`, buyer = `buyer${suffix}`;
  await j(`${U}/users/register`, 'POST', { username: seller, password: 'pw' });
  await j(`${U}/users/register`, 'POST', { username: buyer, password: 'pw' });
  const st = (await j(`${U}/users/login`, 'POST', { username: seller, password: 'pw' })).body.token;
  const bt = (await j(`${U}/users/login`, 'POST', { username: buyer, password: 'pw' })).body.token;
  ok(st && bt, 'register + login');

  const item = (await j(`${I}/items`, 'POST', { title: 'Test lamp', startingPrice: 10, durationSeconds: 4 }, st)).body;
  ok(item.id, 'create item');

  const events = [];
  const ws = new WebSocket('ws://localhost:3005/ws');
  await new Promise((r) => (ws.onopen = r));
  ws.onmessage = (e) => events.push(JSON.parse(e.data));
  ws.send(JSON.stringify({ action: 'subscribe', auctionId: item.id }));
  await sleep(300);

  ok((await j(`${B}/items/${item.id}/bids`, 'POST', { amount: 20 }, st)).status === 403, 'seller cannot bid on own item');
  ok((await j(`${B}/items/${item.id}/bids`, 'POST', { amount: 5 }, bt)).status === 409, 'low bid rejected');
  ok((await j(`${B}/items/${item.id}/bids`, 'POST', { amount: 25 }, bt)).status === 201, 'valid bid accepted');
  await sleep(300);
  ok(events.some((e) => e.type === 'bid.placed'), 'websocket received bid.placed');

  await sleep(5000);
  ok(events.some((e) => e.type === 'auction.closed'), 'websocket received auction.closed');
  const pays = (await j(`${P}/payments`, 'GET', null, bt)).body;
  ok(pays.length === 1 && pays[0].amount === 25, 'payment created for winner');
  ok((await j(`${P}/payments/${pays[0].id}/pay`, 'POST', null, bt)).body.status === 'paid', 'payment paid');
  ws.close();
})();
