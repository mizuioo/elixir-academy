/*
 * Elixir 语法分析器（Pratt / 递归下降混合）
 * 输出 AST，节点带 line 便于报错定位。
 */
(function (global) {
  'use strict';

  var EL = global.EL || (global.EL = {});

  var PREC = {
    '=': 10, 'when': 16,
    '||': 20, 'or': 20,
    '&&': 30, 'and': 30,
    '==': 40, '!=': 40, '===': 40, '!==': 40, '<': 40, '>': 40, '<=': 40, '>=': 40,
    '|>': 50,
    'in': 60,
    '++': 70, '--': 70, '<>': 70, '..': 70,
    '+': 80, '-': 80,
    '*': 90, '/': 90
  };
  var RIGHT_ASSOC = { '=': 1, '<>': 1, '++': 1, '--': 1, '..': 1, 'when': 1, '\\\\': 1 };

  var BLOCK_ENDERS = ['end', 'else', 'rescue', 'after', 'catch'];

  function Parser(tokens) { this.toks = tokens; this.i = 0; }

  Parser.prototype.peek = function (k) { return this.toks[this.i + (k || 0)]; };
  Parser.prototype.next = function () { return this.toks[this.i++]; };
  Parser.prototype.at = function (type, value) {
    var t = this.peek();
    return !!t && t.type === type && (value === undefined || t.value === value);
  };
  Parser.prototype.atKw = function (v) { return this.at('kw', v); };
  Parser.prototype.atOp = function (v) { return this.at('op', v); };
  Parser.prototype.atPunct = function (v) { return this.at('punct', v); };
  Parser.prototype.eat = function (type, value) { return this.at(type, value) ? this.next() : null; };
  Parser.prototype.expect = function (type, value) {
    if (this.at(type, value)) return this.next();
    var t = this.peek();
    var got = t ? (t.type === 'eof' ? '文件结尾' : JSON.stringify(t.value)) : '文件结尾';
    throw EL.ElixirSyntaxError(
      '语法错误：期望 ' + (value === undefined ? type : JSON.stringify(value)) + '，实际读到 ' + got,
      t ? t.line : 0);
  };
  Parser.prototype.skipEols = function () {
    while (this.at('eol') || this.atPunct(';')) this.next();
  };

  function parse(src) {
    var p = new Parser(EL.tokenize(src));
    return { type: 'block', exprs: p.parseBody(['eof']), line: 1 };
  }

  Parser.prototype.parseBody = function (stops) {
    var exprs = [];
    while (true) {
      this.skipEols();
      var t = this.peek();
      if (!t || t.type === 'eof') break;
      if (stops.indexOf(t.type) >= 0) break;
      if (t.type === 'kw' && (stops.indexOf('kw:' + t.value) >= 0 || BLOCK_ENDERS.indexOf(t.value) >= 0)) break;
      if (t.type === 'punct' && (t.value === ')' || t.value === ']' || t.value === '}')) break;
      var e = this.parseExpr();
      exprs.push(e);
      if (this.at('eol') || this.atPunct(';')) { this.next(); continue; }
      if (this.at('eof')) break;
      var t2 = this.peek();
      if (t2.type === 'kw' && BLOCK_ENDERS.indexOf(t2.value) >= 0) break;
      if (t2.type === 'punct' && (t2.value === ')' || t2.value === ']' || t2.value === '}')) break;
      if (t2.type === 'op' && t2.value === '->') break;
      if (!this.at('eol')) this.next(); // 容错
    }
    return exprs;
  };

  Parser.prototype.parseExpr = function (minPrec) {
    minPrec = minPrec === undefined ? 0 : minPrec;
    var left = this.parseUnary();
    while (true) {
      var t = this.peek();
      if (!t) break;
      var op = null;
      if (t.type === 'op') op = t.value;
      else if (t.type === 'kw' && (t.value === 'and' || t.value === 'or' || t.value === 'in' || t.value === 'when')) op = t.value;
      if (!op) break;
      var prec = PREC[op];
      if (prec === undefined || prec <= minPrec) break;
      this.next();
      if (op === '=') {
        var r1 = this.parseExpr(prec - 1);
        left = { type: 'match', left: left, right: r1, line: t.line };
        continue;
      }
      if (op === 'in') {
        left = { type: 'binop', op: 'in', left: left, right: this.parseExpr(prec), line: t.line };
        continue;
      }
      if (op === 'when') {
        left = { type: 'guard_when', left: left, right: this.parseExpr(prec - 1), line: t.line };
        continue;
      }
      if (op === '|>') {
        left = { type: 'pipe', left: left, right: this.parsePipeTarget(), line: t.line };
        continue;
      }
      var r2 = this.parseExpr(RIGHT_ASSOC[op] ? prec - 1 : prec);
      left = { type: 'binop', op: op, left: left, right: r2, line: t.line };
    }
    return left;
  };

  Parser.prototype.parsePipeTarget = function () {
    var t = this.peek();
    if (t.type === 'alias') {
      var al = this.next();
      if (this.atOp('.')) {
        this.next();
        var nm = this.next();
        var args = this.atPunct('(') ? this.parseArgs() : [];
        return this.postfix({ type: 'call', kind: 'remote', module: { type: 'alias', name: al.value, line: t.line }, name: nm.value, args: args, line: t.line });
      }
      return this.postfix({ type: 'alias', name: al.value, line: t.line });
    }
    if (t.type === 'ident') {
      var id = this.next();
      if (this.atPunct('(')) {
        return this.postfix({ type: 'call', kind: 'local', name: id.value, args: this.parseArgs(), line: t.line });
      }
      // 注意顺序：`opts[:name]` 是取值，不是无括号调用 opts([:name])
      if (this.atPunct('[')) {
        return this.postfix({ type: 'var', name: id.value, line: t.line });
      }
      if (this.canStartOperand(this.peek())) {
        return this.postfix({ type: 'call', kind: 'local', name: id.value, args: this.parseNoParenArgs(), line: t.line });
      }
      return this.postfix({ type: 'var', name: id.value, line: t.line });
    }
    if (t.type === 'kw' && t.value === 'fn') return this.parseFn();
    return this.parseUnary();
  };

  Parser.prototype.canStartOperand = function (t) {
    if (!t) return false;
    if (t.type === 'eol' || t.type === 'eof') return false;
    if (t.type === 'int' || t.type === 'float' || t.type === 'string' ||
      t.type === 'charlist' || t.type === 'atom' || t.type === 'ident' ||
      t.type === 'alias' || t.type === 'sigil') return true;
    if (t.type === 'punct' && (t.value === '(' || t.value === '[' || t.value === '{')) return true;
    if (t.type === 'op' && (t.value === '&' || t.value === '%')) return true;
    // 注意：这里不能包含 'do'，否则 `case x do` 会被误判成无括号调用 x(do ...)
    if (t.type === 'kw' && (t.value === 'fn' || t.value === 'case' ||
      t.value === 'cond' || t.value === 'if' || t.value === 'unless' || t.value === 'for' ||
      t.value === 'true' || t.value === 'false' || t.value === 'nil')) return true;
    return false;
  };

  // ---------- 一元 / 关键字结构 ----------
  Parser.prototype.parseUnary = function () {
    var t = this.peek();

    // 关键字对 foo: value
    if (t.type === 'ident' && this.peek(1) && this.peek(1).type === 'op' && this.peek(1).value === ':') {
      this.next(); this.next();
      return { type: 'kwpair', key: { type: 'atom', name: t.value, line: t.line }, value: this.parseExpr(15), line: t.line };
    }
    if (t.type === 'ident' && this.peek(1) && this.peek(1).type === 'op' && this.peek(1).value === '::') {
      this.next(); this.next(); this.parseExpr(25);
      return { type: 'var', name: t.value, line: t.line };
    }

    if (t.type === 'op') {
      if (t.value === '!' || t.value === '^' || t.value === '&' || t.value === '-' ||
        t.value === '+' || t.value === '@') {
        this.next();
        if (t.value === '&') return this.parseCapture();
        if (t.value === '@') return this.parseAttr();
        return { type: 'unop', op: t.value, expr: this.parseUnary(), line: t.line };
      }
    }

    if (t.type === 'kw') {
      switch (t.value) {
        case 'not': this.next(); return { type: 'unop', op: 'not', expr: this.parseUnary(), line: t.line };
        case 'fn': return this.parseFn();
        case 'case': return this.parseCase();
        case 'cond': return this.parseCond();
        case 'if': case 'unless': return this.parseIf();
        case 'receive': return this.parseReceive();
        case 'for': return this.parseFor();
        case 'with': return this.parseWith();
        case 'try': return this.parseTry();
        case 'raise': case 'reraise': case 'throw': return this.parseRaiseLike();
        case 'defmodule': return this.parseDefmodule();
        case 'defprotocol': case 'defimpl': return this.parseDefmoduleLike();
        case 'def': case 'defp': case 'defmacro': case 'defmacrop': return this.parseDef();
        case 'defstruct': return this.parseDefstruct();
        case 'import': case 'alias': case 'require': case 'use': return this.parseDirective();
      }
    }
    return this.parsePrimary();
  };

  Parser.prototype.parseAttr = function () {
    var t = this.peek();
    var an = this.next();
    if (!an || (an.type !== 'ident' && an.type !== 'kw')) {
      throw EL.ElixirSyntaxError('@ 后面需要模块属性名', t.line);
    }
    var nxt = this.peek();
    if (nxt && nxt.line === an.line && this.canStartOperand(nxt) && !this.atKw('do')) {
      var v = this.parseExpr();
      return { type: 'attr_set', name: an.value, value: v, line: t.line };
    }
    return { type: 'attr_read', name: an.value, line: t.line };
  };

  Parser.prototype.parseCapture = function () {
    var t = this.peek();
    // &1 / &2 参数占位符
    if (t.type === 'int') {
      this.next();
      return { type: 'capture_arg', index: t.value, line: t.line };
    }
    if (t.type === 'alias' || t.type === 'ident') {
      var save = this.i;
      var first = this.next();
      if (this.atOp('.') && this.peek(1) && this.peek(1).type === 'ident' &&
        this.peek(2) && this.peek(2).type === 'op' && this.peek(2).value === '/') {
        this.next();
        var nm = this.next();
        this.next();
        var ar = this.next();
        return { type: 'capture_remote', module: first.value, name: nm.value, arity: ar.value, line: t.line };
      }
      if (t.type === 'ident' && this.atOp('/')) {
        this.next();
        return { type: 'capture_local', name: first.value, arity: this.next().value, line: t.line };
      }
      this.i = save;
    }
    if (this.atPunct('(')) {
      this.next();
      var e = this.parseExpr();
      this.expect('punct', ')');
      return { type: 'capture', expr: e, line: t.line };
    }
    return { type: 'capture', expr: this.parseUnary(), line: t.line };
  };

  // 后缀：`.name` / `.name(...)` / `.(...)` / `[key]`（Access 取值）
  Parser.prototype.postfix = function (expr) {
    var self = this;
    var line = expr && expr.line;
    while (true) {
      if (self.atOp('.')) {
        var nxt = self.peek(1);
        if (nxt && (nxt.type === 'ident' || nxt.type === 'kw' || nxt.type === 'alias')) {
          self.next();
          var nmTok = self.next();
          if (self.atPunct('(')) {
            expr = { type: 'call', kind: 'remote', module: expr, name: nmTok.value, args: self.parseArgs(), line: line };
          } else if (self.canStartOperand(self.peek()) && !self.atOp('.')) {
            expr = { type: 'call', kind: 'remote', module: expr, name: nmTok.value, args: self.parseNoParenArgs(), line: line };
          } else {
            expr = { type: 'dot', target: expr, name: nmTok.value, line: line };
          }
          continue;
        }
        if (nxt && nxt.type === 'punct' && nxt.value === '(') {
          self.next(); // 只吃掉 '.'，'(' 交给 parseArgs
          expr = { type: 'call', kind: 'anon', target: expr, args: self.parseArgs(), line: line };
          continue;
        }
        break;
      }
      if (self.atPunct('[')) {
        self.next();
        var idx = self.parseExpr();
        self.expect('punct', ']');
        expr = { type: 'access', target: expr, key: idx, line: line };
        continue;
      }
      break;
    }
    return expr;
  };

  Parser.prototype.parsePrimary = function () {
    var t = this.peek();
    var self = this;

    function tail(expr) { return self.postfix(expr); }

    if (t.type === 'int' || t.type === 'float') {
      this.next();
      return tail({ type: 'num', value: t.value, float: t.type === 'float', line: t.line });
    }
    if (t.type === 'string') { this.next(); return tail({ type: 'string', parts: t.value.parts, line: t.line }); }
    if (t.type === 'charlist') { this.next(); return tail({ type: 'charlist', parts: t.value.parts, line: t.line }); }
    if (t.type === 'atom') { this.next(); return tail({ type: 'atom', name: t.value, line: t.line }); }
    if (t.type === 'sigil') {
      this.next();
      return tail({ type: 'sigil', letter: t.letter, content: t.value, mods: t.mods, line: t.line });
    }
    if (t.type === 'kw') {
      if (t.value === 'true' || t.value === 'false' || t.value === 'nil') {
        this.next();
        return tail({ type: 'atom', name: t.value, line: t.line });
      }
    }
    if (t.type === 'alias') {
      this.next();
      return tail({ type: 'alias', name: t.value, line: t.line });
    }
    if (t.type === 'ident' && t.value === 'match?') {
      this.next();
      if (this.atPunct('(')) {
        var raw = this.parseRawArgs();
        return { type: 'match_op', pattern: raw[0], value: raw[1], line: t.line };
      }
      this.i--; // 回退，按普通变量处理
    }
    if (t.type === 'ident') {
      this.next();
      var node;
      if (this.atPunct('(')) {
        node = { type: 'call', kind: 'local', name: t.value, args: this.parseArgs(), line: t.line };
      } else if (this.atPunct('[')) {
        // `opts[:name]` 是取值，不是无括号调用 opts([:name])
        node = { type: 'var', name: t.value, line: t.line };
      } else if (this.canStartOperand(this.peek())) {
        node = { type: 'call', kind: 'local', name: t.value, args: this.parseNoParenArgs(), line: t.line };
      } else {
        node = { type: 'var', name: t.value, line: t.line };
      }
      return tail(node);
    }
    if (t.type === 'punct') {
      if (t.value === '(') {
        this.next();
        var e = this.parseExpr();
        this.expect('punct', ')');
        return tail(e);
      }
      if (t.value === '[') return tail(this.parseList());
      if (t.value === '{') return tail(this.parseTuple());
    }
    if (t.type === 'op' && t.value === '%') return tail(this.parseMapOrStruct());

    throw EL.ElixirSyntaxError(
      '语法错误：意外的 ' + (t.type === 'eof' ? '文件结尾' : JSON.stringify(t.value)) + '（第 ' + t.line + ' 行）',
      t.line);
  };

  // ---------- 集合 ----------
  Parser.prototype.parseList = function () {
    var t = this.peek();
    this.expect('punct', '[');
    var items = [];
    while (!this.atPunct(']')) {
      this.skipEols();
      if (this.atPunct(']') || this.at('eof')) break;
      var item = this.parseExpr();
      // [head | tail]
      if (this.atOp('|')) {
        this.next();
        var tailExpr = this.parseExpr();
        item = { type: 'binop', op: '|', left: item, right: tailExpr, line: t.line };
      }
      items.push(item);
      if (this.atPunct(',')) { this.next(); continue; }
      if (this.at('eol')) { this.next(); continue; }
      if (!this.atPunct(']')) this.next();
    }
    this.expect('punct', ']');
    return { type: 'list', elems: flattenKeywords(items, t.line), line: t.line };
  };

  Parser.prototype.parseTuple = function () {
    var t = this.peek();
    this.expect('punct', '{');
    var items = [];
    while (!this.atPunct('}')) {
      this.skipEols();
      if (this.atPunct('}') || this.at('eof')) break;
      items.push(this.parseExpr());
      if (this.atPunct(',')) { this.next(); continue; }
      if (this.at('eol')) { this.next(); continue; }
      if (!this.atPunct('}')) this.next();
    }
    this.expect('punct', '}');
    return { type: 'tuple', elems: items, line: t.line };
  };

  function flattenKeywords(items, line) {
    var out = [];
    var tailKw = [];
    for (var i = items.length - 1; i >= 0; i--) {
      if (items[i] && items[i].type === 'kwpair') tailKw.unshift(items[i]);
      else break;
    }
    var n = items.length - tailKw.length;
    for (var k = 0; k < n; k++) out.push(items[k]);
    for (var m = 0; m < tailKw.length; m++) {
      out.push({ type: 'tuple', elems: [tailKw[m].key, tailKw[m].value], line: tailKw[m].line || line });
    }
    return out;
  }

  Parser.prototype.parseMapOrStruct = function () {
    var t = this.peek();
    this.expect('op', '%');
    if (this.atPunct('{')) {
      this.next();
      var pairs = this.parseMapPairs('}');
      this.expect('punct', '}');
      if (pairs.__update) {
        return {
          type: 'map_update', target: pairs.__update.target,
          pairs: pairs.__update.pairs, line: t.line
        };
      }
      return { type: 'map', pairs: pairs, line: t.line };
    }
    var nameTok = this.next();
    if (this.atPunct('{')) {
      this.next();
      var p2 = this.parseMapPairs('}');
      this.expect('punct', '}');
      if (nameTok.type === 'alias') return { type: 'struct', module: nameTok.value, pairs: p2, line: t.line };
      return { type: 'struct_var', target: { type: 'var', name: nameTok.value, line: t.line }, pairs: p2, line: t.line };
    }
    throw EL.ElixirSyntaxError('% 后面需要 {', t.line);
  };

  Parser.prototype.parseMapPairs = function (closer) {
    var pairs = [];
    while (!this.atPunct(closer)) {
      this.skipEols();
      if (this.atPunct(closer) || this.at('eof')) break;
      var key = this.parseExpr();
      if (this.atOp('|')) {
        this.next();
        var up = this.parseMapPairs(closer);
        pairs.__update = { target: key, pairs: up };
        while (!this.atPunct(closer) && !this.at('eof')) this.next();
        return pairs;
      }
      if (key.type === 'kwpair') {
        pairs.push({ key: key.key, value: key.value });
      } else {
        this.expect('op', '=>');
        pairs.push({ key: key, value: this.parseExpr() });
      }
      if (this.atPunct(',')) this.next();
    }
    return pairs;
  };

  // ---------- 参数 ----------
  Parser.prototype.parseArgs = function () {
    this.expect('punct', '(');
    var args = [];
    while (!this.atPunct(')')) {
      this.skipEols();
      if (this.atPunct(')') || this.at('eof')) break;
      args.push(this.parseExpr());
      if (this.atPunct(',')) { this.next(); continue; }
      if (this.at('eol')) { this.next(); continue; }
      if (!this.atPunct(')')) this.next();
    }
    this.expect('punct', ')');
    return groupKeywordArgs(args);
  };

  // 解析但不求值（用于 match?/2 这类宏式调用）
  Parser.prototype.parseRawArgs = function () {
    this.expect('punct', '(');
    var args = [];
    while (!this.atPunct(')')) {
      this.skipEols();
      if (this.atPunct(')') || this.at('eof')) break;
      args.push(this.parseExpr());
      if (this.atPunct(',')) { this.next(); continue; }
      if (!this.atPunct(')')) this.next();
    }
    this.expect('punct', ')');
    return args;
  };

  Parser.prototype.parseNoParenArgs = function () {
    var args = [];
    while (this.canStartOperand(this.peek())) {
      this.skipEols();
      if (!this.canStartOperand(this.peek())) break;
      args.push(this.parseExpr());
      if (this.atPunct(',')) { this.next(); continue; }
      break;
    }
    return groupKeywordArgs(args);
  };

  function groupKeywordArgs(args) {
    var res = [];
    var tailKw = [];
    for (var i = args.length - 1; i >= 0; i--) {
      if (args[i] && args[i].type === 'kwpair') tailKw.unshift(args[i]);
      else break;
    }
    var n = args.length - tailKw.length;
    for (var k = 0; k < n; k++) res.push(args[k]);
    if (tailKw.length) {
      res.push({
        type: 'list', line: tailKw[0].line,
        elems: tailKw.map(function (p) {
          return { type: 'tuple', elems: [p.key, p.value], line: p.line };
        })
      });
    }
    return res;
  }

  // ---------- fn ----------
  Parser.prototype.parseFn = function () {
    var t = this.peek();
    this.expect('kw', 'fn');
    var clauses = this.parseClauses(['end']);
    this.skipEols();
    this.expect('kw', 'end');
    return { type: 'fn', clauses: clauses, line: t.line };
  };

  // 解析 "pat -> body" 子句序列
  Parser.prototype.parseClauses = function (stops) {
    var clauses = [];
    while (true) {
      this.skipEols();
      var t = this.peek();
      if (!t || t.type === 'eof') break;
      if (t.type === 'kw' && (stops.indexOf(t.value) >= 0 || BLOCK_ENDERS.indexOf(t.value) >= 0)) break;
      if (t.type === 'punct' && (t.value === ')' || t.value === ']' || t.value === '}')) break;
      var params = [];
      var guard = null;
      if (this.pendingPattern) {
        params.push(this.pendingPattern);
        this.pendingPattern = null;
        if (this.atKw('when')) { this.next(); guard = this.parseExpr(); }
        this.expect('op', '->');
        var b2 = this.parseClauseBody();
        clauses.push({ params: params, guard: guard, body: b2, line: t.line });
        continue;
      }
      if (!(t.type === 'op' && t.value === '->')) {
        while (true) {
          params.push(this.parseExpr());
          if (this.atPunct(',')) { this.next(); continue; }
          break;
        }
        if (this.atKw('when')) {
          this.next();
          guard = this.parseExpr();
        }
        if (params.length === 1 && params[0].type === 'guard_when') {
          guard = params[0].right;
          params = [params[0].left];
        }
      }
      this.expect('op', '->');
      var body = this.parseClauseBody();
      clauses.push({ params: params, guard: guard, body: body, line: t.line });
    }
    return clauses;
  };

  Parser.prototype.parseClauseBody = function () {
    var exprs = [];
    while (true) {
      this.skipEols();
      var t = this.peek();
      if (!t || t.type === 'eof') break;
      if (t.type === 'kw' && BLOCK_ENDERS.indexOf(t.value) >= 0) break;
      if (t.type === 'op' && t.value === '->') break;
      if (t.type === 'punct' && (t.value === ')' || t.value === ']' || t.value === '}')) break;
      exprs.push(this.parseExpr());
      if (this.at('eol') || this.atPunct(';')) { this.next(); continue; }
      if (this.at('eof')) break;
      var t2 = this.peek();
      if (t2.type === 'kw' && BLOCK_ENDERS.indexOf(t2.value) >= 0) break;
      if (t2.type === 'op' && t2.value === '->') break;
      if (!this.at('eol')) this.next();
    }
    // 如果解析完一个表达式后紧跟 -> ，说明它其实是下一个子句的模式
    if (this.atOp('->') && exprs.length > 0) {
      this.pendingPattern = exprs.pop();
    }
    if (exprs.length === 0) return { type: 'atom', name: 'nil', line: 0 };
    if (exprs.length === 1) return exprs[0];
    return { type: 'block', exprs: exprs, line: exprs[0].line };
  };

  // ---------- do/end 块（支持 do: 简写） ----------
  // opts.clauses: 'do' | 'after' | 'else' | 'rescue' | 'catch' 哪些部分按子句解析
  Parser.prototype.parseBlocks = function (allowed, clauseParts) {
    clauseParts = clauseParts || {};
    var blocks = {};
    // 允许 `if x, do: ...` 这种带逗号的写法
    while (this.atPunct(',')) { this.next(); }
    this.skipEols();
    var t = this.peek();

    if (this.atKw('do') && this.peek(1) && this.peek(1).type === 'op' && this.peek(1).value === ':') {
      this.next(); this.next();
      blocks.do = this.parseExpr();
      while (this.atPunct(',')) {
        var save = this.i;
        this.next();
        var nk = this.peek();
        if (nk.type === 'kw' && allowed.indexOf(nk.value) >= 0 &&
          this.peek(1) && this.peek(1).type === 'op' && this.peek(1).value === ':') {
          this.next(); this.next();
          blocks[nk.value] = this.parseExpr();
        } else { this.i = save; break; }
      }
      return blocks;
    }

    if (!this.atKw('do')) {
      throw EL.ElixirSyntaxError('语法错误：期望 do ... end 或 do: ...（第 ' + t.line + ' 行）', t.line);
    }
    this.next();
    this.skipEols();
    if (clauseParts.do) blocks.doClauses = this.parseClauses(['end'].concat(allowed));
    else blocks.do = this.parseClauseBody();

    while (true) {
      this.skipEols();
      var tk = this.peek();
      if (tk.type === 'kw' && allowed.indexOf(tk.value) >= 0) {
        this.next();
        this.skipEols();
        if (clauseParts[tk.value]) blocks[tk.value + 'Clauses'] = this.parseClauses(['end'].concat(allowed));
        else blocks[tk.value] = this.parseClauseBody();
        continue;
      }
      break;
    }
    this.skipEols();
    this.expect('kw', 'end');
    return blocks;
  };

  // ---------- case / cond / if / receive / try ----------
  Parser.prototype.parseCase = function () {
    var t = this.peek();
    this.expect('kw', 'case');
    var expr = this.parseExpr();
    this.skipEols();
    var blocks = this.parseBlocks(['else'], { do: true, else: true });
    return {
      type: 'case', expr: expr,
      clauses: blocks.doClauses || [],
      elseClauses: blocks.elseClauses || null,
      line: t.line
    };
  };

  Parser.prototype.parseCond = function () {
    var t = this.peek();
    this.expect('kw', 'cond');
    this.skipEols();
    var blocks = this.parseBlocks([], { do: true });
    return { type: 'cond', clauses: blocks.doClauses || [], line: t.line };
  };

  Parser.prototype.parseIf = function () {
    var t = this.peek();
    var kind = this.next().value;
    var cond = this.parseExpr();
    this.skipEols();
    var blocks = this.parseBlocks(['else']);
    return { type: 'if', kind: kind, cond: cond, then: blocks.do, otherwise: blocks.else || null, line: t.line };
  };

  Parser.prototype.parseReceive = function () {
    var t = this.peek();
    this.expect('kw', 'receive');
    this.skipEols();
    var blocks = this.parseBlocks(['after'], { do: true, after: true });
    return {
      type: 'receive', clauses: blocks.doClauses || [],
      after: blocks.afterClauses || null, line: t.line
    };
  };

  Parser.prototype.parseTry = function () {
    var t = this.peek();
    this.expect('kw', 'try');
    this.skipEols();
    var blocks = this.parseBlocks(['rescue', 'catch', 'else', 'after'],
      { rescue: true, catch: true, else: true });
    return {
      type: 'try', body: blocks.do, rescueClauses: blocks.rescueClauses || null,
      catchClauses: blocks.catchClauses || null, elseClauses: blocks.elseClauses || null,
      after: blocks.after || null, line: t.line
    };
  };

  Parser.prototype.parseRaiseLike = function () {
    var t = this.peek();
    var kind = this.next().value;
    if (this.atPunct('(')) {
      var a = this.parseArgs();
      return { type: 'raise', kind: kind, arg: a[0], line: t.line };
    }
    if (this.canStartOperand(this.peek())) return { type: 'raise', kind: kind, arg: this.parseExpr(), line: t.line };
    return { type: 'raise', kind: kind, arg: { type: 'atom', name: kind, line: t.line }, line: t.line };
  };

  // ---------- for / with ----------
  Parser.prototype.parseFor = function () {
    var t = this.peek();
    this.expect('kw', 'for');
    var generators = [], filters = [], into = null;
    while (true) {
      this.skipEols();
      if (this.atKw('do')) break;
      var pat = this.parseExpr();
      if (pat.type === 'kwpair' && pat.key && pat.key.name === 'into') { into = pat.value; }
      else if (this.atOp('<-')) {
        this.next();
        generators.push({ pattern: pat, source: this.parseExpr(), line: t.line });
      } else {
        filters.push(pat);
      }
      if (this.atPunct(',')) { this.next(); this.skipEols(); continue; }
      break;
    }
    this.skipEols();
    var blocks = this.parseBlocks([]);
    return { type: 'for', generators: generators, filters: filters, body: blocks.do, into: into, line: t.line };
  };

  Parser.prototype.parseWith = function () {
    var t = this.peek();
    this.expect('kw', 'with');
    var clauses = [];
    while (true) {
      var pat = this.parseExpr();
      if (this.atOp('<-')) {
        this.next();
        clauses.push({ pattern: pat, source: this.parseExpr(), line: t.line });
      } else {
        clauses.push({ pattern: { type: 'var', name: '_', line: t.line }, source: pat, line: t.line });
      }
      if (this.atPunct(',')) { this.next(); this.skipEols(); continue; }
      break;
    }
    this.skipEols();
    var blocks = this.parseBlocks(['else'], { else: true });
    return {
      type: 'with', clauses: clauses, body: blocks.do,
      elseClauses: blocks.elseClauses || null, line: t.line
    };
  };

  // ---------- 模块 / 函数 ----------
  Parser.prototype.parseDefmodule = function () {
    var t = this.peek();
    this.expect('kw', 'defmodule');
    var nameTok = this.next();
    if (nameTok.type !== 'alias' && nameTok.type !== 'ident' && nameTok.type !== 'atom') {
      throw EL.ElixirSyntaxError('defmodule 后需要模块名', t.line);
    }
    if (this.atPunct(',')) this.next();
    this.skipEols();
    var blocks = this.parseBlocks([]);
    return { type: 'defmodule', name: nameTok.value, body: blocks.do, line: t.line };
  };

  Parser.prototype.parseDefmoduleLike = function () {
    var t = this.peek();
    this.next();
    var nameTok = this.next();
    this.skipEols();
    var blocks = this.parseBlocks([]);
    return { type: 'defmodule', name: nameTok.value, body: blocks.do, line: t.line };
  };

  Parser.prototype.parseDefstruct = function () {
    var t = this.peek();
    this.expect('kw', 'defstruct');
    var fields = [];
    if (this.atPunct('[')) {
      this.next();
      while (!this.atPunct(']')) {
        this.skipEols();
        if (this.atPunct(']')) break;
        fields.push({ name: this.next().value, default: null });
        if (this.atPunct(',')) this.next();
      }
      this.expect('punct', ']');
    } else if (this.atPunct('(')) {
      this.next();
      while (!this.atPunct(')')) {
        fields.push({ name: this.next().value, default: null });
        if (this.atPunct(',')) this.next();
      }
      this.expect('punct', ')');
    } else {
      while (this.canStartOperand(this.peek())) {
        var p = this.parseExpr();
        if (p.type === 'kwpair') fields.push({ name: p.key.name, default: p.value });
        if (this.atPunct(',')) { this.next(); continue; }
        break;
      }
    }
    return { type: 'defstruct', fields: fields, line: t.line };
  };

  Parser.prototype.parseDef = function () {
    var t = this.peek();
    var kwTok = this.next();
    var isPrivate = (kwTok.value === 'defp' || kwTok.value === 'defmacrop');
    var nameTok = this.next();
    if (!nameTok || (nameTok.type !== 'ident' && nameTok.type !== 'kw' &&
      nameTok.type !== 'op' && nameTok.type !== 'atom')) {
      throw EL.ElixirSyntaxError('def 后需要函数名（第 ' + t.line + ' 行）', t.line);
    }
    var params = [];
    if (this.atPunct('(')) {
      this.next();
      while (!this.atPunct(')')) {
        this.skipEols();
        if (this.atPunct(')') || this.at('eof')) break;
        params.push(this.parseParam());
        if (this.atPunct(',')) { this.next(); continue; }
        if (this.at('eol')) { this.next(); continue; }
        if (!this.atPunct(')')) this.next();
      }
      this.expect('punct', ')');
    }
    var guard = null;
    if (this.atKw('when')) {
      this.next();
      guard = this.parseExpr();
    }
    this.skipEols();
    if (this.atPunct(',')) { this.next(); this.skipEols(); }
    var blocks = this.parseBlocks([]);
    return {
      type: 'def', name: nameTok.value, params: params, guard: guard,
      body: blocks.do, private: isPrivate, line: t.line
    };
  };

  Parser.prototype.parseParam = function () {
    var e = this.parseExpr();
    if (this.atOp('\\\\')) {
      this.next();
      return { type: 'param', pattern: e, default: this.parseExpr(), line: e.line };
    }
    return { type: 'param', pattern: e, default: null, line: e.line };
  };

  Parser.prototype.parseDirective = function () {
    var t = this.peek();
    var kind = this.next().value;
    var args = [];
    if (this.atPunct('(')) args = this.parseArgs();
    else {
      while (this.canStartOperand(this.peek())) {
        args.push(this.parseExpr());
        if (this.atPunct(',')) { this.next(); continue; }
        break;
      }
    }
    return { type: 'directive', kind: kind, args: args, line: t.line };
  };

  EL.parse = parse;
  EL.Parser = Parser;

})(typeof window !== 'undefined' ? window : globalThis);
