/*
 * 输出所有 lesson 的 blocks 区段（用于 review / 改写规划）
 * 用法：node tools/dump-blocks.js [stages-a|stageb|both]
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const which = process.argv[2] || 'both';

function dump(file) {
  const src = fs.readFileSync(path.join(ROOT, file), 'utf8');
  const lessonIds = [...src.matchAll(/id: '(s\d+l\d+)'/g)].map(m => m[1]);
  for (const id of lessonIds) {
    const i = src.indexOf(`id: '${id}'`);
    const blkIdx = src.indexOf('blocks:', i);
    if (blkIdx < 0) continue;
    const arrStart = src.indexOf('[', blkIdx);
    // 找匹配的 ]
    let depth = 0, j = arrStart;
    while (j < src.length) {
      const c = src[j];
      if (c === '[') depth++;
      else if (c === ']') { depth--; if (depth === 0) break; }
      j++;
    }
    const blocksText = src.slice(arrStart, j + 1);
    console.log(`\n##### ${id} #####`);
    console.log(blocksText);
  }
}

if (which === 'both' || which === 'stages-a') dump('data/stages-a.js');
if (which === 'both' || which === 'stagesb' || which === 'stageb') dump('data/stages-b.js');