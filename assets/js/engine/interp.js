/*
 * Elixir 求值器：模式匹配、模块、函数、控制流、并发
 */
(function (global) {
  'use strict';

  var EL = global.EL || (global.EL = {});
  var R = EL.R;
  var A = R.atom;
  var OK = A('ok'), NIL = R.NIL, TRUE = R.TRUE, FALSE = R.FALSE;

  var MAX_STEPS = 2000000;

  // ---------- 环境 ----------
  function Env(parent) { this.vars = Object.create(null); this.parent = parent || null; }
  Env.prototype.lookupEnv = function (name) {
    var e = this;
    while (e) { if (name in e.vars) return e; e = e.parent; }
    return null;
  };
  Env.prototype.get = function (name) {
    var e = this.lookupEnv(name);
    return e ? e.vars[name] : undefined;
  };
  Env.prototype.set = function (name, v) {
    var e = this.lookupEnv(name);
    if (e) e.vars[name] = v; else this.vars[name] = v;
    return v;
  };
  Env.prototype.bind = function (name, v) { this.vars[name] = v; return v; };
  EL.Env = Env;

  // ---------- 解释器 ----------
  function Interp(opts) {
    opts = opts || {};
    this.modules = Object.create(null);
    this.sched = new EL.OTP.Scheduler();
    this.output = '';
    this.steps = 0;
    this.currentModule = null;
    this.currentProc = null;
    this.deadline = opts.deadline || 0;
    this.onTrace = opts.onTrace || null;
    this.supervisors = [];
  }
  EL.Interp = Interp;

  Interp.prototype.out = function (s) { this.output += s; };

  Interp.prototype.tick = function (node) {
    // 顶层 run() 已结束：后台进程立即退场，避免空转到超时或触发 Supervisor 无限重启
    if (this.sched.closed) throw new EL.ExitError('shutdown');
    if (++this.steps > MAX_STEPS) {
      throw new EL.RuntimeError('执行超时：代码可能陷入了死循环（超过 ' + MAX_STEPS + ' 步）');
    }
    if (this.deadline && Date.now() > this.deadline) {
      throw new EL.RuntimeError('执行超时：代码运行时间过长');
    }
  };

  // ---------- 模块解析 ----------
  Interp.prototype.resolveAlias = function (name) {
    var m = this.currentModule;
    if (m && m.aliases && m.aliases[name]) return m.aliases[name];
    return name;
  };

  Interp.prototype.getModule = function (name) {
    return this.modules[name] || null;
  };

  Interp.prototype.builtin = function (modName, fname, arity) {
    var mod = EL.BUILTINS[modName];
    if (!mod) return null;
    return mod[fname + '/' + arity] || null;
  };

  Interp.prototype.moduleHasFunction = function (modRef, fname, arity) {
    var name = modRef instanceof R.Atom ? modRef.name : (typeof modRef === 'string' ? modRef : null);
    if (!name) return false;
    var m = this.getModule(name);
    if (m && m.functions[fname + '/' + arity]) return true;
    return !!this.builtin(name, fname, arity);
  };

  Interp.prototype.applyModule = function (modRef, fname, args) {
    var name = modRef instanceof R.Atom ? modRef.name : (typeof modRef === 'string' ? modRef : String(modRef));
    var key = fname + '/' + args.length;
    var m = this.getModule(name);
    if (m) {
      var fns = m.functions[key];
      if (fns) {
        var self = this;
        var fn = new R.Fn({ clauses: fns, arity: args.length, name: fname, module: name, kind: 'named', env: m.env });
        var saved = this.currentModule;
        return Promise.resolve().then(function () {
          self.currentModule = m;
          return self.applyFn(fn, args).then(function (v) { self.currentModule = saved; return v; },
            function (e) { self.currentModule = saved; throw e; });
        });
      }
    }
    var b = this.builtin(name, fname, args.length);
    if (b) {
      try { return Promise.resolve(b(args, this)); }
      catch (e) { return Promise.reject(e); }
    }
    // :erlang 模块兜底到 Kernel
    if (name === 'erlang') {
      var eb = this.builtin('Kernel', fname, args.length);
      if (eb) return Promise.resolve(eb(args, this));
    }
    return Promise.reject(new EL.UndefinedFunctionError(
      '未定义的函数 ' + name + '.' + fname + '/' + args.length +
      (m ? '（模块 ' + name + ' 存在，但没有这个函数）' : '（模块 ' + name + ' 不存在）')));
  };

  Interp.prototype.applyModuleNow = function (modRef, fname, args) {
    var r = this.applyModule(modRef, fname, args);
    if (r && typeof r.then === 'function') return null;
    return r;
  };

  Interp.prototype.callNow = function (modRef, fname, args) {
    return this.applyModule(modRef, fname, args);
  };

  // 本地（未限定）函数调用
  Interp.prototype.callLocal = function (name, args, env) {
    var key = name + '/' + args.length;
    var m = this.currentModule;
    if (m) {
      var fns = m.functions[key];
      if (fns) {
        var fn = new R.Fn({ clauses: fns, arity: args.length, name: name, module: m.name, kind: 'named', env: m.env });
        return this.applyFn(fn, args);
      }
      if (m.imports) {
        for (var i = 0; i < m.imports.length; i++) {
          var im = m.imports[i];
          var target = this.getModule(im);
          if (target && target.functions[key]) {
            var tfn = new R.Fn({ clauses: target.functions[key], arity: args.length, name: name, module: im, kind: 'named', env: target.env });
            return this.applyFn(tfn, args);
          }
          if (this.builtin(im, name, args.length)) {
            return this.applyModule(im, name, args);
          }
        }
      }
    }
    var b = this.builtin('Kernel', name, args.length);
    if (b) {
      try { return Promise.resolve(b(args, this)); }
      catch (e) { return Promise.reject(e); }
    }
    return Promise.reject(new EL.UndefinedFunctionError(
      '未定义的函数 ' + name + '/' + args.length + (m ? '（在模块 ' + m.name + ' 中找不到）' : '')));
  };

  // 调用一个函数值
  Interp.prototype.applyFn = function (fn, args) {
    if (!(fn instanceof R.Fn)) {
      if (fn === undefined || fn === null) {
        return Promise.reject(new EL.UndefinedFunctionError('尝试调用一个不存在的函数（nil）'));
      }
      return Promise.reject(new EL.UndefinedFunctionError('尝试调用非函数值：' + R.inspect(fn)));
    }
    var self = this;

    if (fn.kind === 'capture_remote') {
      return this.applyModule(A(this.resolveAlias(fn.module)), fn.name, args);
    }
    if (fn.kind === 'capture_local') {
      return this.callLocal(fn.name, args, null);
    }
    if (fn.kind === 'capture_anon') {
      var env = new Env(fn.env);
      for (var i = 0; i < fn.arity; i++) {
        env.bind('&' + (i + 1), args[i] === undefined ? NIL : args[i]);
      }
      return this.eval(fn.body, env);
    }

    if (fn.arity !== undefined && args.length !== fn.arity) {
      // 带默认参数的具名函数可能注册成多个 arity，这里按实际参数找
    }

    var clauses = fn.clauses || [];
    return (function tryClause(idx) {
      if (idx >= clauses.length) {
        return Promise.reject(new EL.FunctionClauseError(
          '没有匹配的函数子句：' + (fn.module ? fn.module + '.' : '') + (fn.name || 'anonymous') +
          '/' + args.length + '，参数为 ' + args.map(R.inspect).join(', ')));
      }
      var cl = clauses[idx];
      var env = new Env(fn.env || null);
      var argVals = args.slice();
      var provided = cl.defaultFrom !== undefined ? cl.defaultFrom : cl.params.length;
      if (argVals.length !== provided) return tryClause(idx + 1);

      // 先匹配显式传入的参数，再按默认值补齐
      var i = 0, ok = true;
      for (; i < provided; i++) {
        var p0 = cl.params[i];
        if (!self.bindPattern((p0 && p0.type === 'param') ? p0.pattern : p0, argVals[i], env)) { ok = false; break; }
      }
      if (!ok) return tryClause(idx + 1);
      return fillDefaults(provided);

      function fillDefaults(k) {
        if (k >= cl.params.length) return afterDefaults();
        var d = cl.defaults && cl.defaults[k];
        if (!d) return afterDefaults();
        return self.eval(d, env).then(function (v) {
          var pk = cl.params[k];
          if (pk && pk.type === 'param' && pk.pattern && pk.pattern.type === 'var') {
            env.bind(pk.pattern.name, v);
          } else {
            self.bindPattern((pk && pk.type === 'param') ? pk.pattern : pk, v, env);
          }
          return fillDefaults(k + 1);
        });
      }

      function afterDefaults() {
        if (cl.guard) {
          return self.eval(cl.guard, env).then(function (g) {
            if (!R.isTruthy(g)) return tryClause(idx + 1);
            return runBody();
          });
        }
        return runBody();
      }
      function runBody() {
        var savedMod = self.currentModule;
        if (fn.module) {
          var mm = self.getModule(fn.module);
          if (mm) self.currentModule = mm;
        }
        return self.eval(cl.body, env).then(function (v) { self.currentModule = savedMod; return v; },
          function (e) { self.currentModule = savedMod; throw e; });
      }
    })(0);
  };

  Interp.prototype.matchParams = function (params, values, env) {
    var self = this;
    var i = 0;
    function step() {
      if (i >= params.length) return Promise.resolve(true);
      var p = params[i];
      var node = (p && p.type === 'param') ? p.pattern : p;
      var ok = self.bindPattern(node, values[i], env);
      i++;
      if (ok && i < params.length) return step();
      return Promise.resolve(ok);
    }
    return step();
  };

  // ---------- 模式匹配 ----------
  Interp.prototype.bindPattern = function (pat, value, env) {
    if (!pat) return false;
    switch (pat.type) {
      case 'var': {
        var nm = pat.name;
        if (nm === '_') return true;
        if (nm.indexOf('&') === 0) { env.bind(nm, value); return true; }
        env.bind(nm, value);
        return true;
      }
      case 'num': return R.looseEquals(pat.value, value);
      case 'string': {
        var s = this.buildStringSync(pat, env);
        return typeof value === 'string' && value === s;
      }
      case 'atom': return R.looseEquals(A(pat.name), value);
      case 'alias': return R.looseEquals(A(pat.name), value);
      case 'unop':
        if (pat.op === '^') {
          var v = this.evalSyncVar(pat.expr, env);
          return R.looseEquals(v, value);
        }
        return false;
      case 'list': {
        if (!Array.isArray(value)) return false;
        var elems = pat.elems;
        var i = 0;
        for (; i < elems.length; i++) {
          var e = elems[i];
          if (e.type === 'binop' && e.op === '|') {
            // [head | tail]
            if (value.length < i) return false;
            if (!this.bindPattern(e.left, value[i], env)) return false;
            return this.bindPattern(e.right, value.slice(i + 1), env);
          }
          if (i >= value.length) return false;
          if (!this.bindPattern(e, value[i], env)) return false;
        }
        return value.length === elems.length;
      }
      case 'tuple': {
        if (!(value instanceof R.Tuple) || value.items.length !== pat.elems.length) return false;
        for (var t = 0; t < pat.elems.length; t++) {
          if (!this.bindPattern(pat.elems[t], value.items[t], env)) return false;
        }
        return true;
      }
      case 'map': {
        if (!(value instanceof R.MapVal)) return false;
        for (var m = 0; m < pat.pairs.length; m++) {
          var pr = pat.pairs[m];
          var k = this.patternKeySync(pr.key, env);
          if (!value.has(k)) return false;
          if (!this.bindPattern(pr.value, value.get(k), env)) return false;
        }
        return true;
      }
      case 'struct': {
        if (!(value instanceof R.Struct)) return false;
        var modName = this.resolveAlias(pat.module);
        var vmod = typeof value.module === 'string' ? value.module : value.module.name;
        if (vmod !== modName) return false;
        for (var s2 = 0; s2 < pat.pairs.length; s2++) {
          var pr2 = pat.pairs[s2];
          var k2 = this.patternKeySync(pr2.key, env);
          if (!value.map.has(k2)) return false;
          if (!this.bindPattern(pr2.value, value.map.get(k2), env)) return false;
        }
        return true;
      }
      case 'binop': {
        if (pat.op === '<>') {
          // "前缀" <> rest
          var left = this.buildStringSync(pat.left, env);
          if (typeof value !== 'string' || value.indexOf(left) !== 0) return false;
          return this.bindPattern(pat.right, value.slice(left.length), env);
        }
        if (pat.op === '|') {
          if (!Array.isArray(value) || value.length === 0) return false;
          if (!this.bindPattern(pat.left, value[0], env)) return false;
          return this.bindPattern(pat.right, value.slice(1), env);
        }
        return false;
      }
      default:
        return false;
    }
  };

  Interp.prototype.patternKeySync = function (node, env) {
    if (!node) return NIL;
    if (node.type === 'atom') return A(node.name);
    if (node.type === 'num') return node.value;
    if (node.type === 'string') return this.buildStringSync(node, env);
    if (node.type === 'var') return env.get(node.name);
    if (node.type === 'alias') return A(node.name);
    return node;
  };

  Interp.prototype.evalSyncVar = function (node, env) {
    if (node.type === 'var') return env.get(node.name);
    if (node.type === 'atom') return A(node.name);
    if (node.type === 'num') return node.value;
    return undefined;
  };

  Interp.prototype.buildStringSync = function (node, env) {
    var out = '';
    var parts = node.parts || [];
    for (var i = 0; i < parts.length; i++) {
      var p = parts[i];
      if (p.s !== undefined) out += p.s;
      else {
        var v = env.get('$interp_' + p.expr);
        out += v === undefined ? '' : R.to_string(v);
      }
    }
    return out;
  };

  Interp.prototype.tryMatch = function (pat, value) {
    var env = new Env(null);
    return this.bindPattern(pat, value, env);
  };

  // ---------- 求值 ----------
  Interp.prototype.eval = function (node, env) {
    this.tick(node);
    if (!node) return Promise.resolve(NIL);
    var self = this;
    var fn = this['eval_' + node.type];
    if (!fn) {
      return Promise.reject(new EL.RuntimeError('暂不支持的语法：' + node.type));
    }
    try {
      return fn.call(this, node, env);
    } catch (e) {
      return Promise.reject(e);
    }
  };

  Interp.prototype.eval_block = function (n, env) {
    var self = this, i = 0, last = NIL;
    function step() {
      if (i >= n.exprs.length) return Promise.resolve(last);
      return self.eval(n.exprs[i], env).then(function (v) { last = v; i++; return step(); });
    }
    return step();
  };

  // 浮点字面量必须包成 FloatVal，否则 is_float(2.5) 会是 false（Elixir 里 2.5 是 float）
  Interp.prototype.eval_num = function (n) {
    return Promise.resolve(n.float ? new R.FloatVal(n.value) : n.value);
  };
  Interp.prototype.eval_atom = function (n) { return Promise.resolve(A(n.name)); };
  Interp.prototype.eval_alias = function (n) { return Promise.resolve(A(n.name)); };
  Interp.prototype.eval_var = function (n, env) {
    var v = env.get(n.name);
    if (v === undefined) {
      return Promise.reject(new EL.RuntimeError('未绑定的变量 ' + n.name + '（第 ' + n.line + ' 行）'));
    }
    return Promise.resolve(v);
  };

  Interp.prototype.eval_string = function (n, env) {
    var self = this;
    var out = '';
    var parts = n.parts || [];
    var i = 0;
    function step() {
      if (i >= parts.length) return Promise.resolve(out);
      var p = parts[i];
      if (p.s !== undefined) { out += p.s; i++; return step(); }
      // 插值表达式
      var ast = EL.parse('(' + p.expr + ')');
      return self.eval(ast, env).then(function (v) {
        out += R.to_string(v);
        i++;
        return step();
      });
    }
    return step();
  };

  Interp.prototype.eval_charlist = function (n, env) {
    var self = this;
    return this.eval_string(n, env).then(function (s) {
      var arr = [];
      for (var i = 0; i < s.length; i++) arr.push(s.charCodeAt(i));
      arr.__charlist = true;
      return arr;
    });
  };

  Interp.prototype.eval_sigil = function (n, env) {
    var c = n.content;
    switch (n.letter) {
      case 'w':
        if (c.indexOf('a') >= 0 && n.mods && n.mods.indexOf('a') >= 0) {
          return Promise.resolve(c.trim().split(/\s+/).map(A));
        }
        if (n.letter === 'w') {
          if (c === c.toLowerCase() || c === c.toUpperCase()) { }
        }
        return Promise.resolve(c.trim().split(/\s+/));
      case 's': return Promise.resolve(c);
      case 'c': {
        var arr = [];
        for (var i = 0; i < c.length; i++) arr.push(c.charCodeAt(i));
        arr.__charlist = true;
        return Promise.resolve(arr);
      }
      case 'r': return Promise.resolve(c);
      default: return Promise.resolve(c);
    }
  };

  Interp.prototype.eval_binop = function (n, env) {
    var self = this;
    return this.eval(n.left, env).then(function (l) {
      return self.eval(n.right, env).then(function (r) {
        return self.binop(n.op, l, r, n);
      });
    });
  };

  Interp.prototype.binop = function (op, l, r, node) {
    switch (op) {
      case '+': case '-': case '*': {
        if (!R.isNumber(l) || !R.isNumber(r)) {
          throw new EL.ArithmeticError('算术运算只能用于数字，得到 ' + R.inspect(l) + ' ' + op + ' ' + R.inspect(r));
        }
        var a = R.num(l), b = R.num(r);
        var v = op === '+' ? a + b : (op === '-' ? a - b : a * b);
        if (l instanceof R.FloatVal || r instanceof R.FloatVal) return new R.FloatVal(v);
        return v;
      }
      case '/': {
        if (!R.isNumber(l) || !R.isNumber(r)) {
          throw new EL.ArithmeticError('除法只能用于数字');
        }
        if (R.num(r) === 0) throw new EL.ArithmeticError('除数不能为 0');
        return new R.FloatVal(R.num(l) / R.num(r));
      }
      case '++': {
        if (!Array.isArray(l) || !Array.isArray(r)) throw new EL.ArgumentError('++ 只能连接列表');
        return l.concat(r);
      }
      case '--': {
        if (!Array.isArray(l) || !Array.isArray(r)) throw new EL.ArgumentError('-- 只能用于列表');
        var out = l.slice();
        for (var i = 0; i < r.length; i++) {
          var idx = -1;
          for (var j = 0; j < out.length; j++) {
            if (R.strictEquals(out[j], r[i])) { idx = j; break; }
          }
          if (idx >= 0) out.splice(idx, 1);
        }
        return out;
      }
      case '<>': {
        if (typeof l !== 'string' || typeof r !== 'string') {
          throw new EL.ArgumentError('<> 只能连接字符串（二进制）');
        }
        return l + r;
      }
      case '==': return R.toBool(R.looseEquals(l, r));
      case '!=': return R.toBool(!R.looseEquals(l, r));
      case '===': return R.toBool(R.strictEquals(l, r));
      case '!==': return R.toBool(!R.strictEquals(l, r));
      case '<': return R.toBool(R.compare(l, r) < 0);
      case '>': return R.toBool(R.compare(l, r) > 0);
      case '<=': return R.toBool(R.compare(l, r) <= 0);
      case '>=': return R.toBool(R.compare(l, r) >= 0);
      case 'and': return R.toBool(R.isTruthy(l) && R.isTruthy(r));
      case 'or': return R.toBool(R.isTruthy(l) || R.isTruthy(r));
      case 'in': {
        var list;
        if (r instanceof R.Range) list = R.toList(r);
        else if (Array.isArray(r)) list = r;
        else if (r instanceof R.MapVal) list = r.pairs().map(function (p) { return p[0]; });
        else if (typeof r === 'string') list = r.split('');
        else throw new EL.ArgumentError('in 的右侧需要列表或范围');
        for (var k = 0; k < list.length; k++) if (R.strictEquals(list[k], l)) return TRUE;
        return FALSE;
      }
      case '..': {
        var step = 1;
        return new R.Range(R.num(l), R.num(r), step);
      }
      case '|': throw new EL.ArgumentError('| 只能用在列表模式 [head | tail] 中');
      default:
        throw new EL.RuntimeError('不支持的运算符 ' + op);
    }
  };

  Interp.prototype.eval_unop = function (n, env) {
    var self = this;
    return this.eval(n.expr, env).then(function (v) {
      switch (n.op) {
        case '-':
          if (!R.isNumber(v)) throw new EL.ArithmeticError('一元 - 需要数字');
          return v instanceof R.FloatVal ? new R.FloatVal(-v.v) : -v;
        case '+': return v;
        case '!': case 'not': return R.toBool(!R.isTruthy(v));
        case '^': return v;
        default: throw new EL.RuntimeError('不支持的一元运算符 ' + n.op);
      }
    });
  };

  Interp.prototype.eval_match = function (n, env) {
    var self = this;
    return this.eval(n.right, env).then(function (v) {
      // 左侧是变量且不是 ^ 时重新绑定
      if (n.left.type === 'var' && n.left.name !== '_') {
        env.set(n.left.name, v);
        return v;
      }
      var ok = self.bindPattern(n.left, v, env);
      if (!ok) {
        throw new EL.MatchError('模式匹配失败：左侧 ' + describePattern(n.left) +
          ' 无法匹配右侧 ' + R.inspect(v) + '（第 ' + (n.line || 0) + ' 行）');
      }
      return v;
    });
  };

  Interp.prototype.eval_match_op = function (n, env) {
    var self = this;
    return this.eval(n.value, env).then(function (v) {
      var e = new Env(env);
      return R.toBool(self.bindPattern(n.pattern, v, e));
    });
  };

  function describePattern(n) {
    if (!n) return '?';
    switch (n.type) {
      case 'var': return n.name;
      case 'num': return String(n.value);
      case 'atom': return ':' + n.name;
      case 'list': return '[' + n.elems.map(describePattern).join(', ') + ']';
      case 'tuple': return '{' + n.elems.map(describePattern).join(', ') + '}';
      case 'map': return '%{...}';
      case 'unop': return n.op === '^' ? '^' + describePattern(n.expr) : describePattern(n.expr);
      case 'binop': return describePattern(n.left) + ' ' + n.op + ' ' + describePattern(n.right);
      default: return n.type;
    }
  }
  EL.describePattern = describePattern;

  Interp.prototype.eval_pipe = function (n, env) {
    var self = this;
    return this.eval(n.left, env).then(function (v) {
      var right = n.right;
      if (right.type === 'call') {
        var args = [v];
        return self.evalArgs(right.args || [], env).then(function (rest) {
          var all = args.concat(rest);
          if (right.kind === 'remote') {
            return self.eval(right.module, env).then(function (mod) {
              return self.applyModule(mod, right.name, all);
            });
          }
          return self.callLocal(right.name, all, env);
        });
      }
      return Promise.reject(new EL.ArgumentError('管道 |> 右侧需要函数调用'));
    });
  };

  Interp.prototype.evalArgs = function (args, env) {
    var self = this;
    var out = [];
    var i = 0;
    function step() {
      if (i >= args.length) return Promise.resolve(out);
      return self.eval(args[i], env).then(function (v) { out.push(v); i++; return step(); });
    }
    return step();
  };

  Interp.prototype.eval_access = function (n, env) {
    var self = this;
    return this.eval(n.target, env).then(function (t) {
      return self.eval(n.key, env).then(function (k) {
        if (t instanceof R.MapVal) {
          var v = t.get(k);
          return v === undefined ? NIL : v;
        }
        if (t instanceof R.Struct) {
          var v2 = t.map.get(k);
          return v2 === undefined ? NIL : v2;
        }
        if (Array.isArray(t)) {
          var i = R.num(k);
          if (i < 0) i = t.length + i;
          var v3 = t[i];
          if (v3 === undefined && R.isKeyword(t) && k instanceof R.Atom) {
            return R.keywordGet(t, k.name, NIL);
          }
          return v3 === undefined ? NIL : v3;
        }
        if (t instanceof R.Tuple) {
          var idx = R.num(k);
          if (idx < 0 || idx >= t.items.length) throw new EL.ArgumentError('元组索引越界');
          return t.items[idx];
        }
        if (typeof t === 'string') {
          var si = R.num(k);
          var c = t.charAt(si < 0 ? t.length + si : si);
          return c === '' ? NIL : c;
        }
        throw new EL.ArgumentError('无法对 ' + R.inspect(t) + ' 使用 [] 取值');
      });
    });
  };

  Interp.prototype.eval_dot = function (n, env) {
    var self = this;
    return this.eval(n.target, env).then(function (t) {
      var key = A(n.name);
      if (t instanceof R.MapVal || t instanceof R.Struct) {
        var map = t instanceof R.Struct ? t.map : t;
        if (!map.has(key)) {
          throw new EL.KeyError('键 :' + n.name + ' 在 ' + R.inspect(t) + ' 中不存在');
        }
        return map.get(key);
      }
      if (t instanceof R.Atom) {
        // Mod.fun 作为值使用（远程调用已在 parser 处理）
        return self.applyModule(t, n.name, []);
      }
      throw new EL.ArgumentError('无法对 ' + R.inspect(t) + ' 访问字段 .' + n.name);
    });
  };

  Interp.prototype.eval_call = function (n, env) {
    var self = this;
    return this.evalArgs(n.args || [], env).then(function (args) {
      if (n.kind === 'anon') {
        return self.eval(n.target, env).then(function (f) {
          return self.applyFn(f, args);
        });
      }
      if (n.kind === 'remote') {
        return self.eval(n.module, env).then(function (mod) {
          if (mod instanceof R.Atom || typeof mod === 'string') {
            return self.applyModule(mod, n.name, args);
          }
          if (mod instanceof R.Struct || mod instanceof R.MapVal) {
            throw new EL.UndefinedFunctionError('不能对 ' + R.inspect(mod) + ' 调用 .' + n.name);
          }
          return self.applyModule(mod, n.name, args);
        });
      }
      return self.callLocal(n.name, args, env);
    });
  };

  Interp.prototype.eval_fn = function (n, env) {
    var arity = n.clauses.length ? (n.clauses[0].params.length || 0) : 0;
    return Promise.resolve(new R.Fn({
      clauses: n.clauses, arity: arity, env: env, kind: 'anon'
    }));
  };

  Interp.prototype.eval_capture = function (n, env) {
    if (n.type === 'capture') {
      var idxs = [];
      collectCaptureArgs(n.expr, idxs);
      var arity = idxs.length ? Math.max.apply(null, idxs) : 0;
      return Promise.resolve(new R.Fn({
        kind: 'capture_anon', arity: arity, env: env, body: n.expr, clauses: []
      }));
    }
    return Promise.resolve(NIL);
  };

  Interp.prototype.eval_capture_remote = function (n, env) {
    return Promise.resolve(new R.Fn({
      kind: 'capture_remote', arity: n.arity, module: n.module, name: n.name, clauses: [], env: env
    }));
  };

  Interp.prototype.eval_capture_local = function (n, env) {
    return Promise.resolve(new R.Fn({
      kind: 'capture_local', arity: n.arity, name: n.name, clauses: [], env: env,
      module: this.currentModule ? this.currentModule.name : null
    }));
  };

  Interp.prototype.eval_capture_arg = function (n, env) {
    return Promise.resolve(env.get('&' + n.index));
  };

  function collectCaptureArgs(node, acc) {
    if (!node || typeof node !== 'object') return;
    if (node.type === 'capture_arg') { if (acc.indexOf(node.index) < 0) acc.push(node.index); return; }
    for (var k in node) {
      if (k === 'line') continue;
      var v = node[k];
      if (Array.isArray(v)) v.forEach(function (x) { collectCaptureArgs(x, acc); });
      else if (v && typeof v === 'object') collectCaptureArgs(v, acc);
    }
  }

  // ---------- 控制流 ----------
  Interp.prototype.eval_case = function (n, env) {
    var self = this;
    return this.eval(n.expr, env).then(function (v) {
      return self.matchClauses(n.clauses, [v], env, 'case');
    });
  };

  Interp.prototype.eval_cond = function (n, env) {
    var self = this;
    var i = 0;
    function step() {
      if (i >= n.clauses.length) {
        return Promise.reject(new EL.CondClauseError('cond 没有任何条件为真（需要一个恒真的兜底分支）'));
      }
      var cl = n.clauses[i];
      return self.eval(cl.params[0], env).then(function (v) {
        if (R.isTruthy(v)) return self.eval(cl.body, env);
        i++;
        return step();
      });
    }
    return step();
  };

  Interp.prototype.eval_if = function (n, env) {
    var self = this;
    return this.eval(n.cond, env).then(function (c) {
      var truthy = R.isTruthy(c);
      var want = n.kind === 'if' ? truthy : !truthy;
      if (want) {
        return n.then ? self.eval(n.then, env) : Promise.resolve(NIL);
      }
      return n.otherwise ? self.eval(n.otherwise, env) : Promise.resolve(NIL);
    });
  };

  Interp.prototype.matchClauses = function (clauses, values, env, kind) {
    var self = this;
    var i = 0;
    function step() {
      if (i >= clauses.length) {
        if (kind === 'case') {
          throw new EL.CaseClauseError('case 没有任何分支匹配 ' + values.map(R.inspect).join(', '));
        }
        throw new EL.FunctionClauseError('没有匹配的子句：' + values.map(R.inspect).join(', '));
      }
      var cl = clauses[i];
      var cenv = new Env(env);
      return self.matchParams(cl.params, values, cenv).then(function (ok) {
        if (!ok) { i++; return step(); }
        if (cl.guard) {
          return self.eval(cl.guard, cenv).then(function (g) {
            if (!R.isTruthy(g)) { i++; return step(); }
            return self.eval(cl.body, cenv);
          });
        }
        return self.eval(cl.body, cenv);
      });
    }
    return step();
  };

  // ---------- for / with / try ----------
  Interp.prototype.eval_for = function (n, env) {
    var self = this;
    var results = [];
    function rec(gi, cenv) {
      if (gi >= n.generators.length) {
        return (function checkFilters(fi) {
          if (fi >= n.filters.length) {
            return self.eval(n.body, cenv).then(function (v) { results.push(v); });
          }
          return self.eval(n.filters[fi], cenv).then(function (ok) {
            if (!R.isTruthy(ok)) return Promise.resolve();
            return checkFilters(fi + 1);
          });
        })(0);
      }
      var gen = n.generators[gi];
      return self.eval(gen.source, cenv).then(function (src) {
        var items = R.toList(src);
        var i = 0;
        function nextItem() {
          if (i >= items.length) return Promise.resolve();
          var e2 = new Env(cenv);
          var ok = self.bindPattern(gen.pattern, items[i], e2);
          i++;
          if (!ok) return nextItem();
          return rec(gi + 1, e2).then(nextItem);
        }
        return nextItem();
      });
    }
    return rec(0, env).then(function () {
      if (n.into) {
        return self.eval(n.into, env).then(function (target) {
          if (Array.isArray(target)) return target.concat(results);
          if (target instanceof R.MapVal) {
            var m = target.clone();
            results.forEach(function (p) {
              if (p instanceof R.Tuple && p.items.length === 2) m.set(p.items[0], p.items[1]);
            });
            return m;
          }
          if (typeof target === 'string') return target + results.join('');
          return results;
        });
      }
      return results;
    });
  };

  Interp.prototype.eval_with = function (n, env) {
    var self = this;
    var i = 0;
    var cenv = new Env(env);
    function step() {
      if (i >= n.clauses.length) return self.eval(n.body, cenv);
      var cl = n.clauses[i];
      return self.eval(cl.source, cenv).then(function (v) {
        var ok = self.bindPattern(cl.pattern, v, cenv);
        if (!ok) {
          if (n.elseClauses && n.elseClauses.length) {
            return self.matchClauses(n.elseClauses, [v], env, 'else');
          }
          return Promise.resolve(v);
        }
        i++;
        return step();
      });
    }
    return step();
  };

  Interp.prototype.eval_try = function (n, env) {
    var self = this;
    return this.eval(n.body, env).then(null, function (err) {
      if (n.rescueClauses && n.rescueClauses.length) {
        var i = 0;
        function step() {
          if (i >= n.rescueClauses.length) throw err;
          var cl = n.rescueClauses[i];
          var cenv = new Env(env);
          var param = cl.params[0];
          var matches = true;
          if (param) {
            if (param.type === 'binop' && param.op === 'in') {
              var names = Array.isArray(param.right) ? param.right : [param.right];
              var okName = names.some(function (nm) {
                if (nm.type === 'alias' || nm.type === 'atom') {
                  return err.name === nm.name || (nm.name === 'RuntimeError' && err.name === 'RuntimeError');
                }
                return false;
              });
              var skip = (param.left && param.left.type === 'var' && param.left.name === '_');
              if (!okName && !skip) matches = false;
              if (param.left && param.left.type === 'var') cenv.bind(param.left.name, A('error'));
            } else if (param.type === 'var') {
              cenv.bind(param.name, A('error'));
            }
          }
          if (!matches) { i++; return step(); }
          return self.eval(cl.body, cenv);
        }
        return step();
      }
      throw err;
    }).then(function (v) {
      if (n.after) return self.eval(n.after, env).then(function () { return v; });
      return v;
    });
  };

  Interp.prototype.eval_raise = function (n, env) {
    var self = this;
    if (!n.arg) {
      return Promise.reject(new EL.RuntimeError('runtime error'));
    }
    return this.eval(n.arg, env).then(function (v) {
      if (n.kind === 'throw') throw new EL.ThrowValue(R.to_string(v));
      throw new EL.RuntimeError(typeof v === 'string' ? v : R.inspect(v));
    });
  };

  Interp.prototype.eval_guard_when = function (n, env) {
    return this.eval(n.left, env);
  };

  // ---------- 集合构造 ----------
  Interp.prototype.eval_list = function (n, env) {
    var self = this;
    var out = [];
    var i = 0;
    function step() {
      if (i >= n.elems.length) return Promise.resolve(out);
      var e = n.elems[i];
      if (e.type === 'binop' && e.op === '|') {
        return self.eval(e.left, env).then(function (h) {
          return self.eval(e.right, env).then(function (t) {
            if (!Array.isArray(t)) throw new EL.ArgumentError('[head | tail] 的 tail 必须是列表，得到 ' + R.inspect(t));
            out.push(h);
            out = out.concat(t);
            i++;
            return step();
          });
        });
      }
      return self.eval(e, env).then(function (v) { out.push(v); i++; return step(); });
    }
    return step();
  };

  Interp.prototype.eval_tuple = function (n, env) {
    var self = this;
    return this.evalArgs(n.elems, env).then(function (vals) { return new R.Tuple(vals); });
  };

  Interp.prototype.eval_kwpair = function (n, env) {
    var self = this;
    return this.eval(n.value, env).then(function (v) {
      return new R.Tuple([A(n.key.name), v]);
    });
  };

  Interp.prototype.eval_map = function (n, env) {
    var self = this;
    var m = new R.MapVal();
    var i = 0;
    function step() {
      if (i >= n.pairs.length) return Promise.resolve(m);
      var p = n.pairs[i];
      return self.eval(p.key, env).then(function (k) {
        return self.eval(p.value, env).then(function (v) {
          m.set(k, v);
          i++;
          return step();
        });
      });
    }
    return step();
  };

  Interp.prototype.eval_map_update = function (n, env) {
    var self = this;
    return this.eval(n.target, env).then(function (t) {
      // 结构体也支持 %{%User{} | name: ...} 这样的更新语法
      var isStruct = t instanceof R.Struct;
      if (!(t instanceof R.MapVal) && !isStruct) {
        throw new EL.ArgumentError('%{m | key: value} 要求 m 是映射或结构体');
      }
      var m = isStruct ? t.map.clone() : t.clone();
      var i = 0;
      function step() {
        if (i >= n.pairs.length) {
          return Promise.resolve(isStruct ? new R.Struct(t.module, m) : m);
        }
        var p = n.pairs[i];
        return self.eval(p.key, env).then(function (k) {
          if (!m.has(k)) throw new EL.KeyError('%{m | ...} 只能更新已存在的键：' + R.inspect(k));
          return self.eval(p.value, env).then(function (v) {
            m.set(k, v);
            i++;
            return step();
          });
        });
      }
      return step();
    });
  };

  Interp.prototype.eval_struct = function (n, env) {
    var self = this;
    var modName = this.resolveAlias(n.module);
    var mod = this.getModule(modName);
    var m = new R.MapVal();
    if (mod && mod.structFields) {
      mod.structFields.forEach(function (f) { m.set(A(f.name), f.default !== null ? f.default : NIL); });
    }
    var i = 0;
    function step() {
      if (i >= n.pairs.length) {
        return Promise.resolve(new R.Struct(modName, m));
      }
      var p = n.pairs[i];
      return self.eval(p.key, env).then(function (k) {
        return self.eval(p.value, env).then(function (v) {
          m.set(k, v);
          i++;
          return step();
        });
      });
    }
    return step();
  };

  Interp.prototype.eval_struct_var = function (n, env) {
    var self = this;
    return this.eval(n.target, env).then(function (s) {
      if (!(s instanceof R.Struct)) throw new EL.ArgumentError('%var{...} 要求变量是结构体');
      var m = s.map.clone();
      var i = 0;
      function step() {
        if (i >= n.pairs.length) return Promise.resolve(new R.Struct(s.module, m));
        var p = n.pairs[i];
        return self.eval(p.key, env).then(function (k) {
          return self.eval(p.value, env).then(function (v) {
            m.set(k, v);
            i++;
            return step();
          });
        });
      }
      return step();
    });
  };

  // ---------- 模块与函数定义 ----------
  Interp.prototype.eval_defmodule = function (n, env) {
    var self = this;
    var mod = new R.Module(n.name);
    mod.env = new Env(null);
    mod.imports = [];
    mod.aliases = {};
    this.modules[n.name] = mod;
    var saved = this.currentModule;
    this.currentModule = mod;
    var modEnv = new Env(null);
    mod.env = modEnv;
    return this.eval(n.body, modEnv).then(function () {
      self.currentModule = saved;
      return new R.Tuple([A('module'), A(n.name)]);
    }, function (e) {
      self.currentModule = saved;
      throw e;
    });
  };

  Interp.prototype.eval_def = function (n, env) {
    var mod = this.currentModule;
    if (!mod) throw new EL.ArgumentError('def 必须写在 defmodule 内部');
    var params = n.params || [];
    var arity = params.length;
    // 默认参数个数（尾部的）
    var firstDefault = -1;
    for (var i = 0; i < params.length; i++) {
      if (params[i].default !== null && params[i].default !== undefined) {
        if (firstDefault < 0) firstDefault = i;
      }
    }
    var maxArity = firstDefault >= 0 ? firstDefault : arity;
    var minArity = arity;
    if (firstDefault >= 0) minArity = firstDefault;

    var defaults = params.map(function (p) { return p.default; });
    var clause = {
      params: params.map(function (p) { return p; }),
      defaults: defaults,
      guard: n.guard,
      body: n.body,
      line: n.line
    };

    for (var a = minArity; a <= arity; a++) {
      var key = n.name + '/' + a;
      if (!mod.functions[key]) mod.functions[key] = [];
      var cl = {
        params: clause.params,
        defaults: defaults,
        defaultFrom: a,
        guard: clause.guard,
        body: clause.body,
        line: clause.line
      };
      mod.functions[key].push(cl);
    }
    return Promise.resolve(A(n.name));
  };

  Interp.prototype.eval_defstruct = function (n, env) {
    var mod = this.currentModule;
    if (!mod) throw new EL.ArgumentError('defstruct 必须写在 defmodule 内部');
    var self = this;
    var self = this;
    var fields = [];
    var i = 0;
    function step() {
      if (i >= n.fields.length) {
        mod.structFields = fields;
        return Promise.resolve(new R.MapVal());
      }
      var f = n.fields[i];
      if (f.default) {
        return self.eval(f.default, env).then(function (v) {
          fields.push({ name: f.name, default: v });
          i++;
          return step();
        });
      }
      fields.push({ name: f.name, default: NIL });
      i++;
      return step();
    }
    return step();
  };

  Interp.prototype.eval_attr_set = function (n, env) {
    var mod = this.currentModule;
    var self = this;
    return this.eval(n.value, env).then(function (v) {
      if (mod) mod.attributes[n.name] = v;
      env.bind('@' + n.name, v);
      return v;
    });
  };

  Interp.prototype.eval_attr_read = function (n, env) {
    var mod = this.currentModule;
    if (mod && (n.name in mod.attributes)) return Promise.resolve(mod.attributes[n.name]);
    var v = env.get('@' + n.name);
    return Promise.resolve(v === undefined ? NIL : v);
  };

  Interp.prototype.eval_directive = function (n, env) {
    var mod = this.currentModule;
    if (n.kind === 'import' && mod) {
      var self = this;
      n.args.forEach(function (a) {
        if (a.type === 'alias') mod.imports.push(a.name);
      });
    } else if (n.kind === 'alias' && mod) {
      n.args.forEach(function (a) {
        if (a.type === 'alias') {
          var full = a.name;
          var parts = full.split('.');
          mod.aliases[parts[parts.length - 1]] = full;
        }
      });
    }
    return Promise.resolve(NIL);
  };

  // ---------- 并发 ----------
  Interp.prototype.currentProcObj = function () {
    if (this.currentProc) return this.currentProc;
    // 主进程
    if (!this.mainProc) {
      this.mainProc = this.sched.newProc(null);
      this.mainProc.status = 'running';
    }
    return this.mainProc;
  };
  Interp.prototype.self = function () { return this.currentProcObj().pid; };

  Interp.prototype.sendTo = function (target, msg) {
    var pid = target;
    if (target instanceof R.Tuple && target.items[0] instanceof R.Pid) pid = target.items[0];
    else if (target instanceof R.Atom) pid = (this.sched.names[target.name] || target);
    var from = this.currentProcObj().pid;
    return this.sched.send(pid, msg, from);
  };
  Interp.prototype.send = function (pid, msg) { return this.sendTo(pid, msg); };

  Interp.prototype.registerName = function (nameAtom, pid) {
    if (nameAtom instanceof R.Atom) this.sched.names[nameAtom.name] = pid;
  };
  Interp.prototype.register = function (nameAtom, pid) { this.registerName(nameAtom, pid); return OK; };
  Interp.prototype.whereis = function (nameAtom) {
    if (!(nameAtom instanceof R.Atom)) return null;
    return this.sched.names[nameAtom.name] || null;
  };

  Interp.prototype.spawnRaw = function (runner) {
    var self = this;
    var parentPid = this.currentProcObj().pid;
    var proc = this.sched.newProc(parentPid);
    if (this.sched.closed) {
      // 已关停：直接返回一个死进程，不再启动新的后台循环
      proc.status = 'exited';
      proc.exitReason = A('shutdown');
      return proc;
    }
    var child = this.fork(proc);
    setTimeout(function () {
      var pr;
      // runner 可能同步抛错（例如关停后 tick 直接抛 ExitError），必须就地捕获
      try { pr = runner(proc, child); }
      catch (e) {
        proc.error = e;
        self.sched.exit(proc.pid, A(e && e.name ? e.name : 'error'));
        return;
      }
      Promise.resolve(pr).then(function () {
        self.sched.exit(proc.pid, A('normal'));
      }, function (e) {
        proc.error = e;
        self.sched.exit(proc.pid, A(e && e.name ? e.name : 'error'));
      });
    }, 0);
    return proc;
  };

  // 复制一个共享模块表但拥有独立进程上下文的解释器视图
  Interp.prototype.fork = function (proc) {
    var self = this;
    var child = Object.create(Interp.prototype);
    child.modules = this.modules;
    child.sched = this.sched;
    child.output = '';
    child.steps = 0;
    child.currentModule = null;
    child.currentProc = proc;
    child.deadline = this.deadline;
    child.mainProc = proc;
    child.supervisors = this.supervisors;
    child.parent = this;
    child.out = function (s) { self.output += s; };
    return child;
  };

  Interp.prototype.spawn = function (fn) {
    var proc = this.spawnRaw(function (p, child) {
      return child.applyFn(fn, []);
    });
    return proc.pid;
  };

  Interp.prototype.spawnModule = function (mod, fname, args) {
    var modRef = mod;
    var name = fname && fname.name ? fname.name : String(fname);
    var proc = this.spawnRaw(function (p, child) {
      return child.applyModule(modRef, name, R.toList(args));
    });
    return proc.pid;
  };

  Interp.prototype.sleep = function (ms) {
    return new Promise(function (resolve) {
      setTimeout(function () { resolve(OK); }, Math.min(ms, 2000));
    });
  };

  Interp.prototype.sendAfter = function (target, msg, ms) {
    var self = this;
    var from = this.currentProcObj().pid;
    setTimeout(function () { self.sched.send(target, msg, from); }, Math.min(ms, 2000));
    return new R.Tuple([OK, new R.Ref('t' + Math.random().toString(36).slice(2, 8))]);
  };

  Interp.prototype.alive = function (pid) {
    var p = this.sched.get(pid);
    return !!p && p.status === 'running';
  };
  Interp.prototype.exitProcess = function (pid, reason) {
    this.sched.exit(pid, reason || A('normal'));
  };
  Interp.prototype.listProcesses = function () {
    return this.sched.list().filter(function (p) { return p.status === 'running'; })
      .map(function (p) { return p.pid; });
  };
  Interp.prototype.processInfo = function (pid) {
    var p = this.sched.get(pid);
    var m = new R.MapVal();
    m.set(A('status'), A(p ? p.status : 'noproc'));
    m.set(A('messages'), p ? p.mailbox.length : 0);
    return m;
  };

  // 原始接收（OTP 内部循环使用）
  Interp.prototype.receiveRaw = function (proc, timeoutMs) {
    var self = this;
    function scan() {
      if (proc.mailbox.length) return proc.mailbox.shift();
      return null;
    }
    var msg = scan();
    if (msg !== null) return Promise.resolve(msg);
    if (proc.status !== 'running') return Promise.resolve(null);
    var wait = timeoutMs === null || timeoutMs === undefined ? 4000 : Math.min(timeoutMs, 4000);
    return new Promise(function (resolve) {
      var done = false;
      var waiter = function () {
        if (done) return;
        var m = scan();
        if (m !== null || proc.status !== 'running') {
          done = true;
          clearTimeout(timer);
          var i = proc.waiters.indexOf(waiter);
          if (i >= 0) proc.waiters.splice(i, 1);
          resolve(m);
        }
      };
      proc.waiters.push(waiter);
      var timer = setTimeout(function () {
        if (done) return;
        done = true;
        var i = proc.waiters.indexOf(waiter);
        if (i >= 0) proc.waiters.splice(i, 1);
        resolve(null);
      }, wait);
    });
  };

  // 等待 {ref, value} 形式的回复
  Interp.prototype.awaitReply = function (ref, timeout) {
    var self = this;
    var proc = this.currentProcObj();
    function scan() {
      for (var i = 0; i < proc.mailbox.length; i++) {
        var m = proc.mailbox[i];
        if (m instanceof R.Tuple && m.items.length === 2 && m.items[0] === ref) {
          proc.mailbox.splice(i, 1);
          return m.items[1];
        }
      }
      return null;
    }
    var v = scan();
    if (v !== null) return Promise.resolve(v);
    return new Promise(function (resolve, reject) {
      var done = false;
      var waiter = function () {
        if (done) return;
        var val = scan();
        if (val !== null) {
          done = true; clearTimeout(timer);
          var i = proc.waiters.indexOf(waiter);
          if (i >= 0) proc.waiters.splice(i, 1);
          resolve(val);
        }
      };
      proc.waiters.push(waiter);
      var timer = setTimeout(function () {
        if (done) return;
        done = true;
        var i = proc.waiters.indexOf(waiter);
        if (i >= 0) proc.waiters.splice(i, 1);
        reject(new EL.RuntimeError('等待回复超时（' + (timeout || 0) + 'ms），可能是目标进程没有响应'));
      }, Math.min(timeout || 3000, 4000));
    });
  };

  // receive 特殊形式
  Interp.prototype.eval_receive = function (n, env) {
    var self = this;
    var proc = this.currentProcObj();
    var timeoutMs = null;
    var afterBody = null;
    if (n.after && n.after.length) {
      var a = n.after[0];
      afterBody = a.body;
      timeoutMs = 0;
      if (a.params && a.params.length) {
        var self2 = this;
        return this.eval(a.params[0], env).then(function (t) {
          return doReceive(R.num(t), a.body);
        });
      }
    }
    return doReceive(timeoutMs, afterBody);

    function doReceive(timeout, after) {
      function scan() {
        for (var i = 0; i < proc.mailbox.length; i++) {
          var msg = proc.mailbox[i];
          for (var c = 0; c < n.clauses.length; c++) {
            var cl = n.clauses[c];
            var cenv = new Env(env);
            if (self.bindPattern(cl.params[0], msg, cenv)) {
              if (cl.guard) {
                // 同步守卫简化处理
              }
              proc.mailbox.splice(i, 1);
              return { clause: cl, env: cenv };
            }
          }
        }
        return null;
      }
      var found = scan();
      if (found) return self.eval(found.clause.body, found.env);
      if (after) {
        // 有 after：等待超时
        return self.receiveRaw(proc, timeout).then(function (m) {
          if (m !== null) {
            // 重新扫描（push 回去）
            proc.mailbox.unshift(m);
            var f2 = scan();
            if (f2) return self.eval(f2.clause.body, f2.env);
          }
          return self.eval(after, env);
        });
      }
      // 顶层已结束：不再傻等消息，直接退出
      if (self.sched.closed) throw new EL.ExitError('shutdown');
      // 无 after：等待消息
      return self.receiveRaw(proc, 2000).then(function (m) {
        if (m === null) {
          throw new EL.RuntimeError('receive 超时：没有收到任何消息');
        }
        proc.mailbox.unshift(m);
        var f3 = scan();
        if (!f3) throw new EL.RuntimeError('receive 收到消息但没有匹配的分支：' + R.inspect(m));
        return self.eval(f3.clause.body, f3.env);
      });
    }
  };

  // ---------- put_in / update_in ----------
  Interp.prototype.nested_update = function (data, keys, fn) {
    var self = this;
    var ks = R.toList(keys);
    function rec(cur, i) {
      if (i >= ks.length) return Promise.resolve(fn(cur));
      var k = ks[i];
      var child = (cur instanceof R.MapVal) ? cur.get(k) : NIL;
      return rec(child, i + 1).then(function (nv) {
        if (cur instanceof R.MapVal) {
          var m = cur.clone();
          m.set(k, nv);
          return m;
        }
        return nv;
      });
    }
    return rec(data, 0);
  };

  Interp.prototype.struct_new = function (modRef, data) {
    var name = modRef instanceof R.Atom ? modRef.name : String(modRef);
    var mod = this.getModule(name);
    var m = new R.MapVal();
    if (mod && mod.structFields) {
      mod.structFields.forEach(function (f) { m.set(A(f.name), NIL); });
    }
    if (data instanceof R.MapVal) {
      data.pairs().forEach(function (p) {
        if (p[0] instanceof R.Atom) m.set(p[0], p[1]);
      });
    } else if (Array.isArray(data)) {
      data.forEach(function (p) {
        if (p instanceof R.Tuple && p.items[0] instanceof R.Atom) m.set(p.items[0], p.items[1]);
      });
    }
    return new R.Struct(name, m);
  };

  // ---------- 运行入口 ----------
  Interp.prototype.run = function (src, env) {
    var self = this;
    env = env || new Env(null);
    this.steps = 0;
    this.sched.closed = false;
    var ast;
    try {
      ast = EL.parse(src);
    } catch (e) {
      return Promise.resolve({ ok: false, error: e, output: '', result: null, env: env });
    }
    var i = 0, last = NIL;
    function done(res) {
      // 收尾：停掉所有后台进程（GenServer / Supervisor / Agent 的循环）
      try { self.sched.shutdown(); } catch (e) { }
      return res;
    }
    function step() {
      if (i >= ast.exprs.length) {
        return Promise.resolve({ ok: true, output: self.output, result: last, env: env, error: null });
      }
      return self.eval(ast.exprs[i], env).then(function (v) { last = v; i++; return step(); });
    }
    return step().then(function (r) { return done(r); }, function (e) {
      return done({ ok: false, output: self.output, result: null, env: env, error: e });
    });
  };

  EL.createInterp = function (opts) { return new Interp(opts); };

})(typeof window !== 'undefined' ? window : globalThis);
