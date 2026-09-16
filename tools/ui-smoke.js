/*
 * 界面冒烟测试（jsdom）
 * 真实执行 index.html 里的全部脚本，验证：
 *   1. 首页渲染 + 阶段卡片 + 锁定状态
 *   2. 进入第 1 课：理论块、可运行代码块、练习卡
 *   3. 点「运行」拿到正确输出
 *   4. 填入参考答案 → 「检查答案」全绿 → 标记完成 → 写入 localStorage
 *   5. 全部练习做完后测验解锁；答对后下一阶段解锁
 * 用法：node tools/ui-smoke.js
 */
const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require(
  path.join('C:/Users/Administrator/.workbuddy-ai/binaries/node/workspace/node_modules/jsdom')
);

const ROOT = path.join(__dirname, '..');
let pass = 0, fail = 0;
const pageErrors = [];

function ok(cond, label, extra) {
  if (cond) { pass++; console.log('  PASS  ' + label); }
  else { fail++; console.log('  X     ' + label + (extra ? '  → ' + extra : '')); }
}

// 按 index.html 中的顺序手动注入脚本（这样可以用 http origin，localStorage 才可用）
function buildDom(seed) {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const srcs = [];
  html.replace(/<script src="([^"]+)"><\/script>/g, (_, s) => { srcs.push(s); return ''; });

  const vc = new VirtualConsole();
  vc.on('jsdomError', e => pageErrors.push('jsdomError: ' + e.message));
  vc.on('error', (...a) => pageErrors.push('console.error: ' + a.map(String).join(' ')));

  const dom = new JSDOM(html.replace(/<script src="[^"]+"><\/script>/g, ''), {
    runScripts: 'dangerously',
    pretendToBeVisual: true,
    url: 'http://localhost/',
    virtualConsole: vc
  });
  if (seed) dom.window.localStorage.setItem('elixir-academy-v1', JSON.stringify(seed));
  for (const s of srcs) {
    const code = fs.readFileSync(path.join(ROOT, s), 'utf8');
    try { dom.window.eval(code); }
    catch (e) { pageErrors.push('执行 ' + s + ' 出错：' + e.message); }
  }
  return dom;
}

const wait = ms => new Promise(r => setTimeout(r, ms));
const click = (win, elm) => elm.dispatchEvent(new win.MouseEvent('click', { bubbles: true }));

