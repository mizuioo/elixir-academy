/*
 * Elixir 词法分析器（浏览器端教学引擎）
 * 把源码切成 token 流，供 parser 使用。
 */
(function (global) {
  'use strict';

  var EL = global.EL || (global.EL = {});

  // 运算符：长的在前，保证优先匹配
  var OPERATORS = [
    '<<<', '>>>', '~>>', '<<~', '<~>', '<~', '<|>', '~>',
    '===', '!==', '==', '!=', '<=', '>=', '&&', '||',
    '++', '--', '<>', '->', '<-', '=>', '|>', '::', '\\\\', '..',
    '|', '&', '^', '%', '=', '<', '>', '+', '-', '*', '/', '@', '.', '~', ':'
  ];

  var KEYWORDS = [
    'defmodule', 'defprotocol', 'defimpl', 'defstruct', 'defexception',
    'def', 'defp', 'defmacro', 'defmacrop', 'defdelegate',
    'do', 'end', 'fn', 'case', 'cond', 'if', 'unless', 'else',
    'rescue', 'catch', 'after', 'receive', 'when', 'and', 'or', 'not', 'in',
    'import', 'alias', 'require', 'use', 'try', 'raise', 'reraise', 'throw',
    'for', 'into', 'with', 'quote', 'unquote', 'super', 'true', 'false', 'nil'
  ];
  var KEYWORD_SET = {};
  for (var ki = 0; ki < KEYWORDS.length; ki++) KEYWORD_SET[KEYWORDS[ki]] = true;

  var PUNCT_OPEN = { '(': ')', '[': ']', '{': '}' };
  var PUNCT_CLOSE = { ')': 1, ']': 1, '}': 1 };

  // 行首出现这些运算符时，视为上一行的延续（不会插入 EOL）
  var CONTINUATION_OPS = {
    '+': 1, '-': 1, '*': 1, '/': 1, '<>': 1, '++': 1, '--': 1, '|>': 1,
    '==': 1, '!=': 1, '===': 1, '!==': 1, '<': 1, '>': 1, '<=': 1, '>=': 1,
    '&&': 1, '||': 1, 'and': 1, 'or': 1, 'in': 1, 'when': 1, '=': 1, '|': 1,
    '->': 1, '<-': 1, '=>': 1, '::': 1, '..': 1
  };

  // 行尾是这些 token 时不插入 EOL（表达式尚未结束）
  var NO_EOL_AFTER = {
    ',': 1, ';': 1, '->': 1, '<-': 1, '=>': 1, '|': 1, '=': 1, '::': 1,
    '(': 1, '[': 1, '{': 1, '\\': 1
  };

  function isDigit(c) { return c >= '0' && c <= '9'; }
  function isIdentStart(c) { return (c >= 'a' && c <= 'z') || c === '_'; }
  function isIdentChar(c) {
    return (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') ||
      (c >= '0' && c <= '9') || c === '_';
  }
  function isUpper(c) { return c >= 'A' && c <= 'Z'; }

  function ElixirSyntaxError(msg, line) {
    var e = new Error(msg);
    e.name = 'ElixirSyntaxError';
    e.elixirLine = line;
    return e;
  }

  /**
   * 扫描字符串字面量，支持 #{} 插值。
   * 返回 { parts, endIndex, quote } —— parts 为 [{s: 文本}] 或 [{expr: 源码字符串}]
   */
  function scanString(src, i, quote, line) {
    var parts = [];
    var buf = '';
    var n = src.length;
    i++; // 跳过开始的引号
    while (i < n) {
      var c = src[i];
      if (c === '\\') {
        var nx = src[i + 1];
        if (nx === 'n') { buf += '\n'; i += 2; continue; }
        if (nx === 't') { buf += '\t'; i += 2; continue; }
        if (nx === 'r') { buf += '\r'; i += 2; continue; }
        if (nx === '\\') { buf += '\\'; i += 2; continue; }
        if (nx === '"') { buf += '"'; i += 2; continue; }
        if (nx === "'") { buf += "'"; i += 2; continue; }
        if (nx === '#') { buf += '#'; i += 2; continue; }
        if (nx === 'e') { buf += '\x1b'; i += 2; continue; }
        if (nx === undefined) break;
        buf += nx; i += 2; continue;
      }
      if (c === '#' && src[i + 1] === '{') {
        if (buf.length) { parts.push({ s: buf }); buf = ''; }
        i += 2;
        var depth = 1;
        var start = i;
        // 插值内部也可能有字符串，做简单的括号平衡（忽略字符串内的括号）
        while (i < n && depth > 0) {
          var ch = src[i];
          if (ch === '{') depth++;
          else if (ch === '}') { depth--; if (depth === 0) break; }
          i++;
        }
        if (depth !== 0) throw ElixirSyntaxError('字符串插值缺少右括号 }', line);
        parts.push({ expr: src.slice(start, i) });
        i++; // 跳过 }
        continue;
      }
      if (c === quote) {
        i++;
        if (buf.length || parts.length === 0) parts.push({ s: buf });
        return { parts: parts, endIndex: i };
      }
      buf += c;
      i++;
    }
    throw ElixirSyntaxError('字符串没有闭合的 ' + quote, line);
  }

  function tokenize(src) {
    var tokens = [];
    var i = 0;
    var line = 1;
    var col = 1;
    var n = src.length;

    function push(type, value, ln, cl, extra) {
      var t = { type: type, value: value, line: ln, col: cl };
      if (extra) for (var k in extra) t[k] = extra[k];
      tokens.push(t);
      return t;
    }

    while (i < n) {
      var c = src[i];

      // 换行
      if (c === '\n') { line++; col = 1; i++; continue; }
      if (c === '\r' || c === ' ' || c === '\t') { i++; col++; continue; }

      // 注释
      if (c === '#') {
        while (i < n && src[i] !== '\n') i++;
        continue;
      }

      var startLine = line, startCol = col;

      // 数字
      if (isDigit(c)) {
        var j = i;
        var isFloat = false;
        if (c === '0' && (src[i + 1] === 'x' || src[i + 1] === 'X')) {
          j = i + 2;
          while (j < n && /[0-9a-fA-F_]/.test(src[j])) j++;
          var hex = src.slice(i + 2, j).replace(/_/g, '');
          push('int', parseInt(hex, 16), startLine, startCol);
          col += j - i; i = j; continue;
        }
        if (c === '0' && (src[i + 1] === 'b' || src[i + 1] === 'B')) {
          j = i + 2;
          while (j < n && /[01_]/.test(src[j])) j++;
          push('int', parseInt(src.slice(i + 2, j).replace(/_/g, ''), 2), startLine, startCol);
          col += j - i; i = j; continue;
        }
        if (c === '0' && (src[i + 1] === 'o' || src[i + 1] === 'O')) {
          j = i + 2;
          while (j < n && /[0-7_]/.test(src[j])) j++;
          push('int', parseInt(src.slice(i + 2, j).replace(/_/g, ''), 8), startLine, startCol);
          col += j - i; i = j; continue;
        }
        j = i;
        while (j < n && /[0-9_]/.test(src[j])) j++;
        if (src[j] === '.' && isDigit(src[j + 1])) {
          isFloat = true;
          j++;
          while (j < n && /[0-9_]/.test(src[j])) j++;
        }
        if (src[j] === 'e' || src[j] === 'E') {
          var k2 = j + 1;
          if (src[k2] === '+' || src[k2] === '-') k2++;
          if (isDigit(src[k2])) {
            isFloat = true;
            j = k2;
            while (j < n && isDigit(src[j])) j++;
          }
        }
        var raw = src.slice(i, j).replace(/_/g, '');
        push(isFloat ? 'float' : 'int', isFloat ? parseFloat(raw) : parseInt(raw, 10), startLine, startCol);
        col += j - i; i = j; continue;
      }

      // 原子 :foo / :"foo bar" / :'foo'
      if (c === ':') {
        var nx2 = src[i + 1];
        if (isIdentStart(nx2) || ((nx2 === '!' || nx2 === '?' || nx2 === '<' || nx2 === '>' ||
          nx2 === '=' || nx2 === '+' || nx2 === '-' || nx2 === '*' || nx2 === '/' ||
          nx2 === '|' || nx2 === '&' || nx2 === '^' || nx2 === '~' || nx2 === '%'))) {
          var j2 = i + 1;
          while (j2 < n && isIdentChar(src[j2])) j2++;
          if (src[j2] === '!' || src[j2] === '?') j2++;
          push('atom', src.slice(i + 1, j2), startLine, startCol);
          col += j2 - i; i = j2; continue;
        }
        if (nx2 === '"' || nx2 === "'") {
          var sr = scanString(src, i + 1, nx2, line);
          if (sr.parts.length && sr.parts[0].s !== undefined) {
            push('atom', sr.parts[0].s, startLine, startCol);
          } else {
            push('atom', '', startLine, startCol);
          }
          col += sr.endIndex - i - 1; i = sr.endIndex; continue;
        }
      }

      // sigil ~w(...) ~s"..." 等
      if (c === '~' && (isIdentChar(src[i + 1]) || /[()\[\]{}<>"'\/|]/.test(src[i + 1]))) {
        var letter = isIdentChar(src[i + 1]) ? src[i + 1] : '';
        var di = i + 1 + letter.length;
        var delim = src[di];
        var closeMap = { '(': ')', '[': ']', '{': '}', '<': '>' };
        var close = closeMap[delim] || delim;
        var dj = di + 1;
        var content = '';
        while (dj < n && src[dj] !== close) {
          if (src[dj] === '\\') { content += src[dj + 1]; dj += 2; continue; }
          content += src[dj]; dj++;
        }
        dj++;
        var mods = '';
        while (dj < n && isIdentChar(src[dj])) { mods += src[dj]; dj++; }
        push('sigil', content, startLine, startCol, { letter: letter.toLowerCase(), mods: mods });
        col += dj - i; i = dj; continue;
      }

      // 字符串 / charlist
      if (c === '"' || c === "'") {
        var sr2 = scanString(src, i, c, line);
        push(c === '"' ? 'string' : 'charlist', sr2, startLine, startCol);
        col += sr2.endIndex - i; i = sr2.endIndex; continue;
      }

      // 模块名 / 别名 Foo.Bar
      if (isUpper(c)) {
        var j3 = i;
        while (j3 < n && isIdentChar(src[j3])) j3++;
        while (src[j3] === '.' && isUpper(src[j3 + 1])) {
          j3++;
          while (j3 < n && isIdentChar(src[j3])) j3++;
        }
        push('alias', src.slice(i, j3), startLine, startCol);
        col += j3 - i; i = j3; continue;
      }

      // 标识符 / 关键字
      if (isIdentStart(c)) {
        var j4 = i;
        while (j4 < n && isIdentChar(src[j4])) j4++;
        if (src[j4] === '!' || src[j4] === '?') j4++;
        var word = src.slice(i, j4);
        // foo: 形式的 keyword（后面紧跟 : 但不是 ::）；关键字不参与（do: 是块语法）
        if (!KEYWORD_SET[word] && src[j4] === ':' && src[j4 + 1] !== ':') {
          push('ident', word, startLine, startCol);
          push('op', ':', startLine, startCol + (j4 - i));
          col += j4 - i + 1; i = j4 + 1; continue;
        }
        push(KEYWORD_SET[word] ? 'kw' : 'ident', word, startLine, startCol);
        col += j4 - i; i = j4; continue;
      }

      // 运算符
      var matched = null;
      for (var oi = 0; oi < OPERATORS.length; oi++) {
        var op = OPERATORS[oi];
        if (src.substr(i, op.length) === op) { matched = op; break; }
      }
      if (matched) {
        push('op', matched === '\\\\' ? '\\\\' : matched, startLine, startCol);
        col += matched.length; i += matched.length; continue;
      }

      // 标点
      if (c === ',' || c === ';' || PUNCT_OPEN[c] || PUNCT_CLOSE[c]) {
        push('punct', c, startLine, startCol);
        i++; col++; continue;
      }

      throw ElixirSyntaxError('无法识别的字符 "' + c + '"', line);
    }

    push('eof', null, line, col);

    // 插入 EOL（换行即语句结束，除非明确是延续行）
    var out = [];
    for (var t = 0; t < tokens.length - 1; t++) {
      out.push(tokens[t]);
      var cur = tokens[t], nxt = tokens[t + 1];
      if (nxt.line > cur.line) {
        var curVal = (cur.type === 'op' || cur.type === 'punct') ? cur.value
          : (cur.type === 'kw' ? cur.value : null);
        var nxtVal = (nxt.type === 'op' || nxt.type === 'punct') ? nxt.value
          : (nxt.type === 'kw' ? nxt.value : null);
        var needEol = true;
        if (curVal && NO_EOL_AFTER[curVal]) needEol = false;
        if (nxtVal && CONTINUATION_OPS[nxtVal]) needEol = false;
        if (nxtVal && ('.),]}'.indexOf(nxtVal) >= 0)) needEol = false;
        if (nxt.type === 'kw' && (nxt.value === 'end' || nxt.value === 'else' ||
          nxt.value === 'rescue' || nxt.value === 'after' || nxt.value === 'catch' ||
          nxt.value === 'do' || nxt.value === 'when' || nxt.value === '\\')) needEol = false;
        if (curVal && CONTINUATION_OPS[curVal] && curVal !== '-') needEol = false;
        if (needEol) out.push({ type: 'eol', value: ';', line: cur.line, col: cur.col });
      }
    }
    out.push(tokens[tokens.length - 1]);

    return out;
  }

  EL.tokenize = tokenize;
  EL.KEYWORD_SET = KEYWORD_SET;
  EL.ElixirSyntaxError = ElixirSyntaxError;

})(typeof window !== 'undefined' ? window : globalThis);
