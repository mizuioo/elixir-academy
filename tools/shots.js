/*
 * 用本机 Chrome 截图，人工检查视觉效果
 * 用法：node tools/shots.js
 */
const path = require('path');
const fs = require('fs');
const puppeteer = require(
  path.join('C:/Users/Administrator/.workbuddy-ai/binaries/node/workspace/node_modules/puppeteer-core')
);

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'tools', 'shots');
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

(async function () {
  if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: ['--allow-file-access-from-files', '--no-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 950, deviceScaleFactor: 1 });

  const errs = [];
  page.on('pageerror', e => errs.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });

  const url = 'file:///' + path.join(ROOT, 'index.html').replace(/\\/g, '/');
  await page.goto(url, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 600));

  // 1. 首页
  await page.screenshot({ path: path.join(OUT, '1-home.png') });

  // 2. 第 1 课
  await page.click('#sidebar .stage .stage-head');
  await new Promise(r => setTimeout(r, 250));
  await page.click('#sidebar .lesson-item');
  await new Promise(r => setTimeout(r, 400));
  await page.screenshot({ path: path.join(OUT, '2-lesson.png'), fullPage: false });

  // 3. 运行一段代码
  const runBtns = await page.$$('.ed .btn-run');
  if (runBtns.length) {
    await runBtns[0].click();
    await new Promise(r => setTimeout(r, 900));
  }
  await page.screenshot({ path: path.join(OUT, '3-run.png') });

  // 4. 练习：填答案并检查
  await page.evaluate(() => {
    const ex = document.querySelector('.ex');
    const ed = ex.querySelector('.ed');
    const ta = ed.querySelector('.ed-ta');
    const sol = window.CURRICULUM.stages[0].lessons[0].exercises[0].solution;
    ta.value = sol;
    ta.dispatchEvent(new Event('input', { bubbles: true }));
    ex.scrollIntoView({ block: 'center' });
  });
  await new Promise(r => setTimeout(r, 300));
  await page.screenshot({ path: path.join(OUT, '4-exercise.png') });

  await page.evaluate(() => {
    const ex = document.querySelector('.ex');
    const btn = Array.from(ex.querySelectorAll('.ed .btn')).find(b => /检查答案/.test(b.textContent));
    btn.click();
  });
  await new Promise(r => setTimeout(r, 1600));
  await page.screenshot({ path: path.join(OUT, '5-checked.png') });

  // 5. 测验页（直接把第 1 阶段练习全标完成再刷新）
  await page.evaluate(() => {
    const st = JSON.parse(localStorage.getItem('elixir-academy-v1'));
    window.CURRICULUM.stages[0].lessons.forEach(l => (l.exercises || []).forEach(e => { st.done[e.id] = true; }));
    localStorage.setItem('elixir-academy-v1', JSON.stringify(st));
  });
  await page.reload({ waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 500));
  await page.click('#sidebar .stage .stage-head');
  await new Promise(r => setTimeout(r, 250));
  await page.click('#sidebar .quiz-item');
  await new Promise(r => setTimeout(r, 400));
  await page.screenshot({ path: path.join(OUT, '6-quiz.png') });

  // 6. 错误提示长什么样（故意写错代码）
  await page.click('#sidebar .lesson-item');
  await new Promise(r => setTimeout(r, 350));
  await page.evaluate(() => {
    const ed = document.querySelector('.ex .ed');
    const ta = ed.querySelector('.ed-ta');
    ta.value = '[a, b] = [1, 2, 3]\nIO.puts(a)';
    ta.dispatchEvent(new Event('input', { bubbles: true }));
    ed.scrollIntoView({ block: 'center' });
    Array.from(ed.querySelectorAll('.btn')).find(b => /运行/.test(b.textContent)).click();
  });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(OUT, '7-error.png') });

  await browser.close();
  console.log('截图已输出到 tools/shots/');
  if (errs.length) { console.log('页面错误：'); errs.forEach(e => console.log('  ' + e)); }
  else console.log('无 JS 错误 ✅');
})();