(async function () {
  // ================= 阶段一：全新用户 =================
  console.log('\n=== 全新用户首次打开 ===');
  let dom = buildDom(null);
  let win = dom.window, doc = win.document;
  const q = s => doc.querySelector(s);
  const qa = s => Array.from(doc.querySelectorAll(s));
  await wait(300);

  console.log('\n— 1. 启动与首页 —');
  ok(!!win.EL && !!win.EL.createInterp, '引擎已加载');
  ok(!!win.CURRICULUM, '课程数据已加载');
  ok(qa('#sidebar .stage').length === 6, '侧栏有 6 个阶段', '实际 ' + qa('#sidebar .stage').length);
  ok(!!q('.hero h1') && /炼金术学院/.test(q('.hero h1').textContent), '首页 hero 渲染');
  ok(qa('.stage-card').length === 6, '首页有 6 张阶段卡');
  ok(qa('.stage-card.locked').length === 5, '仅第 1 阶段解锁，其余 5 个锁定',
    '锁定 ' + qa('.stage-card.locked').length);

  console.log('\n— 2. 进入第 1 课 —');
  click(win, q('#sidebar .stage .stage-head'));
  await wait(120);
  ok(qa('#sidebar .lesson-item').length > 0, '展开后出现课程列表');
  click(win, q('#sidebar .lesson-item'));
  await wait(200);
  ok(!!q('h1.page-title'), '课程标题渲染：' + (q('h1.page-title') || {}).textContent);
  ok(qa('.ed').length > 0, '页面里有可运行的代码编辑器', '数量 ' + qa('.ed').length);
  ok(qa('.ex').length > 0, '页面里有练习卡', '数量 ' + qa('.ex').length);

  console.log('\n— 3. 运行代码块 —');
  const firstEd = q('.ed');
  click(win, firstEd.querySelector('.btn-run'));
  await wait(700);
  const out1 = firstEd.querySelector('.ed-out');
  ok(out1.classList.contains('show'), '输出区已展开');
  ok(/你好，电脑！/.test(out1.textContent), '输出包含新例子的字符串',
    JSON.stringify(out1.textContent.slice(0, 90)));

  console.log('\n— 4. 做练习并检查 —');
  const C = win.CURRICULUM;
  const ex1 = C.stages[0].lessons[0].exercises[0];
  const exBox = q('.ex');
  const exEd = exBox.querySelector('.ed');
  const ta = exEd.querySelector('.ed-ta');
  ta.value = ex1.solution;
  ta.dispatchEvent(new win.Event('input', { bubbles: true }));
  await wait(120);
  const checkBtn = Array.from(exEd.querySelectorAll('.btn')).find(b => /检查答案/.test(b.textContent));
  ok(!!checkBtn, '练习有「检查答案」按钮');
  click(win, checkBtn);
  await wait(1800);
  const sumEl = exEd.querySelector('.ed-out .check-sum');
  ok(!!sumEl, '检查结果已显示');
  ok(sumEl && sumEl.classList.contains('ok'), '全部检查项通过', sumEl ? sumEl.textContent : '(无)');
  ok(exBox.classList.contains('done'), '练习卡标记为已完成');

  console.log('\n— 5. 进度与持久化 —');
  const saved = JSON.parse(win.localStorage.getItem('elixir-academy-v1'));
  ok(saved && saved.done && saved.done[ex1.id] === true, 'localStorage 记录了完成的练习');
  ok(/^\d+%/.test(q('#pgNum').textContent), '顶栏进度已更新：' + q('#pgNum').textContent);

  // ================= 阶段二：第 1 阶段练习全做完 =================
  console.log('\n=== 第 1 阶段练习全做完 → 测验 ===');
  const seed = { done: {}, quiz: {}, code: {}, open: {}, seen: {} };
  C.stages[0].lessons.forEach(l => (l.exercises || []).forEach(e => { seed.done[e.id] = true; }));
  dom = buildDom(seed);
  win = dom.window; doc = win.document;
  await wait(300);

  click(win, doc.querySelector('#sidebar .stage .stage-head'));
  await wait(120);
  const quizItem = doc.querySelector('#sidebar .quiz-item');
  ok(!!quizItem && !quizItem.classList.contains('locked'), '测验入口已解锁');
  click(win, quizItem);
  await wait(250);
  ok(/阶段测验/.test(doc.querySelector('h1.page-title').textContent), '进入测验页');
  ok(doc.querySelectorAll('.quiz-card').length === C.stages[0].quiz.length, '测验题目数量正确',
    doc.querySelectorAll('.quiz-card').length + ' vs ' + C.stages[0].quiz.length);

  // 全部选正确答案
  doc.querySelectorAll('.quiz-card').forEach((card, i) => {
    const opts = card.querySelectorAll('.opt');
    click(win, opts[C.stages[0].quiz[i].answer]);
  });
  await wait(150);
  const submit = Array.from(doc.querySelectorAll('.pager .btn')).find(b => /交卷/.test(b.textContent));
  ok(!!submit, '找到交卷按钮');
  click(win, submit);
  await wait(400);
  const res = doc.querySelector('.quiz-result');
  ok(res && /通关/.test(res.textContent), '测验通过：' + (res ? res.textContent.slice(0, 40) : '(无)'));

  // ================= 阶段三：刷新后第 2 阶段应解锁 =================
  console.log('\n=== 通关后重新打开 → 第 2 阶段解锁 ===');
  const saved2 = JSON.parse(win.localStorage.getItem('elixir-academy-v1'));
  ok(saved2 && saved2.quiz && saved2.quiz.s1 && saved2.quiz.s1.passed, 'localStorage 记录了通关');
  dom = buildDom(saved2);
  win = dom.window; doc = win.document;
  await wait(300);
  ok(!!q('h1.page-title') && /第 1 课/.test(q('h1.page-title').textContent),
    '重新打开自动恢复到上次学习的课程：' + (q('h1.page-title') || {}).textContent);
  click(win, q('#btnHome'));
  await wait(200);
  const lockedNow = doc.querySelectorAll('.stage-card.locked').length;
  ok(lockedNow === 4, '第 2 阶段已解锁（剩余锁定 ' + lockedNow + ' 个）');
  ok(!doc.querySelectorAll('.stage-card')[1].classList.contains('locked'), '第 2 张卡片未锁定');

  // ================= 收尾 =================
  console.log('\n— 页面错误检查 —');
  ok(pageErrors.length === 0, '运行期间无 JS 错误', pageErrors.slice(0, 3).join(' | '));

  console.log('\n通过 ' + pass + ' / ' + (pass + fail));
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('测试脚本异常：', e); process.exit(1); });
