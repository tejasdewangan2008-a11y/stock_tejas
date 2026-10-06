const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const targetDirs = [
  path.resolve(__dirname, '..'),
  path.resolve(__dirname, '../public'),
  path.resolve(__dirname, '../public/js'),
  __dirname
];

const jsFiles = [];

targetDirs.forEach(dir => {
  if (fs.existsSync(dir)) {
    fs.readdirSync(dir).forEach(file => {
      if (file.endsWith('.js')) {
        jsFiles.push(path.join(dir, file));
      }
    });
  }
});

console.log(`Checking syntax of ${jsFiles.length} JavaScript files...`);
let failCount = 0;

jsFiles.forEach(file => {
  const relPath = path.relative(path.resolve(__dirname, '..'), file);
  try {
    execSync(`node --check "${file}"`, { stdio: 'pipe' });
    console.log(`[OK] ${relPath}`);
  } catch (err) {
    console.error(`[FAIL] ${relPath}:`);
    console.error(err.stderr ? err.stderr.toString() : err.message);
    failCount++;
  }
});

console.log(`\nSyntax Check Complete. Total: ${jsFiles.length}, Failures: ${failCount}`);
if (failCount > 0) process.exit(1);
