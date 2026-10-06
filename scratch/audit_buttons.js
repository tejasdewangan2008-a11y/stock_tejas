const fs = require('fs');

const html = fs.readFileSync('public/index.html', 'utf8');

const btnRegex = /<button\s+([^>]+)>([\s\S]*?)<\/button>/gi;
let m;
let total = 0;
const buttonsWithoutHandler = [];

while ((m = btnRegex.exec(html)) !== null) {
  total++;
  const attrs = m[1];
  const inner = m[2].replace(/<[^>]+>/g, '').trim();

  const idMatch = /id=["']([^"']+)["']/.exec(attrs);
  const onclickMatch = /onclick=["']([^"']+)["']/.exec(attrs);
  const classMatch = /class=["']([^"']+)["']/.exec(attrs);
  const dataModalMatch = /data-close-modal|data-modal|data-view|data-tab/.exec(attrs);

  const id = idMatch ? idMatch[1] : null;
  const onclick = onclickMatch ? onclickMatch[1] : null;
  const classes = classMatch ? classMatch[1] : '';

  buttonsWithoutHandler.push({
    id,
    onclick,
    classes,
    inner,
    hasDataAction: !!dataModalMatch,
    attrs
  });
}

console.log(`Auditing ${total} buttons from index.html...`);

// Check which buttons have NO ID and NO ONCLICK and NO DATA ACTION
const unhandled = buttonsWithoutHandler.filter(b => !b.id && !b.onclick && !b.hasDataAction);
console.log(`Found ${unhandled.length} buttons without id/onclick/dataAction:`);
unhandled.forEach(u => console.log(`  - Text: "${u.inner}" | Classes: "${u.classes}"`));
