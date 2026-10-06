const fs = require('fs');

const jsFiles = [
  'public/js/app.js',
  'public/js/charts.js',
  'public/js/dashboard.js',
  'public/js/query-builder.js'
];

const classesToCheck = [
  'pill-item',
  'tv-tf-btn',
  'ci-suggestion-chip',
  'ai-quick-btn',
  'modal-close-btn',
  'ai-rec-apply-btn',
  'math-op-btn',
  'gateway-select-btn',
  'ci-mode-pill',
  'filter-tab-btn'
];

classesToCheck.forEach(cls => {
  let found = [];
  for (const file of jsFiles) {
    const code = fs.readFileSync(file, 'utf8');
    if (code.includes(cls)) {
      found.push(file);
    }
  }
  console.log(`Class .${cls} handled in: ${found.join(', ') || 'NONE!'}`);
});
