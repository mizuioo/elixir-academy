/*
 * 代码编辑器组件：textarea + 高亮浮层，支持 Elixir 语法着色
 */
(function (global) {
  'use strict';

  var EL = global.EL || (global.EL = {});

  // ---------------- 语法高亮 ----------------
  var KEYWORDS = ('defmodule def defp defstruct defmacro defprotocol defimpl do end fn if else unless cond case ' +
    'receive after rescue catch try raise throw reraise use import alias require with for in when and or not ' +
    'true false nil __MODULE__ __DIR__ __ENV__').split(' ');
  var KWSET = Object.create(null);
  KEYWORDS.forEach(function (k) { KWSET[k] = true; });

  var RULES = [
    ['comment', /^#[^\n]*/],
    ['string', /^(?:"""[\s\S]*?"""|"(?:\\.|[^"\\\n])*")/],
    ['charlist', /^'(?:\\.|[^'\\\n])*'/],
    ['sigil', /^~(?:[a-zA-Z])(?:\([^)]*\)|\[[^\]]*\]|\{[^}]*\}|<[^>]*>|\/[^/]*\/|\|[^|]*\|)/],
    ['atom', /^:(?:"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|[a-zA-Z_][a-zA-Z0-9_]*[?!]?)/],
    ['kwarg', /^[a-zA-Z_][a-zA-Z0-9_]*[?!]?:(?!:)/],
    ['number', /^(?:0[xX][0-9a-fA-F_]+|0[bB][01_]+|0[oO][0-7_]+|\d[\d_]*(?:\.[\d_]+)?(?:[eE][+-]?\d+)?)/],
    ['word', /^[a-zA-Z_][a-zA-Z0-9_]*[?!]?/],
    ['space', /^\s+/],
    ['op', /^(?:->|=>|<-|::|\+\+|--|<>|\|\||&&|===|!==|==|!=|<=|>=|=~|\|>|[-+*/=<>!|&^~.])/],
    ['punct', /^[(){}\[\],;%]/],
    ['other', /^[\s\S]/]
  ];

  function esc(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function highlight(src) {
    var out = '', i = 0, n = src.length;
    while (i < n) {
      var rest = src.slice(i), matched = false;
      for (var r = 0; r < RULES.length; r++) {
        var m = RULES[r][1].exec(rest);
        if (m) {
          var kind = RULES[r][0], text = m[0];
          if (kind === 'word') {
            if (KWSET[text]) kind = 'keyword';
            else if (/^[A-Z]/.test(text)) kind = 'module';
            else if (/^_/.test(text)) kind = 'punct';
            else kind = 'fn';
          } else if (kind === 'string') {
            // 处理 #{...} 插值
            text = text.replace(/#\{([^}\n]*)\}/g, function (_, e) {
              return '\u0000i\u0000' + e + '\u0000e\u0000';
            });
            text = esc(text)
              .replace(/\u0000i\u0000/g, '<span class="tok-interp">#{</span>')
              .replace(/\u0000e\u0000/g, '<span class="tok-interp">}</span>');
            // 插值内容单独着色
            text = text.replace(/(<span class="tok-interp">#\{<\/span>)([\s\S]*?)(<span class="tok-interp">}<\/span>)/g,
              function (_, a, b, c) { return a + '<span class="tok-embed">' + b + '</span>' + c; });
            out += '<span class="tok-string">' + text + '</span>';
            i += m[0].length; matched = true; break;
          } else {
            out += '<span class="tok-' + kind + '">' + esc(text) + '</span>';
            i += text.length; matched = true; break;
          }
          i += text.length;
          matched = true;
          break;
        }
      }
      if (!matched) { out += esc(src[i]); i++; }
    }
    return out;
  }

  EL.highlight = highlight;

  // 高亮静态代码块（不可编辑）
  EL.highlightBlock = function (el) {
    el.innerHTML = highlight(el.textContent);
  };

  // ---------------- 编辑器 ----------------
  /*
   * opts: { title, code, actions:[{label, style, onClick(ed)}], minLines, noAssist }
   * 返回: { el, getValue, setValue, focus, setBusy, out, showOut, clearOut }
   */
  EL.createEditor = function (opts) {
    opts = opts || {};
    var el = document.createElement('div');
    el.className = 'ed';
    if (opts.noAssist) el.classList.add('ed-noassist');

    var bar = document.createElement('div');
    bar.className = 'ed-bar';
    var title = document.createElement('span');
    title.className = 'ed-title';
    title.textContent = opts.title || '代码';
    bar.appendChild(title);
    var actions = document.createElement('div');
    actions.className = 'ed-actions';
    bar.appendChild(actions);
    el.appendChild(bar);

    var body = document.createElement('div');
    body.className = 'ed-body';
    var lines = document.createElement('div');
    lines.className = 'ed-lines';
    var wrap = document.createElement('div');
    wrap.className = 'ed-wrap';
    var pre = document.createElement('pre');
    pre.className = 'ed-hl';
    var codeEl = document.createElement('code');
    pre.appendChild(codeEl);
    var ta = document.createElement('textarea');
    ta.className = 'ed-ta';
    ta.spellcheck = false;
    ta.autocapitalize = 'off';
    ta.autocomplete = 'off';
    ta.setAttribute('autocorrect', 'off');
    wrap.appendChild(pre);
    wrap.appendChild(ta);
    body.appendChild(lines);
    body.appendChild(wrap);
    el.appendChild(body);

    var out = document.createElement('div');
    out.className = 'ed-out';
    el.appendChild(out);

    // ---- 自动补全弹层 ----
    var ac = document.createElement('div');
    ac.className = 'ed-ac';
    ac.style.display = 'none';
    wrap.appendChild(ac);
    var acItems = [], acIndex = 0, acPrefix = '', acStart = 0;

    // ---- 行为 ----
    function renderLines() {
      var n = ta.value.split('\n').length;
      var s = '';
      for (var i = 1; i <= n; i++) s += i + '\n';
      lines.textContent = s;
    }
    function sync() {
      var v = ta.value;
      codeEl.innerHTML = highlight(v) + '\n';
      renderLines();
      autoGrow();
      if (opts.onChange) opts.onChange(v);
      if (!opts.noAssist) updateAc();
    }
    function autoGrow() {
      var lh = 21, pad = 24;
      var h = Math.min(Math.max(ta.value.split('\n').length, opts.minLines || 3) * lh + pad, 460);
      wrap.style.height = h + 'px';
      pre.style.minHeight = h + 'px';
    }

    // ---- 自动补全核心 ----
    function detectContext() {
      // 光标前找最近的一个连续 ident（含 ? !） 或 atom
      var pos = ta.selectionStart;
      var src = ta.value.slice(0, pos);
      // 找最近一个 . 之前的单词
      var m = src.match(/([A-Z][A-Za-z0-9_]*)\.([a-zA-Z_][a-zA-Z0-9_]*[?!]?)?$/);
      if (!m) return null;
      var modName = m[1], partial = m[2] || '';
      var mod = EL.BUILTIN_CATALOG && EL.BUILTIN_CATALOG[modName];
      if (!mod) return null;
      return { modName: modName, mod: mod, partial: partial, partialStart: pos - partial.length };
    }
    function updateAc() {
      var ctx = detectContext();
      if (!ctx) { hideAc(); return; }
      var p = ctx.partial.toLowerCase();
      acItems = ctx.mod.fns.filter(function (f) {
        return !p || f.name.toLowerCase().indexOf(p) === 0;
      }).slice(0, 8);
      if (!acItems.length) { hideAc(); return; }
      acPrefix = ctx.partial;
      acStart = ctx.partialStart;
      acIndex = 0;
      renderAc();
      positionAc();
    }
    function renderAc() {
      ac.innerHTML = '';
      acItems.forEach(function (f, i) {
        var row = document.createElement('div');
        row.className = 'ed-ac-row' + (i === acIndex ? ' sel' : '');
        row.innerHTML =
          '<span class="ed-ac-name">' + f.name + '</span>' +
          '<span class="ed-ac-arity">' + f.arity + '</span>' +
          '<span class="ed-ac-desc">' + f.desc + '</span>';
        row.addEventListener('mousedown', function (e) { e.preventDefault(); acceptAc(i); });
        ac.appendChild(row);
      });
    }
    function positionAc() {
      // 把弹层放在光标所在行下方（粗略定位）
      var pos = ta.selectionStart;
      var before = ta.value.slice(0, pos);
      var lines2 = before.split('\n');
      var lineN = lines2.length - 1;
      var col = lines2[lines2.length - 1].length;
      var lh = 21, pad = 12;
      ac.style.left = Math.min(col * 7.6 + 14, wrap.clientWidth - 360) + 'px';
      ac.style.top = ((lineN - ta.scrollTop / lh) * lh + pad + 6) + 'px';
      ac.style.display = '';
    }
    function showAc() { ac.style.display = ''; }
    function hideAc() { ac.style.display = 'none'; acItems = []; }
    function acceptAc(i) {
      if (!acItems.length) return;
      i = i == null ? acIndex : i;
      var f = acItems[i];
      var pos = ta.selectionStart;
      var insert = f.name.slice(acPrefix.length);
      ta.value = ta.value.slice(0, pos) + insert + ta.value.slice(pos);
      ta.selectionStart = ta.selectionEnd = pos + insert.length;
      sync(); hideAc(); ta.focus();
    }
    function moveAc(d) {
      if (!acItems.length) return;
      acIndex = (acIndex + d + acItems.length) % acItems.length;
      renderAc();
    }

    ta.addEventListener('input', sync);
    ta.addEventListener('scroll', function () {
      pre.scrollTop = ta.scrollTop; pre.scrollLeft = ta.scrollLeft;
      lines.scrollTop = ta.scrollTop;
      if (ac.style.display !== 'none') positionAc();
    });
    ta.addEventListener('keydown', function (e) {
      if (ac.style.display !== 'none') {
        if (e.key === 'ArrowDown') { e.preventDefault(); moveAc(1); return; }
        if (e.key === 'ArrowUp')   { e.preventDefault(); moveAc(-1); return; }
        if (e.key === 'Tab' || e.key === 'Enter') {
          // Tab 优先补全（即使在裸输入状态）；Enter 只在补全打开时补全，否则交回默认（提交）
          if (e.key === 'Tab' || acItems.length) {
            e.preventDefault();
            acceptAc();
            return;
          }
        }
        if (e.key === 'Escape') { e.preventDefault(); hideAc(); return; }
      }
      if (e.key === 'Tab') {
        e.preventDefault();
        var s = ta.selectionStart, en = ta.selectionEnd, v = ta.value;
        if (s === en) {
          ta.value = v.slice(0, s) + '  ' + v.slice(en);
          ta.selectionStart = ta.selectionEnd = s + 2;
        } else {
          var first = v.lastIndexOf('\n', s - 1) + 1;
          var block = v.slice(first, en);
          var shifted = (e.shiftKey ? block.replace(/^ {1,2}/gm, '') : block.replace(/^/gm, '  '));
          ta.value = v.slice(0, first) + shifted + v.slice(en);
          ta.selectionStart = first; ta.selectionEnd = first + shifted.length;
        }
        sync();
      } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        if (opts.onSubmit) opts.onSubmit();
      }
    });
    ta.addEventListener('blur', function () { setTimeout(hideAc, 120); });
    ta.addEventListener('focus', function () { if (!opts.noAssist) updateAc(); });

    var api = {
      el: el,
      out: out,
      getValue: function () { return ta.value; },
      setValue: function (v) { ta.value = v; sync(); return api; },
      focus: function () { ta.focus(); return api; },
      setTitle: function (t) { title.textContent = t; return api; },
      addButton: function (label, className, handler) {
        var b = document.createElement('button');
        b.className = 'btn ' + (className || '');
        b.textContent = label;
        b.addEventListener('click', function () { handler(api, b); });
        actions.appendChild(b);
        return b;
      },
      setBusy: function (busy, label) {
        Array.prototype.forEach.call(actions.children, function (b) { b.disabled = busy; });
        if (label) title.textContent = label;
        return api;
      },
      showOut: function () { out.classList.add('show'); return api; },
      hideOut: function () { out.classList.remove('show'); return api; },
      clearOut: function () { out.innerHTML = ''; return api; }
    };

    // 「📖 函数速查」：给零基础学员一个随时可翻的内置函数手册
    if (opts.ref !== false) {
      api.addButton('📖', 'btn-ghost', function () { EL.openBuiltinRef(); })
        .title = '打开 Elixir 内置函数速查表';
    }

    api.setValue(opts.code || '');
    return api;
  };

  // ---------------- 函数速查面板 ----------------
  EL.openBuiltinRef = function () {
    var cat = EL.BUILTIN_CATALOG;
    var overlay = document.createElement('div');
    overlay.className = 'ref-overlay';
    overlay.innerHTML =
      '<div class="ref-modal">' +
      '<div class="ref-head"><span>📖 Elixir 函数速查</span>' +
      '<button class="icon-btn" id="refClose">关闭 ✕</button></div>' +
      '<div class="ref-search"><input id="refQ" placeholder="搜函数：puts / map / length…"/></div>' +
      '<div class="ref-body" id="refBody"></div>' +
      '</div>';
    document.body.appendChild(overlay);

    function render(filter) {
      filter = (filter || '').toLowerCase().trim();
      var body = overlay.querySelector('#refBody');
      body.innerHTML = '';
      Object.keys(cat).forEach(function (modName) {
        var mod = cat[modName];
        var fns = mod.fns.filter(function (f) {
          if (!filter) return true;
          return f.name.toLowerCase().indexOf(filter) >= 0 || f.desc.indexOf(filter) >= 0;
        });
        if (!fns.length) return;
        var section = document.createElement('div');
        section.className = 'ref-mod';
        section.innerHTML = '<div class="ref-mod-h">' + modName + ' <span>' + mod.desc + '</span></div>';
        var list = document.createElement('div');
        list.className = 'ref-list';
        fns.forEach(function (f) {
          var row = document.createElement('div');
          row.className = 'ref-fn';
          row.innerHTML = '<span class="ref-fn-name">' + f.name + '</span>' +
            '<span class="ref-fn-arity">/' + f.arity + '</span>' +
            '<span class="ref-fn-desc">' + f.desc + '</span>';
          list.appendChild(row);
        });
        section.appendChild(list);
        body.appendChild(section);
      });
      if (!body.children.length) body.appendChild(document.createTextNode('没找到相关函数'));
    }

    overlay.querySelector('#refClose').addEventListener('click', function () { overlay.remove(); });
    overlay.addEventListener('click', function (e) { if (e.target === overlay) overlay.remove(); });
    overlay.querySelector('#refQ').addEventListener('input', function (e) { render(e.target.value); });
    render();
    setTimeout(function () { overlay.querySelector('#refQ').focus(); }, 50);
  };

})(typeof window !== 'undefined' ? window : globalThis);
