const fs = require('fs');
const content = fs.readFileSync('C:/Users/TEJAS KUMAR DEWANGAN/.gemini/antigravity-ide/brain/dcaa556b-0b84-40ec-878d-e3e990fc73b9/.system_generated/steps/233/content.md', 'utf8');

const key = ':scan-json="';
const start = content.indexOf(key);
if (start !== -1) {
  const jsonStart = start + key.length;
  const jsonEnd = content.indexOf('"\n', jsonStart) !== -1 ? content.indexOf('"\n', jsonStart) : content.indexOf('" ref="scan"', jsonStart);
  let raw = content.substring(jsonStart, jsonEnd);
  raw = raw.replace(/&quot;/g, '"').replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(/&amp;/g, '&');
  const obj = JSON.parse(raw);
  console.log('NAME:', obj.name);
  console.log('DESCRIPTION:', obj.description);
  console.log('ATLAS_QUERY:', obj.atlas_query);
  console.log('ATLAS_JSON:');
  const atlas = JSON.parse(obj.atlas_json);
  console.log(JSON.stringify(atlas, null, 2));
} else {
  console.log('Key not found');
}
