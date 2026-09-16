const fs = require('fs');
const s = fs.readFileSync('data/stages-a.js', 'utf8');
const ids = ['s1l1','s1l2','s1l3','s1l4','s2l1','s2l2','s2l3','s2l4','s3l1','s3l2','s3l3','s3l4','s3l4'];
for (const id of ids) {
  const i = s.indexOf(`id: '${id}'`);
  if (i < 0) { console.log(id, '(NOT FOUND)'); continue; }
  const p = s.indexOf(`{ t: 'p'`, i);
  if (p < 0) { console.log(id, '(NO p block)'); continue; }
  const end = s.indexOf(" }, { t:", p);
  const txt = (end > 0 ? s.slice(p, end) : s.slice(p, p + 130)).replace(/\n/g, ' ');
  console.log(id, ':', txt.slice(0, 100));
}