/* ============================================================
 * Elixir 炼金术学院 —— 主应用
 * 负责：导航 / 内容渲染 / 运行代码 / 练习判定 / 进度与解锁
 * ============================================================ */
(function () {
  'use strict';

  var EL = window.EL;
  var R = EL.R;
  EL.OTP.registerBuiltins();

  var C = window.CURRICULUM;
  var STAGES = C.stages;
  var STORE_KEY = 'elixir-academy-v1';

  // ------------------------- 状态 -------------------------
  var state = {
    done: {},     // exerciseId -> true
    quiz: {},     // stageId -> { best: n, total: n, passed: bool }
    code: {},     // exerciseId -> string
    open: {},     // stageId -> bool（侧栏展开）
    visit: null,  // { stage: id, lesson: id }
    seen: {},     // lessonId -> true
    ach: {},      // achievementId -> 解锁时间戳
    runs: 0,      // 累计运行次数
    refOpened: false // 是否翻过函数速查表
  };

  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) { /* 隐私模式忽略 */ }
  }
  function load() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (!raw) return;
      var s = JSON.parse(raw);
      ['done', 'quiz', 'code', 'open', 'seen', 'ach'].forEach(function (k) {
        if (s[k] && typeof s[k] === 'object') state[k] = s[k];
      });
      if (s.visit) state.visit = s.visit;
      if (typeof s.runs === 'number') state.runs = s.runs;
      if (s.refOpened) state.refOpened = true;
    } catch (e) { /* 忽略损坏数据 */ }
  }
  load();

  // ------------------------- 成就系统 -------------------------
  // 每条: { id, em, name, desc, test() -> bool }
  var ACHIEVEMENTS = [
    { id: 'first_run', em: '🔥', name: '初次点火',
      desc: '第一次成功运行代码', test: function () { return state.runs > 0; } },
    { id: 'first_ex', em: '✍️', name: '第一份手稿',
      desc: '通过第一个练习', test: function () { return doneExercises() >= 1; } },
    { id: 'ex_10', em: '⚗️', name: '小有所成',
      desc: '通过 10 个练习', test: function () { return doneExercises() >= 10; } },
    { id: 'ex_25', em: '🧩', name: '拼图大师',
      desc: '通过 25 个练习', test: function () { return doneExercises() >= 25; } },
    { id: 'ex_all', em: '📚', name: '题海渡尽',
      desc: '通过全部 ' + totalExercises() + ' 个练习', test: function () { return doneExercises() >= totalExercises(); } },
    { id: 'quiz_1', em: '🥇', name: '初尝胜果',
      desc: '通过第一个阶段测验', test: function () { return passedStages() >= 1; } },
    { id: 'quiz_3', em: '🎖️', name: '三瓶下肚',
      desc: '通过 3 个阶段测验', test: function () { return passedStages() >= 3; } },
    { id: 'quiz_perfect', em: '🎯', name: '一击必中',
      desc: '某次测验拿满分', test: function () {
        return Object.keys(state.quiz).some(function (k) {
          var q = state.quiz[k];
          return q && q.best >= q.total && q.total > 0;
        });
      } },
    { id: 'ref_reader', em: '📖', name: '好学之徒',
      desc: '翻开过函数速查表', test: function () { return !!state.refOpened; } },
    { id: 'graduate', em: '👑', name: '炼金宗师',
      desc: '六瓶魔药全部喝完，正式出师', test: function () {
        return passedStages() >= STAGES.length;
      } }
  ];

  // 检查并解锁成就；返回本次新解锁的列表
  function checkAchievements() {
    var fresh = [];
    ACHIEVEMENTS.forEach(function (a) {
      if (state.ach[a.id]) return;
      var hit = false;
      try { hit = !!a.test(); } catch (e) { hit = false; }
      if (hit) { state.ach[a.id] = Date.now(); fresh.push(a); }
    });
    if (fresh.length) {
      save();
      fresh.forEach(function (a, i) {
        setTimeout(function () { popAchievement(a); }, i * 900);
      });
      if (fresh.length > 1) celebrate();
    }
    return fresh;
  }

  // 成就解锁弹窗（右下角，3.6 秒后自动消失）
  function popAchievement(a) {
    var pop = el('div', 'ach-pop');
    pop.innerHTML =
      '<div class="pop-em">' + a.em + '</div>' +
      '<div><div class="pop-t">🏅 解锁成就</div>' +
      '<div class="pop-n">' + a.name + '</div>' +
      '<div class="pop-d">' + a.desc + '</div></div>';
    document.body.appendChild(pop);
    celebrate();
    setTimeout(function () {
      pop.style.transition = 'opacity .35s, transform .35s';
      pop.style.opacity = '0'; pop.style.transform = 'translateX(30px)';
      setTimeout(function () { pop.remove(); }, 380);
    }, 3600);
  }

  function achCount() { return Object.keys(state.ach).length; }

  // ------------------------- 工具 -------------------------
  function $(id) { return document.getElementById(id); }
  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }
  function byId(stageId) {
    for (var i = 0; i < STAGES.length; i++) if (STAGES[i].id === stageId) return STAGES[i];
    return null;
  }
  function stageIndex(stageId) {
    for (var i = 0; i < STAGES.length; i++) if (STAGES[i].id === stageId) return i;
    return -1;
  }
  function findLesson(stageId, lessonId) {
    var s = byId(stageId);
    if (!s) return null;
    for (var i = 0; i < s.lessons.length; i++) if (s.lessons[i].id === lessonId) return s.lessons[i];
    return null;
  }

  function totalExercises() {
    var n = 0;
    STAGES.forEach(function (s) { s.lessons.forEach(function (l) { n += (l.exercises || []).length; }); });
    return n;
  }
  function totalQuiz() { return STAGES.reduce(function (n, s) { return n + (s.quiz || []).length; }, 0); }
  function doneExercises() { return Object.keys(state.done).length; }
  function passedStages() { return STAGES.filter(function (s) { return (state.quiz[s.id] || {}).passed; }).length; }

  function overallPercent() {
    var total = totalExercises() + totalQuiz();
    var got = doneExercises() + passedStages();
    return total ? Math.round(got / total * 100) : 0;
  }

  function stageUnlocked(idx) {
    if (idx <= 0) return true;
    return !!(state.quiz[STAGES[idx - 1].id] || {}).passed;
  }
  function stageExTotal(s) {
    var n = 0;
    s.lessons.forEach(function (l) { n += (l.exercises || []).length; });
    return n;
  }
  function stageExDone(s) {
    var n = 0;
    s.lessons.forEach(function (l) {
      (l.exercises || []).forEach(function (e) { if (state.done[e.id]) n++; });
    });
    return n;
  }
  function lessonDone(l) {
    var exs = l.exercises || [];
    if (!exs.length) return !!state.seen[l.id];
    return exs.every(function (e) { return state.done[e.id]; });
  }
  function quizUnlocked(s) { return stageExDone(s) >= stageExTotal(s); }

  // ------------------------- 提示条 -------------------------
  var toastHost = el('div', 'toast-host');
  document.body.appendChild(toastHost);
  function toast(msg, kind, ms) {
    var t = el('div', 'toast ' + (kind || ''), msg);
    toastHost.appendChild(t);
    setTimeout(function () {
      t.style.transition = 'opacity .3s'; t.style.opacity = '0';
      setTimeout(function () { t.remove(); }, 320);
    }, ms || 2200);
  }

  function celebrate() {
    var emojis = ['✨', '🎉', '⭐', '🔮', '💫', '🧪'];
    for (var i = 0; i < 26; i++) {
      (function (i) {
        setTimeout(function () {
          var d = el('div', '', emojis[i % emojis.length]);
          d.style.cssText = 'position:fixed;z-index:9999;pointer-events:none;font-size:' +
            (16 + Math.random() * 16) + 'px;left:' + (Math.random() * 100) + 'vw;top:-30px;' +
            'transition:transform 2.2s cubic-bezier(.2,.7,.4,1),opacity 2.2s;';
          document.body.appendChild(d);
          requestAnimationFrame(function () {
            d.style.transform = 'translateY(' + (70 + Math.random() * 45) + 'vh) rotate(' + (Math.random() * 720 - 360) + 'deg)';
            d.style.opacity = '0';
          });
          setTimeout(function () { d.remove(); }, 2400);
        }, i * 45);
      })(i);
    }
  }

  // ------------------------- 错误信息友好化 -------------------------
  function friendly(err) {
    var name = err && err.name ? err.name : 'Error';
    var msg = err && err.message ? err.message : String(err);
    var tip = '';
    if (name === 'MatchError') {
      tip = '模式匹配失败了：等号左边的"形状"和右边的对不上。检查一下是元组还是列表、元素个数对不对？';
    } else if (name === 'FunctionClauseError') {
      tip = '没有任何一个函数子句能匹配你传进去的参数。常见原因：忘了写递归的"终点"（比如 sum([])）。';
    } else if (name === 'CaseClauseError') {
      tip = 'case 里没有任何分支匹配得上。加一个 <code>_ -&gt; ...</code> 兜底分支试试。';
    } else if (name === 'CondClauseError') {
      tip = 'cond 的所有条件都不为真。最后加一条 <code>true -&gt; ...</code> 作为兜底吧。';
    } else if (name === 'UndefinedFunctionError') {
      tip = '函数名拼错了？还是参数个数（arity）不对？Elixir 里 <code>foo/1</code> 和 <code>foo/2</code> 是两个不同的函数。';
    } else if (name === 'ArithmeticError') {
      tip = '数学运算出错了，八成是拿非数字当数字用了。';
    } else if (name === 'KeyError') {
      tip = '映射里没有这个键。用 <code>Map.get(m, :key, 默认值)</code> 可以更安全。';
    } else if (name === 'ElixirSyntaxError' || /语法错误/.test(msg)) {
      tip = '语法错误：多半是少了 <code>end</code>、括号没配对，或者 <code>do:</code> 写成了 <code>do</code>。';
    } else if (name === 'ArgumentError') {
      tip = '参数不对，看看传进去的值和函数期待的是不是一回事。';
    }
    return { name: name, msg: msg, tip: tip };
  }

  // ------------------------- 运行代码 -------------------------
  function runCode(src, timeout) {
    // 每次运行都计数（成就「初次点火」用），并在成功后检查成就
    state.runs++;
    save();
    var I = EL.createInterp({ deadline: Date.now() + (timeout || 6000) });
    return I.run(src).then(function (r) {
      if (r.ok) checkAchievements();
      return r;
    }, function (e) {
      return { ok: false, output: I.output, result: null, env: new EL.Env(null), error: e };
    });
  }

  function renderResult(ed, res, opts) {
    opts = opts || {};
    ed.clearOut().showOut();

    if (res.output) {
      var pre = el('div', 'out-block stdout');
      pre.textContent = res.output.replace(/\n$/, '');
      ed.out.appendChild(pre);
    } else if (res.ok) {
      ed.out.appendChild(el('div', 'out-block stdout out-empty', '（没有输出 —— 想看到东西记得用 IO.puts / IO.inspect）'));
    }

    if (!res.ok) {
      var f = friendly(res.error);
      var box = el('div', 'err-block' + (opts.expectError ? ' expected' : ''));
      box.appendChild(el('span', 'k', (opts.expectError ? '🎯 如期报错：' : '⚠ ') + f.name));
      box.appendChild(document.createTextNode(f.msg));
      if (opts.expectError) {
        box.appendChild(el('div', 'tip', '没错！这段就是想让你见见这个错误。下面几行代码因为报错已经停止执行了，这也是 Elixir 的行为：出错就停下。'));
      } else if (f.tip) {
        box.appendChild(el('div', 'tip', '💡 ' + f.tip));
      }
      ed.out.appendChild(box);
      return;
    }
    if (opts.expectError) {
      ed.out.appendChild(el('div', 'err-block expected',
        '<span class="k">🤔 咦，居然跑通了</span>这段代码本来应该报错的 —— 你是不是把它改对了？点「↺ 还原」看看原来的样子。'));
    }

    if (opts.showValue && res.result != null && res.result !== R.NIL) {
      var kind = R.inspect ? R.inspect(res.result) : '';
      if (kind && kind !== 'nil') {
        ed.out.appendChild(el('div', 'out-ret', '最后的值 ⇒ <b>' + escapeHtml(kind) + '</b>'));
      }
    }
  }

  function escapeHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // ------------------------- 练习判定 -------------------------
  async function checkExercise(lesson, ex, ed, onPass) {
    var src = ed.getValue();
    state.code[ex.id] = src;
    save();

    ed.setBusy(true, '运行中…');
    ed.clearOut().showOut();
    var loading = el('div', 'out-block stdout out-empty', '⏳ 正在炼制…');
    ed.out.appendChild(loading);

    var res = await runCode(src, 8000);
    ed.clearOut().showOut();
    ed.setBusy(false, '练习：' + ex.title.replace(/^练习[：:]\s*/, ''));

    if (res.output) {
      var pre = el('div', 'out-block stdout');
      pre.textContent = res.output.replace(/\n$/, '');
      ed.out.appendChild(pre);
    }

    if (!res.ok) {
      var f = friendly(res.error);
      var box = el('div', 'err-block');
      box.appendChild(el('span', 'k', '⚠ ' + f.name));
      box.appendChild(document.createTextNode(f.msg));
      if (f.tip) box.appendChild(el('div', 'tip', '💡 ' + f.tip));
      ed.out.appendChild(box);
      ed.out.appendChild(el('div', 'check-sum no', '先把错误修好，再点「检查」吧 💪'));
      return;
    }

    // 构造检查环境：共享模块表 + 顶层变量 + out
    var ci = EL.createInterp({ deadline: Date.now() + 5000 });
    ci.modules = res.env && res.env.modules ? res.env.modules : ci.modules;
    var cenv = new EL.Env(null);
    if (res.env && res.env.vars) {
      Object.keys(res.env.vars).forEach(function (k) { cenv.bind(k, res.env.vars[k]); });
    }
    cenv.bind('out', res.output || '');

    var list = el('div', 'check-list');
    ed.out.appendChild(list);

    var checks = ex.checks || [];
    var passed = 0;
    for (var i = 0; i < checks.length; i++) {
      var c = checks[i];
      var ok = false, note = '';
      try {
        var r2 = await ci.run(c.code, cenv);
        if (!r2.ok) { note = '（' + (r2.error && r2.error.message ? r2.error.message : '出错了') + '）'; }
        else { ok = R.isTruthy(r2.result); }
      } catch (e) { note = '（' + e.message + '）'; }
      if (ok) passed++;
      list.appendChild(el('div', 'check-row ' + (ok ? 'pass' : 'fail'),
        '<span class="check-ico">' + (ok ? '✓' : '✗') + '</span><span>' + c.label + ' ' + note + '</span>'));
    }

    var allOk = passed === checks.length;
    var firstTime = allOk && !state.done[ex.id];
    list.appendChild(el('div', 'check-sum ' + (allOk ? 'ok' : 'no'),
      allOk ? '✅ 全部通过（' + passed + '/' + checks.length + '）' : '还差一点点：' + passed + '/' + checks.length + ' 项通过'));

    if (allOk) {
      state.done[ex.id] = true;
      save();
      if (firstTime) { celebrate(); toast('练习通过！🎉', 'ok'); }
      else toast('再次通过 ✓', 'ok');
      if (onPass) onPass();
      checkAchievements();
      renderSidebar();
      renderTopbar();
    }
  }

  // ------------------------- 侧栏 -------------------------
  var view = { type: 'home' };

  function renderSidebar() {
    var sb = $('sidebar');
    sb.innerHTML = '';
    sb.appendChild(el('div', 'side-head', '学习路径'));

    STAGES.forEach(function (s, idx) {
      var unlocked = stageUnlocked(idx);
      var isOpen = !!state.open[s.id] || view.stage === s.id;
      var wrap = el('div', 'stage' + (unlocked ? '' : ' locked') + (view.stage === s.id ? ' active' : ''));

      var head = el('div', 'stage-head');
      head.appendChild(el('div', 'stage-emoji', s.icon || '🧪'));
      var meta = el('div', 'stage-meta');
      meta.appendChild(el('div', 'stage-name', s.title));
      var dn = stageExDone(s), tt = stageExTotal(s);
      var q = state.quiz[s.id];
      var sub = q && q.passed ? '✅ 已通关' : (unlocked ? dn + ' / ' + tt + ' 个练习' : '🔒 先通过上一阶段测验');
      meta.appendChild(el('div', 'stage-sub', sub));
      head.appendChild(meta);
      if (!unlocked) head.appendChild(el('div', 'stage-lock', '🔒'));
      else head.appendChild(el('div', 'stage-dot')).style.background = s.color || '#6C5CE7';
      head.addEventListener('click', function () {
        if (!unlocked) {
          toast('先通过「' + STAGES[idx - 1].title + '」的阶段测验才能解锁 🔒', 'err', 2800);
          return;
        }
        state.open[s.id] = !isOpen; save();
        if (!isOpen) goLesson(s.id, s.lessons[0].id);
        else renderSidebar();
      });
      wrap.appendChild(head);

      if (unlocked && isOpen) {
        var box = el('div', 'stage-lessons');
        s.lessons.forEach(function (l) {
          var it = el('div', 'lesson-item' + (view.type === 'lesson' && view.lesson === l.id ? ' active' : ''));
          it.appendChild(el('span', 'tick', lessonDone(l) ? '✔' : ''));
          it.appendChild(el('span', 'lt', l.title));
          it.appendChild(el('span', 'lm', l.minutes + '′'));
          it.addEventListener('click', function () { goLesson(s.id, l.id); });
          box.appendChild(it);
        });

        var qi = el('div', 'quiz-item' + (view.type === 'quiz' && view.stage === s.id ? ' active' : '') + (quizUnlocked(s) ? '' : ' locked'));
        var qp = state.quiz[s.id];
        qi.appendChild(el('span', '', '📝'));
        qi.appendChild(el('span', 'lt', '阶段测验'));
        if (qp && qp.passed) qi.appendChild(el('span', 'badge-mini', qp.best + '/' + qp.total));
        else if (!quizUnlocked(s)) qi.appendChild(el('span', 'lm', '需完成全部练习'));
        qi.addEventListener('click', function () {
          if (!quizUnlocked(s)) {
            toast('先把本阶段的 ' + stageExTotal(s) + ' 个练习都做完再来挑战 💪', 'err', 2800);
            return;
          }
          goQuiz(s.id);
        });
        box.appendChild(qi);
        wrap.appendChild(box);
      }
      sb.appendChild(wrap);
    });
  }

  function renderTopbar() {
    var pct = overallPercent();
    $('pgBar').style.width = pct + '%';
    $('pgNum').textContent = pct + '% · 练习 ' + doneExercises() + '/' + totalExercises() + ' · 通关 ' + passedStages() + '/' + STAGES.length;
  }

  // ------------------------- 页面：首页 -------------------------
  function renderHome() {
    view = { type: 'home' };
    var sheet = el('div', 'sheet');

    var hero = el('div', 'hero');
    hero.appendChild(el('div', 'big', '🧪'));
    hero.appendChild(el('h1', '', 'Elixir 炼金术学院'));
    hero.appendChild(el('p', '', '欢迎你，见习炼金术士。这里没有枯燥的文档 —— 每一课都在浏览器里<b>直接写代码、立刻看到结果</b>。'));
    hero.appendChild(el('p', '', '完成一阶段的全部练习，通过阶段测验，就能解锁下一瓶魔药。'));
    sheet.appendChild(hero);

    var statRow = el('div', 'stat-row');
    [['阶段', C.stats.stages], ['课程', C.stats.lessons], ['练习', C.stats.exercises], ['测验题', C.stats.quiz]]
      .forEach(function (p) {
        var s = el('div', 'stat');
        s.appendChild(el('b', '', String(p[1])));
        s.appendChild(el('span', '', p[0]));
        statRow.appendChild(s);
      });
    sheet.appendChild(statRow);

    sheet.appendChild(el('div', 'sec-title', '你的炼金路线'));
    var grid = el('div', 'stage-grid');
    STAGES.forEach(function (s, idx) {
      var unlocked = stageUnlocked(idx);
      var card = el('div', 'stage-card' + (unlocked ? '' : ' locked'));
      card.appendChild(el('div', 'top')).style.background = s.color || '#6C5CE7';
      card.appendChild(el('div', 'em', s.icon || '🧪'));
      card.appendChild(el('h3', '', s.title));
      card.appendChild(el('p', '', s.subtitle || ''));
      var q = state.quiz[s.id];
      var st = el('div', 'st ' + (q && q.passed ? 'ok' : 'no'),
        !unlocked ? '🔒 未解锁' : (q && q.passed ? '✅ 已通关 ' + q.best + '/' + q.total : '练习 ' + stageExDone(s) + '/' + stageExTotal(s)));
      card.appendChild(st);
      card.addEventListener('click', function () {
        if (!unlocked) { toast('先通过上一阶段的测验 🔒', 'err'); return; }
        goLesson(s.id, s.lessons[0].id);
      });
      grid.appendChild(card);
    });
    sheet.appendChild(grid);

    sheet.appendChild(el('div', 'sec-title', '怎么用这个平台'));
    var help = el('div', 'card');
    help.style.padding = '16px 20px';
    help.innerHTML =
      '<ol style="margin:0;padding-left:20px;color:var(--ink-2);font-size:14.5px">' +
      '<li><b>读</b>：每课都有讲解 + 类比，别急着跳过。</li>' +
      '<li><b>改</b>：所有代码块都能直接编辑，点「▶ 运行」看结果 —— 改坏了也不会炸。</li>' +
      '<li><b>做</b>：每课的练习有自动检查，点「✓ 检查答案」平台会告诉你哪一条没过。</li>' +
      '<li><b>闯关</b>：一阶段的练习全绿后，阶段测验解锁；测验过关，下一阶段自动开启。</li>' +
      '<li>快捷键：<code style="background:var(--accent-soft);padding:1px 6px;border-radius:5px">Ctrl + Enter</code> 直接运行；<code style="background:var(--accent-soft);padding:1px 6px;border-radius:5px">Tab</code> 缩进。</li>' +
      '</ol>';
    sheet.appendChild(help);

    // ---- 成就墙 ----
    sheet.appendChild(el('div', 'sec-title',
      '🏅 成就墙 &nbsp;<span style="font-size:13px;font-weight:500;color:var(--muted)">已解锁 ' +
      achCount() + ' / ' + ACHIEVEMENTS.length + '</span>'));
    var achGrid = el('div', 'ach-grid');
    ACHIEVEMENTS.forEach(function (a) {
      var got = !!state.ach[a.id];
      var card = el('div', 'ach ' + (got ? 'got' : 'locked'));
      card.innerHTML =
        (got ? '<div class="ach-got-tag">✓ 已获得</div>' : '') +
        '<div class="ach-em">' + a.em + '</div>' +
        '<div class="ach-name">' + a.name + '</div>' +
        '<div class="ach-desc">' + a.desc + '</div>';
      card.title = got ? ('解锁于 ' + new Date(state.ach[a.id]).toLocaleDateString('zh-CN')) : '尚未解锁';
      achGrid.appendChild(card);
    });
    sheet.appendChild(achGrid);

    setContent(sheet);
  }

  // ------------------------- 页面：课程 -------------------------
  function goLesson(stageId, lessonId) {
    var s = byId(stageId), l = findLesson(stageId, lessonId);
    if (!s || !l) return;
    view = { type: 'lesson', stage: stageId, lesson: lessonId };
    state.visit = { stage: stageId, lesson: lessonId };
    state.seen[lessonId] = true;
    state.open[stageId] = true;
    save();
    renderLesson(s, l);
    renderSidebar();
    $('content').scrollTop = 0;
    closeSidebarOnMobile();
  }

  function goQuiz(stageId) {
    var s = byId(stageId);
    if (!s) return;
    view = { type: 'quiz', stage: stageId };
    state.open[stageId] = true;
    save();
    renderQuiz(s);
    renderSidebar();
    $('content').scrollTop = 0;
    closeSidebarOnMobile();
  }

  function renderLesson(s, l) {
    var sheet = el('div', 'sheet');
    var si = stageIndex(s.id), li = s.lessons.indexOf(l);

    sheet.appendChild(el('div', 'crumb', '第 ' + (si + 1) + ' 阶段 · <b>' + s.title + '</b> · 第 ' + (li + 1) + ' / ' + s.lessons.length + ' 课'));
    sheet.appendChild(el('h1', 'page-title', l.title));
    sheet.appendChild(el('div', 'page-sub', '⏱ 约 ' + l.minutes + ' 分钟' + (lessonDone(l) ? ' &nbsp;·&nbsp; <span style="color:var(--ok);font-weight:600">✔ 已完成</span>' : '')));

    // ---- 理论块 ----
    (l.blocks || []).forEach(function (b) {
      if (b.t === 'p') {
        sheet.appendChild(el('div', 'blk blk-p', b.text));
      } else if (b.t === 'list') {
        var ul = el('ul', 'blk blk-list');
        b.items.forEach(function (it) { ul.appendChild(el('li', '', it)); });
        sheet.appendChild(ul);
      } else if (b.t === 'tip') {
        var t1 = el('div', 'blk blk-tip');
        t1.appendChild(el('span', 'blk-ico', '💡'));
        t1.appendChild(el('div', '', b.text));
        sheet.appendChild(t1);
      } else if (b.t === 'analogy') {
        var t2 = el('div', 'blk blk-analogy');
        t2.appendChild(el('span', 'blk-ico', '🔮'));
        t2.appendChild(el('div', '', b.text));
        sheet.appendChild(t2);
      } else if (b.t === 'code') {
        var ed = EL.createEditor({
          title: (b.xfail ? '⚠ ' : '') + (b.title || '试试看'),
          code: b.code,
          minLines: Math.min((b.code || '').split('\n').length + 1, 14),
          onSubmit: function () { runBtn.click(); }
        });
        var runBtn = ed.addButton('▶ 运行', 'btn-run', function (api, btn) {
          btn.textContent = '⏳';
          runCode(api.getValue()).then(function (res) {
            btn.textContent = '▶ 运行';
            renderResult(api, res, { showValue: true, expectError: b.xfail });
          });
        });
        ed.addButton('↺ 还原', 'btn-ghost', function (api) { api.setValue(b.code); api.hideOut(); });
        sheet.appendChild(ed.el);
        if (b.xfail) {
          sheet.appendChild(el('div', 'blk blk-tip',
            '<span class="blk-ico">🎯</span><div>这段代码<b>会报错，而且是故意的</b> —— 点「运行」看看它报什么，这是本节要教你的坑。</div>'));
        }
      }
    });

    // ---- 练习 ----
    var exs = l.exercises || [];
    if (exs.length) {
      sheet.appendChild(el('div', 'sec-title', '🔨 动手练习'));
      exs.forEach(function (ex) {
        sheet.appendChild(buildExercise(s, l, ex));
      });
    }

    // ---- 试验场 ----
    sheet.appendChild(el('div', 'sec-title', '🎡 自由试验场'));
    var sandboxNote = el('div', 'blk blk-p', '随便写点什么，反正不会炸。想复习刚学的东西就在这儿练手。');
    sheet.appendChild(sandboxNote);
    var sand = EL.createEditor({
      title: '沙盒（不会被检查）',
      code: state.code['sandbox:' + l.id] || '# 在这儿随便写\nIO.puts("开工！")\n',
      minLines: 5,
      onChange: function (v) { state.code['sandbox:' + l.id] = v; save(); },
      onSubmit: function () { sbRun.click(); }
    });
    var sbRun = sand.addButton('▶ 运行', 'btn-run', function (api, btn) {
      btn.textContent = '⏳';
      runCode(api.getValue()).then(function (res) {
        btn.textContent = '▶ 运行';
        renderResult(api, res, { showValue: true });
      });
    });
    sheet.appendChild(sand.el);

    // ---- 翻页 ----
    sheet.appendChild(buildPager(s, l));

    setContent(sheet);
  }

  function buildExercise(s, l, ex) {
    var box = el('div', 'ex' + (state.done[ex.id] ? ' done' : ''));
    var head = el('div', 'ex-head');
    head.appendChild(el('span', 'ex-tag', state.done[ex.id] ? '✔ 已通过' : '练习'));
    head.appendChild(el('span', 'ex-name', ex.title));
    box.appendChild(head);

    var body = el('div', 'ex-body');
    body.appendChild(el('div', 'ex-prompt', ex.prompt || ''));

    var ed = EL.createEditor({
      title: '写代码的地方',
      code: state.code[ex.id] != null ? state.code[ex.id] : (ex.starter || ''),
      minLines: Math.max((ex.starter || '').split('\n').length + 1, 6),
      onSubmit: function () { checkBtn.click(); }
    });
    var checkBtn = ed.addButton('✓ 检查答案', 'btn-check', function (api) {
      checkExercise(l, ex, api, function () {
        box.classList.add('done');
        head.querySelector('.ex-tag').textContent = '✔ 已通过';
        head.querySelector('.ex-tag').style.background = 'var(--ok-soft)';
        renderPagerState();
      });
    });
    var runBtn = ed.addButton('▶ 运行', 'btn-run', function (api, btn) {
      btn.textContent = '⏳';
      runCode(api.getValue()).then(function (res) {
        btn.textContent = '▶ 运行';
        renderResult(api, res, { showValue: true });
      });
    });
    ed.addButton('↺ 重来', 'btn-ghost', function (api) {
      api.setValue(ex.starter || ''); api.hideOut();
      state.code[ex.id] = ex.starter || ''; save();
    });
    body.appendChild(ed.el);

    if (ex.hints && ex.hints.length) {
      var det = el('details', 'hints');
      det.appendChild(el('summary', '', '💡 卡住了？看提示（' + ex.hints.length + ' 条）'));
      var ol = el('ol');
      ex.hints.forEach(function (h) { ol.appendChild(el('li', '', h)); });
      det.appendChild(ol);
      body.appendChild(det);
    }

    var showAns = el('details', 'hints');
    showAns.appendChild(el('summary', '', '👀 实在不会？看参考答案'));
    var ansEd = EL.createEditor({ title: '参考答案', code: ex.solution || '', minLines: Math.min((ex.solution || '').split('\n').length + 1, 14) });
    ansEd.addButton('▶ 运行', 'btn-run', function (api, btn) {
      btn.textContent = '⏳';
      runCode(api.getValue()).then(function (res) {
        btn.textContent = '▶ 运行';
        renderResult(api, res, { showValue: true });
      });
    });
    showAns.appendChild(ansEd.el);
    body.appendChild(showAns);

    box.appendChild(body);
    return box;
  }

  // ---- 翻页按钮 ----
  var pagerRefs = { root: null, s: null, l: null };
  function buildPager(s, l) {
    var si = stageIndex(s.id), li = s.lessons.indexOf(l);
    var pager = el('div', 'pager');
    pagerRefs.root = pager; pagerRefs.s = s; pagerRefs.l = l;

    var prev = el('button', 'btn btn-ghost', '← 上一课');
    prev.addEventListener('click', function () {
      if (li > 0) goLesson(s.id, s.lessons[li - 1].id);
      else if (si > 0) { var ps = STAGES[si - 1]; goLesson(ps.id, ps.lessons[ps.lessons.length - 1].id); }
    });
    pager.appendChild(prev);
    pager.appendChild(el('div', 'spacer'));

    var mid = el('button', 'btn', '');
    pager.appendChild(mid);
    pagerRefs.mid = mid;

    var next = el('button', 'btn btn-run', '下一课 →');
    next.addEventListener('click', function () {
      if (li < s.lessons.length - 1) goLesson(s.id, s.lessons[li + 1].id);
      else if (quizUnlocked(s)) goQuiz(s.id);
      else toast('本阶段还有练习没做完，做完才能去测验哦 💪', 'err', 3000);
    });
    pager.appendChild(next);

    renderPagerState();
    return pager;
  }
  function renderPagerState() {
    if (!pagerRefs.root || !pagerRefs.mid) return;
    var s = pagerRefs.s, l = pagerRefs.l;
    var li = s.lessons.indexOf(l);
    var mid = pagerRefs.mid;
    if (li === s.lessons.length - 1) {
      var q = state.quiz[s.id];
      mid.textContent = (q && q.passed) ? '📝 再看一次测验' : '📝 去做阶段测验';
      mid.onclick = function () {
        if (quizUnlocked(s)) goQuiz(s.id);
        else toast('本阶段还有练习没做完，做完才能去测验哦 💪', 'err', 3000);
      };
    } else {
      mid.textContent = '本课练习：' + (l.exercises || []).filter(function (e) { return state.done[e.id]; }).length + ' / ' + (l.exercises || []).length;
      mid.onclick = null;
    }
  }

  // ------------------------- 页面：测验 -------------------------
  function renderQuiz(s) {
    var sheet = el('div', 'sheet');
    sheet.appendChild(el('div', 'crumb', '第 ' + (stageIndex(s.id) + 1) + ' 阶段 · <b>' + s.title + '</b>'));
    sheet.appendChild(el('h1', 'page-title', '📝 阶段测验'));
    sheet.appendChild(el('div', 'page-sub', '全部做完点最下面的「交卷」。答对 ' + Math.ceil((s.quiz || []).length * 0.8) + ' 题以上就能解锁下一阶段。'));

    var qs = s.quiz || [];
    var picked = new Array(qs.length).fill(-1);
    var submitted = false;

    qs.forEach(function (q, i) {
      var card = el('div', 'card quiz-card');
      card.appendChild(el('div', 'quiz-q', (i + 1) + '. ' + q.q));
      var opts = [];
      q.options.forEach(function (o, j) {
        var op = el('div', 'opt');
        op.appendChild(el('div', 'opt-key', 'ABCD'[j] || String(j + 1)));
        op.appendChild(el('div', '', o));
        op.addEventListener('click', function () {
          if (submitted) return;
          picked[i] = j;
          opts.forEach(function (x) { x.classList.remove('sel'); });
          op.classList.add('sel');
        });
        opts.push(op);
        card.appendChild(op);
      });
      var exp = el('div', 'quiz-explain', '<b>解析：</b>' + q.explain);
      card.appendChild(exp);
      card._explain = exp;
      card._opts = opts;
      sheet.appendChild(card);
    });

    var result = el('div', 'card quiz-result');
    result.style.display = 'none';
    sheet.appendChild(result);

    var bar = el('div', 'pager');
    bar.appendChild(el('div', 'spacer'));
    var submit = el('button', 'btn btn-check', '交卷 ✓');
    submit.style.height = '40px';
    submit.style.padding = '0 24px';
    submit.addEventListener('click', function () {
      var miss = picked.indexOf(-1);
      if (miss >= 0) { toast('第 ' + (miss + 1) + ' 题还没选哦', 'err'); return; }
      submitted = true;
      var right = 0;
      var cards = sheet.querySelectorAll('.quiz-card');
      qs.forEach(function (q, i) {
        var card = cards[i];
        card._opts.forEach(function (op, j) {
          op.classList.remove('sel');
          if (j === q.answer) op.classList.add('right');
          else if (j === picked[i]) op.classList.add('wrong');
        });
        if (picked[i] === q.answer) right++;
        card._explain.classList.add('show');
      });

      var total = qs.length;
      var need = Math.ceil(total * 0.8);
      var pass = right >= need;
      var prev = state.quiz[s.id];
      state.quiz[s.id] = {
        best: Math.max(right, prev ? prev.best : 0),
        total: total,
        passed: pass || (prev && prev.passed) || false
      };
      save();
      checkAchievements();

      result.style.display = '';
      result.innerHTML =
        '<div class="score" style="color:' + (pass ? 'var(--ok)' : 'var(--err)') + '">' + right + ' / ' + total + '</div>' +
        '<div class="verdict">' + (pass ? '🎉 通关！下一瓶魔药已经解锁。' : '差一点：需要答对 ' + need + ' 题。复习一下再来吧！') + '</div>';
      if (!pass) {
        var again = el('button', 'btn btn-run', '🔁 再考一次');
        again.addEventListener('click', function () { renderQuiz(s); });
        result.appendChild(again);
      } else {
        celebrate();
        var nxt = STAGES[stageIndex(s.id) + 1];
        if (nxt) {
          var nb = el('button', 'btn btn-run', '➡ 进入「' + nxt.title + '」');
          nb.addEventListener('click', function () { goLesson(nxt.id, nxt.lessons[0].id); });
          result.appendChild(nb);
        } else {
          result.appendChild(el('div', '', '🏆 你已经学完了全部六个阶段 —— 恭喜出师！'));
        }
      }
      submit.textContent = '已交卷';
      submit.disabled = true;
      renderSidebar();
      renderTopbar();
      if (result.scrollIntoView) result.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    bar.appendChild(submit);
    sheet.appendChild(bar);

    setContent(sheet);
  }

  // ------------------------- 渲染入口 -------------------------
  function setContent(node) {
    var c = $('content');
    c.innerHTML = '';
    c.appendChild(node);
  }

  function closeSidebarOnMobile() {
    if (window.innerWidth <= 1000) $('sidebar').classList.remove('open');
  }

  // ------------------------- 启动 -------------------------
  function boot() {
    renderTopbar();
    renderSidebar();

    // 记录"翻过函数速查表"（成就「好学之徒」）
    if (EL.openBuiltinRef) {
      var origRef = EL.openBuiltinRef;
      EL.openBuiltinRef = function () {
        if (!state.refOpened) { state.refOpened = true; save(); checkAchievements(); }
        return origRef.apply(this, arguments);
      };
    }

    $('btnHome').addEventListener('click', function () { renderHome(); renderSidebar(); closeSidebarOnMobile(); });
    $('btnMenu').addEventListener('click', function () { $('sidebar').classList.toggle('open'); });
    $('btnReset').addEventListener('click', function () {
      if (!confirm('确定要清空所有学习进度吗？（含已解锁的成就）此操作不可撤销。')) return;
      state = {
        done: {}, quiz: {}, code: {}, open: {}, visit: null, seen: {},
        ach: {}, runs: 0, refOpened: false
      };
      save();
      renderHome(); renderSidebar(); renderTopbar();
      toast('进度已重置');
    });

    // 恢复上次位置
    var v = state.visit;
    if (v && byId(v.stage) && findLesson(v.stage, v.lesson)) {
      view = { type: 'lesson', stage: v.stage, lesson: v.lesson };
      renderLesson(byId(v.stage), findLesson(v.stage, v.lesson));
      renderSidebar();
    } else {
      renderHome();
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

})();
