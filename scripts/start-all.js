const { spawn } = require('child_process');
const path = require('path');
const services = ['user-service', 'item-service', 'bid-service', 'payment-service', 'realtime-service'];
for (const s of services) {
  const p = spawn(process.execPath, ['index.js'], { cwd: path.join(__dirname, '..', s), stdio: 'inherit' });
  p.on('exit', (c) => console.log(`${s} exited (${c})`));
  process.on('SIGINT', () => { p.kill(); process.exit(); });
}
