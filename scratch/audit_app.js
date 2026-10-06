const fs = require('fs');

const html = fs.readFileSync('public/index.html', 'utf8');

// 1. Check data-view buttons vs view- containers
const navRegex = /data-view=["']([^"']+)["']/g;
const dataViews = new Set();
let m;
while ((m = navRegex.exec(html)) !== null) dataViews.add(m[1]);

const viewSectionsRegex = /id=["'](view-[a-zA-Z0-9_-]+)["']/g;
const viewSections = new Set();
while ((m = viewSectionsRegex.exec(html)) !== null) viewSections.add(m[1]);

console.log('Navigation data-views:', [...dataViews]);
console.log('View section containers:', [...viewSections]);

for (const v of dataViews) {
  const expectedId = `view-${v}`;
  if (!viewSections.has(expectedId)) {
    console.error(`[BROKEN VIEW] data-view="${v}" has NO corresponding container #${expectedId}!`);
  }
}

// 2. Check all buttons in index.html for onclick or id
const buttonRegex = /<button\s+([^>]+)>/g;
let btnCount = 0;
let btnsWithoutIdOrAction = 0;
while ((m = buttonRegex.exec(html)) !== null) {
  btnCount++;
  const attrs = m[1];
  const hasId = /id=["'][^"']+["']/.test(attrs);
  const hasOnclick = /onclick=["'][^"']+["']/.test(attrs);
  const hasClass = /class=["'][^"']+["']/.test(attrs);
  const hasData = /data-[^=]+=["'][^"']+["']/.test(attrs);
  if (!hasId && !hasOnclick && !hasData) {
    btnsWithoutIdOrAction++;
    // console.log('Button without id/action:', attrs);
  }
}
console.log(`Total buttons in HTML: ${btnCount} (Unidentified: ${btnsWithoutIdOrAction})`);

// 3. Check modals in index.html
const modalRegex = /class=["'][^"']*modal[^"']*["'][^>]*id=["']([^"']+)["']/g;
const modals = [];
while ((m = modalRegex.exec(html)) !== null) modals.push(m[1]);
console.log('Modals found:', modals);

// 4. Check all tabs / sub-navigation
const tabRegex = /data-tab=["']([^"']+)["']/g;
const tabs = new Set();
while ((m = tabRegex.exec(html)) !== null) tabs.add(m[1]);
console.log('Data tabs found:', [...tabs]);
