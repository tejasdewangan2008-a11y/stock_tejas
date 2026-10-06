const { execSync } = require('child_process');
const http = require('http');

console.log('--- Checking active node processes ---');
try {
  const out = execSync('wmic process where "name=\'node.exe\'" get ProcessId,CommandLine').toString();
  console.log(out);
} catch (e) {
  console.log('WMIC error:', e.message);
}

console.log('--- Testing HTTP connection to http://localhost:3000 ---');
const req = http.get('http://localhost:3000/api/health', (res) => {
  console.log('HTTP Status:', res.statusCode);
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('Response:', data.slice(0, 200)));
});
req.on('error', (err) => {
  console.log('Connection failed:', err.message);
});
req.setTimeout(3000, () => {
  console.log('Connection timed out');
  req.destroy();
});
