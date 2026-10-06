const fs = require('fs');

const missingIds = [
  "appToastContainer", "btnChartFetchCustom", "statSma50", "statSma200",
  "btnCopyPassword", "tunnelPasswordDisplay", "tunnelPasswordCard",
  "qrStepPwText", "btnPwaInstall", "btnHeaderDuplicate", "btnTogglePassType",
  "btnOpenSegmentModal", "btnToggleConditions", "filterRowsList",
  "toggleConditionsText", "btnHeaderComment", "btnHeaderDebug",
  "btnAddFilter", "btnAddFilterGroup", "btnCopyBuilderSymbols",
  "btnExportBuilderCsv", "btnExportBuilderExcel", "currentSegmentLabel"
];

const jsFiles = ['public/js/app.js', 'public/js/dashboard.js', 'public/js/charts.js', 'public/js/query-builder.js'];

for (const file of jsFiles) {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  missingIds.forEach(id => {
    lines.forEach((line, idx) => {
      if (line.includes(`'${id}'`) || line.includes(`"${id}"`)) {
        console.log(`${file}:${idx + 1} -> ${line.trim()}`);
      }
    });
  });
}
