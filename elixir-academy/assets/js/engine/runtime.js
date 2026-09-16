/*
 * Elixir 运行时：值的表示、inspect、相等性与排序
 */
(function (global) {
  'use strict';

  var EL = global.EL || (global.EL = {});
  var R = EL.R = {};

  // ---------- 值类型 ----------
  function Atom(name) { this.name = name; }
  Atom.prototype.__atom = true;
  R.Atom = Atom;

  function FloatVal(v) { this.v = v; }
  FloatVal.prototype.__float = true;
  R.FloatVal = FloatVal;

  function Tuple(items) { this.items = items; }
  Tuple.prototype.__tuple = true;
  R.Tuple = Tuple;

  function Struct(module, map) { this.module = module; this.map = map; }
  Struct.prototype.__struct = true;
  R.Struct = Struct;

  function Fn(opts) {
    this.clauses = opts.clauses || [];
    this.arity = opts.arity;
    this.env = opts.env || null;
    this.name = opts.name || null;
    this.module = opts.module || null;
    this.kind = opts.kind || 'anon';
    this.defaults = opts.defaults || null;
    this.captured = !!opts.captured;
    this.body = opts.body || null;
  }
  Fn.prototype.__fn = true;
  R.Fn = Fn;

  function Pid(id) { this.id = id; }
  Pid.prototype.__pid = true;
  R.Pid = Pid;

  function Ref(id) { this.id = id; }
  Ref.prototype.__ref = true;
  R.Ref = Ref;

  function Range(first, last, step) { this.first = first; this.last = last; this.step = step === undefined ? 1 : step; }
  Range.prototype.__range = true;
  R.Range = Range;

  // 模块容器
  function Module(name) {
    this.name = name;
    this.functions = {};      // "name/arity" -> [clause]
    this.attributes = {};
    this.structFields = null;
    this.exportsAll = true;
  }
  R.Module = Module;

  // ---------- 常量 ----------
  var TRUE = new Atom('true'), FALSE = new Atom('false'), NIL = new Atom('nil');
  R.TRUE = TRUE; R.FALSE = FALSE; R.NIL = NIL;

  var ATOM_CACHE = Object.create(null);
  function atom(name) {
    if (name === 'true') return TRUE;
    if (name === 'false') return FALSE;
    if (name === 'nil') return NIL;
    var a = ATOM_CACHE[name];
    if (!a) { a = new Atom(name); ATOM_CACHE[name] = a; }
    return a;
  }
  R.atom = atom;
  R.ATOM_CACHE = ATOM_CACHE;

  function toBool(js) { return js ? TRUE : FALSE; }
  R.toBool = toBool;
  R.isTruthy = function (v) { return v !== FALSE && v !== NIL; };

  // ---------- 类型判断 ----------
  R.isInt = function (v) { return typeof v === 'number' && Number.isInteger(v); };
  R.isFloat = function (v) { return v instanceof FloatVal; };
  R.isNumber = function (v) { return typeof v === 'number' || v instanceof FloatVal; };
  R.isAtom = function (v) { return v instanceof Atom; };
  R.isBinary = function (v) { return typeof v === 'string'; };
  R.isList = function (v) { return Array.isArray(v); };
  R.isTuple = function (v) { return v instanceof Tuple; };
  R.isMap = function (v) { return v instanceof MapVal || v instanceof Struct; };
  R.isStruct = function (v) { return v instanceof Struct; };
  R.isFn = function (v) { return v instanceof Fn; };
  R.isPid = function (v) { return v instanceof Pid; };
  R.isRange = function (v) { return v instanceof Range; };

  R.num = function (v) { return v instanceof FloatVal ? v.v : v; };
  R.mkFloat = function (n) { return new FloatVal(n); };

  // ---------- Map ----------
  function MapVal() { this.m = new Map(); }
  MapVal.prototype.__map = true;
  R.MapVal = MapVal;

  function canonKey(v) {
    if (typeof v === 'number') return 'n:' + v;
    if (v instanceof FloatVal) return 'f:' + v.v;
    if (typeof v === 'string') return 's:' + v.length + ':' + v;
    if (v instanceof Atom) return 'a:' + v.name;
    if (v instanceof Tuple) return 't:' + v.items.map(canonKey).join(',');
    if (Array.isArray(v)) return 'l:' + v.map(canonKey).join(',');
    if (v instanceof MapVal) {
      var ks = [];
      v.m.forEach(function (val, k) { ks.push(k); });
      ks.sort();
      return 'm:' + ks.join(',');
    }
    if (v instanceof Pid) return 'p:' + v.id;
    return 'o:' + String(v);
  }
  R.canonKey = canonKey;

  MapVal.prototype.get = function (k) {
    var e = this.m.get(canonKey(k));
    return e ? e.v : undefined;
  };
  MapVal.prototype.set = function (k, v) {
    var ck = canonKey(k);
    var e = this.m.get(ck);
    if (e) e.v = v; else this.m.set(ck, { k: k, v: v });
    return this;
  };
  MapVal.prototype.delete = function (k) { this.m.delete(canonKey(k)); return this; };
  MapVal.prototype.has = function (k) { return this.m.has(canonKey(k)); };
  MapVal.prototype.size = function () { return this.m.size; };
  MapVal.prototype.pairs = function () {
    var out = [];
    this.m.forEach(function (e) { out.push([e.k, e.v]); });
    return out;
  };
  MapVal.prototype.clone = function () {
    var m = new MapVal();
    this.m.forEach(function (e, k) { m.m.set(k, { k: e.k, v: e.v }); });
    return m;
  };

  function newMap(pairs) {
    var m = new MapVal();
    for (var i = 0; i < (pairs || []).length; i++) m.set(pairs[i][0], pairs[i][1]);
    return m;
  }
  R.newMap = newMap;

  function mapOf(o) {
    // 从 JS 对象快速构造（键为原子名）
    var m = new MapVal();
    for (var k in o) m.set(atom(k), o[k]);
    return m;
  }
  R.mapOf = mapOf;

  // ---------- inspect ----------
  function escapeStr(s) {
    return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
      .replace(/\n/g, '\\n').replace(/\t/g, '\\t').replace(/\r/g, '\\r');
  }

  function isPrintableList(arr) {
    if (!arr.length) return true;
    for (var i = 0; i < arr.length; i++) {
      var c = arr[i];
      if (typeof c !== 'number' || c < 32 || c > 126) return false;
    }
    return true;
  }

  function atomInspect(a) {
    if (a === NIL) return 'nil';
    if (a === TRUE) return 'true';
    if (a === FALSE) return 'false';
    if (/^[a-zA-Z_][a-zA-Z0-9_@]*[!?]?$/.test(a.name)) return ':' + a.name;
    return ':' + escapeStr(a.name).replace(/^:/, '');
  }
  R.atomInspect = atomInspect;

  function inspect(v, depth) {
    depth = depth || 0;
    if (v === null || v === undefined) return 'nil';
    if (typeof v === 'number') return String(v);
    if (v instanceof FloatVal) return Number.isInteger(v.v) ? v.v.toFixed(1) : String(v.v);
    if (typeof v === 'string') return '"' + escapeStr(v) + '"';
    if (v instanceof Atom) return atomInspect(v);
    if (v instanceof Pid) return '#PID<' + v.id + '>';
    if (v instanceof Ref) return '#Reference<' + v.id + '>';
    if (v instanceof Range) {
      var r = inspect(v.first) + '..' + inspect(v.last);
      if (v.step !== 1) r += '//' + v.step;
      return r;
    }
    if (v instanceof Fn) {
      return '#Function<' + (v.arity || 0) + '/' + (v.arity || 0) + '>';
    }
    if (Array.isArray(v)) {
      if (v.__charlist) {
        var s = v.map(function (c) { return String.fromCharCode(c); }).join('');
        return "'" + s.replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'";
      }
      if (depth > 8) return '[...]';
      if (v.length && R.isKeyword(v)) {
        return '[' + v.map(function (e) {
          return atomInspect(e.items[0]).slice(1) + ': ' + inspect(e.items[1], depth + 1);
        }).join(', ') + ']';
      }
      return '[' + v.map(function (x) { return inspect(x, depth + 1); }).join(', ') + ']';
    }
    if (v instanceof Tuple) {
      if (depth > 8) return '{...}';
      return '{' + v.items.map(function (x) { return inspect(x, depth + 1); }).join(', ') + '}';
    }
    if (v instanceof Struct) {
      var mname = typeof v.module === 'string' ? v.module : (v.module && v.module.name) || 'Struct';
      return '%' + mname + '{' + mapBody(v.map, depth) + '}';
    }
    if (v instanceof MapVal) {
      if (v.m.size === 0) return '%{}';
      return '%{' + mapBody(v, depth) + '}';
    }
    return String(v);
  }
  R.inspect = inspect;

  function mapBody(m, depth) {
    var ps = m.pairs();
    var allAtoms = ps.every(function (p) { return p[0] instanceof Atom; });
    if (allAtoms) {
      ps.sort(function (a, b) { return a[0].name < b[0].name ? -1 : (a[0].name > b[0].name ? 1 : 0); });
      return ps.map(function (p) {
        return atomInspect(p[0]).slice(1) + ': ' + inspect(p[1], depth + 1);
      }).join(', ');
    }
    return ps.map(function (p) {
      return inspect(p[0], depth + 1) + ' => ' + inspect(p[1], depth + 1);
    }).join(', ');
  }

  // ---------- to_string ----------
  function to_string(v) {
    if (typeof v === 'string') return v;
    if (typeof v === 'number') return String(v);
    if (v instanceof FloatVal) return String(v.v);
    if (v instanceof Atom) {
      if (v === NIL) return '';
      return v.name;
    }
    if (Array.isArray(v)) {
      if (v.__charlist) return v.map(function (c) { return String.fromCharCode(c); }).join('');
      return inspect(v);
    }
    if (v instanceof Tuple || v instanceof MapVal || v instanceof Struct) return inspect(v);
    if (v instanceof Pid) return inspect(v);
    return inspect(v);
  }
  R.to_string = to_string;

  // ---------- 相等性 ----------
  function strictEquals(a, b) {
    if (typeof a === 'number' && typeof b === 'number') return a === b;
    if (a instanceof FloatVal || b instanceof FloatVal) {
      if (a instanceof FloatVal && b instanceof FloatVal) return a.v === b.v;
      return false; // 1 !== 1.0
    }
    if (typeof a === 'string' && typeof b === 'string') return a === b;
    if (a instanceof Atom && b instanceof Atom) return a === b;
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false;
      for (var i = 0; i < a.length; i++) if (!strictEquals(a[i], b[i])) return false;
      return true;
    }
    if (a instanceof Tuple && b instanceof Tuple) {
      if (a.items.length !== b.items.length) return false;
      for (var j = 0; j < a.items.length; j++) if (!strictEquals(a.items[j], b.items[j])) return false;
      return true;
    }
    if (a instanceof MapVal && b instanceof MapVal) {
      if (a.m.size !== b.m.size) return false;
      var ok = true;
      a.m.forEach(function (e) {
        if (!ok) return;
        var oe = b.m.get(canonKey(e.k));
        if (!oe || !strictEquals(e.v, oe.v)) ok = false;
      });
      return ok;
    }
    if (a instanceof Struct && b instanceof Struct) {
      return a.module === b.module && strictEquals(a.map, b.map);
    }
    return a === b;
  }

  function looseEquals(a, b) {
    if (R.isNumber(a) && R.isNumber(b)) return R.num(a) === R.num(b);
    return strictEquals(a, b);
  }
  R.strictEquals = strictEquals;
  R.looseEquals = looseEquals;

  // ---------- 排序（Elixir 全序） ----------
  function typeOrder(v) {
    if (typeof v === 'number' || v instanceof FloatVal) return 0;
    if (v instanceof Atom) return 1;
    if (v instanceof Ref) return 2;
    if (v instanceof Fn) return 3;
    if (v instanceof Pid) return 4;
    if (v instanceof Tuple) return 5;
    if (v instanceof MapVal || v instanceof Struct) return 6;
    if (Array.isArray(v)) return 7;
    return 8;
  }

  function compare(a, b) {
    var ta = typeOrder(a), tb = typeOrder(b);
    if (ta !== tb) return ta < tb ? -1 : 1;
    switch (ta) {
      case 0: { var x = R.num(a), y = R.num(b); return x < y ? -1 : (x > y ? 1 : 0); }
      case 1: return a.name < b.name ? -1 : (a.name > b.name ? 1 : 0);
      case 2: case 3: case 4: return 0;
      case 5: {
        var n = Math.min(a.items.length, b.items.length);
        for (var i = 0; i < n; i++) {
          var c = compare(a.items[i], b.items[i]);
          if (c !== 0) return c;
        }
        return a.items.length - b.items.length;
      }
      case 6: {
        var pa = (a instanceof Struct ? a.map : a).pairs().sort(function (p, q) { return compare(p[0], q[0]); });
        var pb = (b instanceof Struct ? b.map : b).pairs().sort(function (p, q) { return compare(p[0], q[0]); });
        var m = Math.min(pa.length, pb.length);
        for (var j = 0; j < m; j++) {
          var ck = compare(pa[j][0], pb[j][0]);
          if (ck !== 0) return ck;
          var cv = compare(pa[j][1], pb[j][1]);
          if (cv !== 0) return cv;
        }
        return pa.length - pb.length;
      }
      case 7: {
        var l = Math.min(a.length, b.length);
        for (var k = 0; k < l; k++) {
          var cc = compare(a[k], b[k]);
          if (cc !== 0) return cc;
        }
        return a.length - b.length;
      }
    }
    return 0;
  }
  R.compare = compare;

  // ---------- 可枚举协议 ----------
  R.toList = function (v) {
    if (Array.isArray(v)) return v.slice();
    if (v instanceof Range) {
      var out = [];
      if (v.step > 0) { for (var i = v.first; i <= v.last; i += v.step) out.push(i); }
      else if (v.step < 0) { for (var j = v.first; j >= v.last; j += v.step) out.push(j); }
      return out;
    }
    if (v instanceof MapVal) return v.pairs();
    if (v instanceof Struct) return v.map.pairs();
    if (typeof v === 'string') return v.split('');
    if (v instanceof Atom && v === NIL) return [];
    throw new EL.ProtocolError('无法把 ' + inspect(v) + ' 当作可枚举对象（Enumerable 协议未实现）');
  };

  // ---------- 错误类型 ----------
  function makeError(name, message) {
    function E(message) {
      this.name = name;
      this.message = message;
      this.elixir = true;
      this.stack = (new Error()).stack;
    }
    E.prototype = Object.create(Error.prototype);
    E.prototype.constructor = E;
    E.prototype.toString = function () { return this.name + ': ' + this.message; };
    return E;
  }

  EL.RuntimeError = makeError('RuntimeError', '');
  EL.MatchError = makeError('MatchError', '');
  EL.FunctionClauseError = makeError('FunctionClauseError', '');
  EL.ArithmeticError = makeError('ArithmeticError', '');
  EL.ArgumentError = makeError('ArgumentError', '');
  EL.UndefinedFunctionError = makeError('UndefinedFunctionError', '');
  EL.KeyError = makeError('KeyError', '');
  EL.CaseClauseError = makeError('CaseClauseError', '');
  EL.CondClauseError = makeError('CondClauseError', '');
  EL.ProtocolError = makeError('Protocol.UndefinedError', '');
  EL.ThrowValue = makeError('Throw', '');
  EL.ExitError = makeError('Exit', '');

  R.raiseRuntimeError = function (msg) { throw new EL.RuntimeError(msg); };
  R.raiseMatch = function (msg) { throw new EL.MatchError(msg); };
  R.raiseArgument = function (msg) { throw new EL.ArgumentError(msg); };

  // ---------- 关键字列表工具 ----------
  R.isKeyword = function (list) {
    if (!Array.isArray(list)) return false;
    for (var i = 0; i < list.length; i++) {
      var e = list[i];
      if (!(e instanceof Tuple) || e.items.length !== 2 || !(e.items[0] instanceof Atom)) return false;
    }
    return true;
  };
  R.keywordGet = function (list, key, dflt) {
    if (!Array.isArray(list)) return dflt;
    for (var i = 0; i < list.length; i++) {
      var e = list[i];
      if (e instanceof Tuple && e.items.length === 2 && e.items[0] instanceof Atom &&
        e.items[0].name === key) return e.items[1];
    }
    return dflt;
  };

})(typeof window !== 'undefined' ? window : globalThis);
