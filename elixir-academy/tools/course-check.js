/*
 * 课程校验：用浏览器端同一套引擎，逐条跑
 *   1) 每课 blocks 里的示例代码 —— 不允许报错
 *   2) 每个练习的 solution    —— 不允许报错，且所有 checks 必须通过
 *   3) 每个练习的 starter      —— 运行不应崩溃（可以报错，但不能是引擎内部 JS 错误）
 * 用法：node tools/course-check.js
 */
const path = require('path');
const base = path.join(__dirname, '..', 'assets', 'js', 'engine');
require(path.join(base, 'lexer.js'));
require(path.join(base, 'parser.js'));
require(path.join(base, 'runtime.js'));
require(path.join(base, 'builtins.js'));
require(path.join(base, 'otp.js'));
require(path.join(base, 'interp.js'));
global.EL.OTP.registerBuiltins();

require(path.join(__dirname, '..', 'data', 'stages-a.js'));
require(path.join(__dirname, '..', 'data', 'stages-b.js'));
require(path.join(__dirname, '..', 'data', 'curriculum.js'));

const EL = global.EL;
const R = EL.R;
const C = global.CURRICULUM;

const JS_BUG = /is not a function|Cannot read|undefined is not|is not defined|Maximum call stack|Invalid regular/;

let pass = 0, fail = 0;
let cur = '';
const problems = [];
process.on('unhandledRejection', e => {
  console.log('>>> 逃逸异常 @' + cur + ' : ' + (e && e.name) + ' ' + (e && e.message || ''));
});

function note(kind, where, msg) {
  fail++;
  problems.push(`[${kind}] ${where}\n      ${msg}`);
}

function run(src) {
  const I = EL.createInterp({ deadline: Date.now() + 8000 });
  return I.run(src).then(
    r => ({ ok: r.ok, output: r.output, env: r.env, error: r.error, interp: I }),
    e => ({ ok: false, output: I.output, env: new EL.Env(null), error: e, interp: I })
  );
}

async function evalCheck(res, code) {
  const ci = EL.createInterp({ deadline: Date.now() + 5000 });
  ci.modules = res.interp.modules;
  const cenv = new EL.Env(null);
  if (res.env && res.env.vars) {
    Object.keys(res.env.vars).forEach(k => cenv.bind(k, res.env.vars[k]));
  }
  cenv.bind('out', res.output || '');
  const r2 = await ci.run(code, cenv);
  return { ok: r2.ok && R.isTruthy(r2.result), err: r2.error };
}

(async function () {
  console.log('课程：' + C.title + '  ' +
    C.stats.stages + ' 阶段 / ' + C.stats.lessons + ' 课 / ' +
    C.stats.exercises + ' 练习 / ' + C.stats.quiz + ' 测验题\n');

  for (const stage of C.stages) {
    for (const lesson of stage.lessons) {
      const where0 = `${stage.id}/${lesson.id} ${lesson.title}`;

      // ---- 1. 示例代码 ----
      for (let i = 0; i < (lesson.blocks || []).length; i++) {
        const b = lesson.blocks[i];
        if (b.t !== 'code' || !b.code) continue;
        cur = where0 + " block#" + i; const res = await run(b.code);
        if (b.xfail) {
          // 这段代码"故意报错"来教学（例如演示 MatchError）
          if (!res.ok) {
            const got = (res.error && res.error.name) || '';
            if (typeof b.xfail === 'string' && b.xfail !== got) {
              note('预期错误类型不符', `${where0} · block#${i}`, `期望 ${b.xfail}，实际 ${got}`);
            } else pass++;
          } else {
            note('标记为会报错却跑通了', `${where0} · block#${i}`, b.title || '');
          }
          continue;
        }
        if (!res.ok) {
          const msg = res.error && res.error.message || String(res.error);
          if (JS_BUG.test(msg)) note('引擎BUG', `${where0} · block#${i} ${b.title || ''}`, msg);
          else note('示例报错', `${where0} · block#${i} ${b.title || ''}`, msg);
        } else pass++;
      }

      // ---- 2. 练习 ----
      for (const ex of (lesson.exercises || [])) {
        const where = `${stage.id}/${lesson.id}/${ex.id} ${ex.title}`;

        // starter 不应触发引擎内部错误
        if (ex.starter) {
          cur = where + " (starter)"; const rs = await run(ex.starter);
          const msg = rs.error && rs.error.message || '';
          if (msg && JS_BUG.test(msg)) note('starter 触发引擎BUG', where, msg);
        }

        // solution 必须跑通
        cur = where; const res = await run(ex.solution || '');
        if (!res.ok) {
          const msg = res.error && res.error.message || String(res.error);
          note('参考答案跑不通', where, (res.error && res.error.name ? res.error.name + ': ' : '') + msg);
          continue;
        }

        // checks 必须全部通过
        const checks = ex.checks || [];
        let bad = 0;
        for (const c of checks) {
          let r;
          try { r = await evalCheck(res, c.code); }
          catch (e) { r = { ok: false, err: e }; }
          if (!r.ok) {
            bad++;
            note('检查项不通过', where,
              `「${c.label}」  code: ${c.code}` + (r.err ? `  → ${r.err.name || ''}: ${r.err.message || r.err}` : ''));
          } else pass++;
        }
        if (bad === 0) pass++;
      }
    }
  }

  console.log('通过 ' + pass + ' 项，问题 ' + fail + ' 项');
  if (problems.length) {
    console.log('\n———— 问题清单 ————');
    problems.forEach(p => console.log('  ' + p));
    process.exit(1);
  } else {
    console.log('\n✅ 全部课程代码与练习检查项均通过');
  }
})();
