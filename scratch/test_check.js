const { execSync } = require('child_process');

const files = [
  'server.js',
  'market-service.js',
  'scans.js',
  'segments.js',
  'stock-data.js',
  'build-directory.js',
  'generate-png-icons.js',
  'scratch_parse.js',
  'public/sw.js',
  'public/js/app.js',
  'public/js/charts.js',
  'public/js/dashboard.js',
  'public/js/query-builder.js'
];

let errors = [];
for (const f of files) {
  try {
    execSync(`node --check "${f}"`, { stdio: 'pipe' });
    console.log('✓ OK:', f);
  } catch (e) {
    console.error('✗ ERROR in ' + f + ':', e.stderr ? e.stderr.toString() : e.message);
    errors.push(f);
  }
}
if (errors.length > 0) {
  console.log('Total files with syntax errors:', errors.length);
  process.exit(1);
} else {
  console.log('All files pass syntax check!');
}
