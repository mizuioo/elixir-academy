/*
 * 内置模块：Kernel / IO / Enum / List / Map / String / Integer / Float / Process ...
 * 内置函数签名：(args, I) => value | Promise
 * I 提供：applyFn(fn, args)、out(text)、rangeToList 等运行时能力
 */
(function (global) {
  'use strict';

  var EL = global.EL || (global.EL = {});
  var R = EL.R;
  var B = EL.BUILTINS = {};

  function A(name) { return R.atom(name); }
  var OK = A('ok'), ERROR = A('error'), NIL = R.NIL;

  function n1(v) { return R.num(v); }
  function needNum(v, who) {
    if (!R.isNumber(v)) throw new EL.ArithmeticError(who + ' 需要数字，得到 ' + R.inspect(v));
  }

  // 取可选参数（关键字列表）
  function opt(args, index, key, dflt) {
    var v = args[index];
    if (v === undefined) return dflt;
    if (Array.isArray(v)) return R.keywordGet(v, key, dflt);
    return v;
  }

  // ---------- Kernel ----------
  var Kernel = B.Kernel = {};

  Kernel['abs/1'] = function (a) { needNum(a[0], 'abs/1'); return Math.abs(n1(a[0])); };
  Kernel['min/2'] = function (a) { return R.compare(a[0], a[1]) <= 0 ? a[0] : a[1]; };
  Kernel['max/2'] = function (a) { return R.compare(a[0], a[1]) >= 0 ? a[0] : a[1]; };
  Kernel['rem/2'] = function (a) {
    needNum(a[0], 'rem/2'); needNum(a[1], 'rem/2');
    var d = n1(a[1]);
    if (d === 0) throw new EL.ArithmeticError('rem/2 的除数不能为 0');
    return n1(a[0]) % d;
  };
  Kernel['div/2'] = function (a) {
    needNum(a[0], 'div/2'); needNum(a[1], 'div/2');
    var d = n1(a[1]);
    if (d === 0) throw new EL.ArithmeticError('div/2 的除数不能为 0');
    return Math.floor(n1(a[0]) / d);
  };
  Kernel['trunc/1'] = function (a) { needNum(a[0], 'trunc/1'); return Math.trunc(n1(a[0])); };
  Kernel['round/1'] = function (a) { needNum(a[0], 'round/1'); return Math.round(n1(a[0])); };
  Kernel['floor/1'] = function (a) { needNum(a[0], 'floor/1'); return Math.floor(n1(a[0])); };
  Kernel['ceil/1'] = function (a) { needNum(a[0], 'ceil/1'); return Math.ceil(n1(a[0])); };

  Kernel['is_integer/1'] = function (a) { return R.toBool(R.isInt(a[0])); };
  Kernel['is_float/1'] = function (a) { return R.toBool(R.isFloat(a[0])); };
  Kernel['is_number/1'] = function (a) { return R.toBool(R.isNumber(a[0])); };
  Kernel['is_atom/1'] = function (a) { return R.toBool(R.isAtom(a[0])); };
  Kernel['is_boolean/1'] = function (a) { return R.toBool(a[0] === R.TRUE || a[0] === R.FALSE); };
  Kernel['is_nil/1'] = function (a) { return R.toBool(a[0] === NIL); };
  Kernel['is_binary/1'] = function (a) { return R.toBool(typeof a[0] === 'string'); };
  Kernel['is_bitstring/1'] = Kernel['is_binary/1'];
  Kernel['is_list/1'] = function (a) { return R.toBool(Array.isArray(a[0])); };
  Kernel['is_tuple/1'] = function (a) { return R.toBool(a[0] instanceof R.Tuple); };
  Kernel['is_map/1'] = function (a) { return R.toBool(a[0] instanceof R.MapVal); };
  Kernel['is_struct/1'] = function (a) { return R.toBool(a[0] instanceof R.Struct); };
  Kernel['is_function/1'] = function (a) { return R.toBool(a[0] instanceof R.Fn); };
  Kernel['is_function/2'] = function (a) {
    return R.toBool(a[0] instanceof R.Fn && a[0].arity === n1(a[1]));
  };
  Kernel['is_pid/1'] = function (a) { return R.toBool(a[0] instanceof R.Pid); };
  Kernel['is_reference/1'] = function (a) { return R.toBool(a[0] instanceof R.Ref); };

  Kernel['length/1'] = function (a) {
    if (!Array.isArray(a[0])) throw new EL.ArgumentError('length/1 需要列表');
    return a[0].length;
  };
  Kernel['hd/1'] = function (a) {
    if (!Array.isArray(a[0]) || a[0].length === 0) throw new EL.ArgumentError('hd/1 需要非空列表');
    return a[0][0];
  };
  Kernel['tl/1'] = function (a) {
    if (!Array.isArray(a[0]) || a[0].length === 0) throw new EL.ArgumentError('tl/1 需要非空列表');
    return a[0].slice(1);
  };
  Kernel['elem/2'] = function (a) {
    if (!(a[0] instanceof R.Tuple)) throw new EL.ArgumentError('elem/2 需要元组');
    var i = n1(a[1]);
    if (i < 0 || i >= a[0].items.length) throw new EL.ArgumentError('elem/2 索引越界');
    return a[0].items[i];
  };
  Kernel['put_elem/3'] = function (a) {
    if (!(a[0] instanceof R.Tuple)) throw new EL.ArgumentError('put_elem/3 需要元组');
    var items = a[0].items.slice();
    items[n1(a[1])] = a[2];
    return new R.Tuple(items);
  };
  Kernel['tuple_size/1'] = function (a) {
    if (!(a[0] instanceof R.Tuple)) throw new EL.ArgumentError('tuple_size/1 需要元组');
    return a[0].items.length;
  };
  Kernel['map_size/1'] = function (a) {
    if (!(a[0] instanceof R.MapVal)) throw new EL.ArgumentError('map_size/1 需要映射');
    return a[0].size();
  };
  Kernel['inspect/1'] = function (a) { return R.inspect(a[0]); };
  Kernel['inspect/2'] = function (a) { return R.inspect(a[0]); };
  Kernel['to_string/1'] = function (a) { return R.to_string(a[0]); };
  Kernel['struct/1'] = function (a) {
    if (a[0] instanceof R.Struct) return a[0].map.clone();
    if (a[0] instanceof R.MapVal) return a[0];
    return a[0];
  };
  Kernel['struct/2'] = function (a, I) { return I.struct_new(a[0], a[1]); };
  Kernel['raise/1'] = function (a) {
    throw new EL.RuntimeError(typeof a[0] === 'string' ? a[0] : R.inspect(a[0]));
  };
  Kernel['raise/2'] = function (a) { throw new EL.RuntimeError(R.to_string(a[1])); };
  Kernel['self/0'] = function (a, I) { return I.self(); };
  Kernel['spawn/1'] = function (a, I) { return I.spawn(a[0]); };
  Kernel['spawn/3'] = function (a, I) { return I.spawnModule(a[0], a[1], a[2]); };
  Kernel['send/2'] = function (a, I) { I.send(a[0], a[1]); return a[1]; };
  Kernel['apply/2'] = function (a, I) { return I.applyFn(a[0], R.toList(a[1])); };
  Kernel['apply/3'] = function (a, I) { return I.applyModule(a[0], a[1], R.toList(a[2])); };
  Kernel['then/2'] = function (a, I) { return I.applyFn(a[1], [a[0]]); };
  Kernel['tap/2'] = function (a, I) { I.applyFn(a[1], [a[0]]); return a[0]; };
  Kernel['get_in/2'] = function (a) {
    var cur = a[0], keys = R.toList(a[1]);
    for (var i = 0; i < keys.length; i++) {
      if (cur === NIL || cur === undefined) return NIL;
      if (cur instanceof R.MapVal) cur = cur.get(keys[i]);
      else if (Array.isArray(keys[i]) === false && Array.isArray(cur)) cur = cur[n1(keys[i])];
      else cur = NIL;
    }
    return cur === undefined ? NIL : cur;
  };
  Kernel['put_in/2'] = function (a, I) { return I.nested_update(a[0], a[1], function () { return a[2]; }); };
  Kernel['update_in/3'] = function (a, I) { return I.nested_update(a[0], a[1], function (old) { return I.applyFn(a[2], [old]); }); };
  Kernel['exit/1'] = function (a) { throw new EL.ExitError(R.to_string(a[0])); };
  Kernel['binding/0'] = function () { return []; };

  // ---------- IO ----------
  var IO = B.IO = {};
  function iodataToStr(v) {
    if (typeof v === 'string') return v;
    if (typeof v === 'number') return String(v);
    if (v instanceof R.FloatVal) return String(v.v);
    if (v instanceof R.Atom) return v === NIL ? '' : v.name;
    if (Array.isArray(v)) return v.map(iodataToStr).join('');
    return R.to_string(v);
  }
  IO['puts/1'] = function (a, I) {
    I.out(iodataToStr(a[0]) + '\n');
    return OK;
  };
  IO['puts/2'] = IO['puts/1'];
  IO['write/1'] = function (a, I) { I.out(iodataToStr(a[0])); return OK; };
  IO['write/2'] = IO['write/1'];
  IO['inspect/1'] = function (a, I) { I.out(R.inspect(a[0]) + '\n'); return a[0]; };
  IO['inspect/2'] = function (a, I) {
    I.out(R.inspect(a[0]) + '\n');
    return a[0];
  };
  IO['inspect/3'] = IO['inspect/2'];
  IO['iodata_to_binary/1'] = function (a) { return iodataToStr(a[0]); };
  IO['gets/1'] = function (a, I) { return NIL; };
  IO['read/2'] = function () { return A('eof'); };

  // ---------- Enum ----------
  var Enum = B.Enum = {};
  function toListSafe(v) { return R.toList(v); }

  Enum['to_list/1'] = function (a) { return toListSafe(a[0]); };
  Enum['map/2'] = async function (a, I) {
    var list = toListSafe(a[0]);
    var out = [];
    for (var i = 0; i < list.length; i++) out.push(await I.applyFn(a[1], [list[i]]));
    return out;
  };
  Enum['each/2'] = async function (a, I) {
    var list = toListSafe(a[0]);
    for (var i = 0; i < list.length; i++) await I.applyFn(a[1], [list[i]]);
    return OK;
  };
  Enum['filter/2'] = async function (a, I) {
    var list = toListSafe(a[0]);
    var out = [];
    for (var i = 0; i < list.length; i++) {
      if (R.isTruthy(await I.applyFn(a[1], [list[i]]))) out.push(list[i]);
    }
    return out;
  };
  Enum['reject/2'] = async function (a, I) {
    var list = toListSafe(a[0]);
    var out = [];
    for (var i = 0; i < list.length; i++) {
      if (!R.isTruthy(await I.applyFn(a[1], [list[i]]))) out.push(list[i]);
    }
    return out;
  };
  Enum['reduce/2'] = async function (a, I) {
    var list = toListSafe(a[0]);
    if (list.length === 0) throw new EL.ArgumentError('Enum.reduce/2 不能用于空集合');
    var acc = list[0];
    for (var i = 1; i < list.length; i++) acc = await I.applyFn(a[1], [list[i], acc]);
    return acc;
  };
  Enum['reduce/3'] = async function (a, I) {
    var list = toListSafe(a[0]);
    var acc = a[1];
    for (var i = 0; i < list.length; i++) acc = await I.applyFn(a[2], [list[i], acc]);
    return acc;
  };
  Enum['reduce_while/3'] = async function (a, I) {
    var list = toListSafe(a[0]);
    var acc = a[1];
    for (var i = 0; i < list.length; i++) {
      var res = await I.applyFn(a[2], [list[i], acc]);
      if (res instanceof R.Tuple) {
        if (res.items[0] && res.items[0].name === 'halt') return res.items[1];
        if (res.items[0] && res.items[0].name === 'cont') { acc = res.items[1]; continue; }
      }
      acc = res;
    }
    return acc;
  };
  Enum['sum/1'] = function (a) {
    return toListSafe(a[0]).reduce(function (s, x) {
      needNum(x, 'Enum.sum/1');
      return R.isFloat(s) ? new R.FloatVal(s.v + n1(x)) : (R.isFloat(x) ? new R.FloatVal(n1(s) + x.v) : s + x);
    }, 0);
  };
  Enum['count/1'] = function (a) { return toListSafe(a[0]).length; };
  Enum['count/2'] = async function (a, I) {
    return (await Enum['filter/2'](a, I)).length;
  };
  Enum['join/1'] = function (a) { return toListSafe(a[0]).map(R.to_string).join(''); };
  Enum['join/2'] = function (a) { return toListSafe(a[0]).map(R.to_string).join(R.to_string(a[1])); };
  Enum['map_join/2'] = async function (a, I) {
    return (await Enum['map/2']([a[0], a[1]], I)).map(R.to_string).join('');
  };
  Enum['map_join/3'] = async function (a, I) {
    return (await Enum['map/2']([a[0], a[1]], I)).map(R.to_string).join(R.to_string(a[2]));
  };
  Enum['sort/1'] = function (a) {
    return toListSafe(a[0]).slice().sort(R.compare);
  };
  Enum['sort/2'] = async function (a, I) {
    var list = toListSafe(a[0]).slice();
    if (a[1] instanceof R.Atom) {
      var dir = a[1].name;
      list.sort(R.compare);
      return dir === 'desc' ? list.reverse() : list;
    }
    // 自定义比较函数：fun.(a, b) 为真表示 a 排在 b 前面（插入排序）
    for (var i = 1; i < list.length; i++) {
      var key = list[i];
      var j = i - 1;
      while (j >= 0) {
        var before = await I.applyFn(a[1], [list[j], key]);
        if (!R.isTruthy(before)) break;
        list[j + 1] = list[j];
        j--;
      }
      list[j + 1] = key;
    }
    return list;
  };
  Enum['sort_by/2'] = async function (a, I) {
    var list = toListSafe(a[0]).slice();
    var sorter = a[2] || null;
    var keyed = [];
    for (var i = 0; i < list.length; i++) keyed.push({ v: list[i], k: await I.applyFn(a[1], [list[i]]) });
    keyed.sort(function (p, q) {
      var c = R.compare(p.k, q.k);
      if (c !== 0) return c;
      return 0;
    });
    var out = keyed.map(function (p) { return p.v; });
    if (sorter && sorter.name === 'desc') out.reverse();
    return out;
  };
  Enum['sort_by/3'] = Enum['sort_by/2'];
  Enum['uniq/1'] = function (a) {
    var seen = new Set(), out = [];
    toListSafe(a[0]).forEach(function (x) {
      var k = R.canonKey(x);
      if (!seen.has(k)) { seen.add(k); out.push(x); }
    });
    return out;
  };
  Enum['uniq_by/2'] = async function (a, I) {
    var list = toListSafe(a[0]);
    var seen = new Set(), out = [];
    for (var i = 0; i < list.length; i++) {
      var k = R.canonKey(await I.applyFn(a[1], [list[i]]));
      if (!seen.has(k)) { seen.add(k); out.push(list[i]); }
    }
    return out;
  };
  Enum['dedup/1'] = function (a) {
    var list = toListSafe(a[0]), out = [];
    for (var i = 0; i < list.length; i++) {
      if (i === 0 || !R.strictEquals(list[i], list[i - 1])) out.push(list[i]);
    }
    return out;
  };
  Enum['take/2'] = function (a) {
    var l = toListSafe(a[0]), n = n1(a[1]);
    return n >= 0 ? l.slice(0, n) : l.slice(Math.max(0, l.length + n));
  };
  Enum['drop/2'] = function (a) {
    var l = toListSafe(a[0]), n = n1(a[1]);
    return n >= 0 ? l.slice(n) : l.slice(0, Math.max(0, l.length + n));
  };
  Enum['slice/2'] = function (a) {
    var l = toListSafe(a[0]), r = a[1];
    if (r instanceof R.Range) return l.slice(r.first, r.last + 1);
    return l;
  };
  Enum['slice/3'] = function (a) {
    var l = toListSafe(a[0]);
    return l.slice(n1(a[1]), n1(a[1]) + n1(a[2]));
  };
  Enum['split/2'] = function (a) {
    var l = toListSafe(a[0]), n = n1(a[1]);
    var i = n >= 0 ? n : Math.max(0, l.length + n);
    return new R.Tuple([l.slice(0, i), l.slice(i)]);
  };
  Enum['take_while/2'] = async function (a, I) {
    var l = toListSafe(a[0]), out = [];
    for (var i = 0; i < l.length; i++) {
      if (!R.isTruthy(await I.applyFn(a[1], [l[i]]))) break;
      out.push(l[i]);
    }
    return out;
  };
  Enum['drop_while/2'] = async function (a, I) {
    var l = toListSafe(a[0]), i = 0;
    for (; i < l.length; i++) {
      if (!R.isTruthy(await I.applyFn(a[1], [l[i]]))) break;
    }
    return l.slice(i);
  };
  Enum['reverse/1'] = function (a) { return toListSafe(a[0]).slice().reverse(); };
  Enum['reverse/2'] = function (a) {
    return toListSafe(a[0]).slice().reverse().concat(toListSafe(a[1]));
  };
  Enum['at/2'] = function (a) {
    var l = toListSafe(a[0]), i = n1(a[1]);
    var v = i >= 0 ? l[i] : l[l.length + i];
    return v === undefined ? NIL : v;
  };
  Enum['at/3'] = function (a) {
    var l = toListSafe(a[0]), i = n1(a[1]);
    var v = i >= 0 ? l[i] : l[l.length + i];
    return v === undefined ? a[2] : v;
  };
  Enum['fetch/2'] = function (a) {
    var l = toListSafe(a[0]), i = n1(a[1]);
    if (i < 0) i = l.length + i;
    if (i < 0 || i >= l.length) return A('error');
    return new R.Tuple([OK, l[i]]);
  };
  Enum['empty?/1'] = function (a) { return R.toBool(toListSafe(a[0]).length === 0); };
  Enum['member?/2'] = function (a) {
    var l = toListSafe(a[0]);
    for (var i = 0; i < l.length; i++) if (R.strictEquals(l[i], a[1])) return R.TRUE;
    return R.FALSE;
  };
  Enum['all?/1'] = function (a) {
    return R.toBool(toListSafe(a[0]).every(R.isTruthy));
  };
  Enum['all?/2'] = async function (a, I) {
    var l = toListSafe(a[0]);
    for (var i = 0; i < l.length; i++) if (!R.isTruthy(await I.applyFn(a[1], [l[i]]))) return R.FALSE;
    return R.TRUE;
  };
  Enum['any?/1'] = function (a) { return R.toBool(toListSafe(a[0]).some(R.isTruthy)); };
  Enum['any?/2'] = async function (a, I) {
    var l = toListSafe(a[0]);
    for (var i = 0; i < l.length; i++) if (R.isTruthy(await I.applyFn(a[1], [l[i]]))) return R.TRUE;
    return R.FALSE;
  };
  Enum['find/3'] = async function (a, I) {
    var l = toListSafe(a[0]);
    for (var i = 0; i < l.length; i++) {
      if (R.isTruthy(await I.applyFn(a[1], [l[i]]))) return l[i];
    }
    return a[2] === undefined ? NIL : a[2];
  };
  Enum['find/2'] = async function (a, I) { return Enum['find/3']([a[0], a[1], NIL], I); };
  Enum['find_index/2'] = async function (a, I) {
    var l = toListSafe(a[0]);
    for (var i = 0; i < l.length; i++) {
      if (R.isTruthy(await I.applyFn(a[1], [l[i]]))) return i;
    }
    return NIL;
  };
  Enum['find_value/3'] = async function (a, I) {
    var l = toListSafe(a[0]);
    for (var i = 0; i < l.length; i++) {
      var v = await I.applyFn(a[1], [l[i]]);
      if (R.isTruthy(v)) return v;
    }
    return a[2] === undefined ? NIL : a[2];
  };
  Enum['find_value/2'] = async function (a, I) { return Enum['find_value/3']([a[0], a[1], NIL], I); };
  Enum['with_index/1'] = function (a) {
    return toListSafe(a[0]).map(function (x, i) { return new R.Tuple([x, i]); });
  };
  Enum['with_index/2'] = function (a) {
    return toListSafe(a[0]).map(function (x, i) { return new R.Tuple([x, i]); });
  };
  Enum['flat_map/2'] = async function (a, I) {
    var l = toListSafe(a[0]), out = [];
    for (var i = 0; i < l.length; i++) {
      var r = await I.applyFn(a[1], [l[i]]);
      out = out.concat(toListSafe(r));
    }
    return out;
  };
  Enum['chunk_every/2'] = function (a) {
    var l = toListSafe(a[0]), n = n1(a[1]), out = [];
    for (var i = 0; i < l.length; i += n) out.push(l.slice(i, i + n));
    return out;
  };
  Enum['chunk_every/3'] = function (a) {
    var l = toListSafe(a[0]), n = n1(a[1]), step = n1(a[2]), out = [];
    for (var i = 0; i < l.length; i += step) out.push(l.slice(i, i + n));
    return out;
  };
  Enum['zip/1'] = function (a) {
    var lists = toListSafe(a[0]).map(toListSafe);
    if (!lists.length) return [];
    var len = Math.min.apply(null, lists.map(function (l) { return l.length; }));
    var out = [];
    for (var i = 0; i < len; i++) out.push(new R.Tuple(lists.map(function (l) { return l[i]; })));
    return out;
  };
  Enum['zip/2'] = function (a) {
    var l1 = toListSafe(a[0]), l2 = toListSafe(a[1]);
    var len = Math.min(l1.length, l2.length);
    var out = [];
    for (var i = 0; i < len; i++) out.push(new R.Tuple([l1[i], l2[i]]));
    return out;
  };
  Enum['into/2'] = function (a, I) {
    var src = toListSafe(a[0]);
    var target = a[1];
    if (Array.isArray(target)) return target.concat(src);
    if (target instanceof R.MapVal) {
      var m = target.clone();
      src.forEach(function (p) {
        if (p instanceof R.Tuple && p.items.length === 2) m.set(p.items[0], p.items[1]);
      });
      return m;
    }
    if (typeof target === 'string') return target + src.join('');
    return src;
  };
  Enum['into/3'] = async function (a, I) {
    var mapped = await Enum['map/2']([a[0], a[1]], I);
    return Enum['into/2']([mapped, a[2]], I);
  };
  Enum['group_by/3'] = async function (a, I) {
    var l = toListSafe(a[0]);
    var m = new R.MapVal();
    for (var i = 0; i < l.length; i++) {
      var k = await I.applyFn(a[1], [l[i]]);
      var v = await I.applyFn(a[2], [l[i]]);
      var cur = m.get(k);
      if (cur === undefined) m.set(k, [v]);
      else m.set(k, cur.concat([v]));
    }
    return m;
  };
  Enum['group_by/2'] = async function (a, I) {
    var identity = new R.Fn({
      kind: 'anon', arity: 1, env: null,
      clauses: [{ params: [{ type: 'var', name: 'x', line: 0 }], guard: null, body: { type: 'var', name: 'x', line: 0 }, line: 0 }]
    });
    return Enum['group_by/3']([a[0], a[1], identity], I);
  };
  Enum['frequencies/1'] = function (a) {
    var l = toListSafe(a[0]), m = new R.MapVal();
    l.forEach(function (x) {
      var cur = m.get(x);
      m.set(x, cur === undefined ? 1 : cur + 1);
    });
    return m;
  };
  Enum['frequencies_by/2'] = async function (a, I) {
    var l = toListSafe(a[0]), m = new R.MapVal();
    for (var i = 0; i < l.length; i++) {
      var k = await I.applyFn(a[1], [l[i]]);
      var cur = m.get(k);
      m.set(k, cur === undefined ? 1 : cur + 1);
    }
    return m;
  };
  Enum['min/1'] = function (a) {
    var l = toListSafe(a[0]);
    if (!l.length) throw new EL.ArgumentError('Enum.min/1 不能用于空集合');
    return l.reduce(function (x, y) { return R.compare(y, x) < 0 ? y : x; });
  };
  Enum['min/3'] = function (a) { return Enum['min/1'](a); };
  Enum['max/3'] = function (a) { return Enum['max/1'](a); };
  Enum['max/1'] = function (a) {
    var l = toListSafe(a[0]);
    if (!l.length) throw new EL.ArgumentError('Enum.max/1 不能用于空集合');
    return l.reduce(function (x, y) { return R.compare(y, x) > 0 ? y : x; });
  };
  Enum['min_by/2'] = async function (a, I) {
    var l = toListSafe(a[0]);
    if (!l.length) throw new EL.ArgumentError('Enum.min_by/2 不能用于空集合');
    var best = l[0], bk = await I.applyFn(a[1], [best]);
    for (var i = 1; i < l.length; i++) {
      var k = await I.applyFn(a[1], [l[i]]);
      if (R.compare(k, bk) < 0) { best = l[i]; bk = k; }
    }
    return best;
  };
  Enum['max_by/2'] = async function (a, I) {
    var l = toListSafe(a[0]);
    if (!l.length) throw new EL.ArgumentError('Enum.max_by/2 不能用于空集合');
    var best = l[0], bk = await I.applyFn(a[1], [best]);
    for (var i = 1; i < l.length; i++) {
      var k = await I.applyFn(a[1], [l[i]]);
      if (R.compare(k, bk) > 0) { best = l[i]; bk = k; }
    }
    return best;
  };
  Enum['min_by/3'] = Enum['min_by/2'];
  Enum['max_by/3'] = Enum['max_by/2'];
  Enum['concat/1'] = function (a) {
    var out = [];
    toListSafe(a[0]).forEach(function (x) { out = out.concat(toListSafe(x)); });
    return out;
  };
  Enum['concat/2'] = function (a) {
    return toListSafe(a[0]).concat(toListSafe(a[1]));
  };
  Enum['intersperse/2'] = function (a) {
    var l = toListSafe(a[0]), out = [];
    l.forEach(function (x, i) { if (i) out.push(a[1]); out.push(x); });
    return out;
  };
  Enum['scan/2'] = async function (a, I) {
    var l = toListSafe(a[0]);
    if (!l.length) return [];
    var acc = l[0], out = [acc];
    for (var i = 1; i < l.length; i++) {
      acc = await I.applyFn(a[1], [l[i], acc]);
      out.push(acc);
    }
    return out;
  };
  Enum['scan/3'] = async function (a, I) {
    var l = toListSafe(a[0]), acc = a[1], out = [];
    for (var i = 0; i < l.length; i++) { acc = await I.applyFn(a[2], [l[i], acc]); out.push(acc); }
    return out;
  };
  Enum['shuffle/1'] = function (a) {
    var l = toListSafe(a[0]).slice();
    for (var i = l.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = l[i]; l[i] = l[j]; l[j] = t;
    }
    return l;
  };
  Enum['random/1'] = function (a) {
    var l = toListSafe(a[0]);
    return l[Math.floor(Math.random() * l.length)];
  };

  // ---------- List ----------
  var List = B.List = {};
  List['first/1'] = function (a) { return a[0].length ? a[0][0] : NIL; };
  List['last/1'] = function (a) { return a[0].length ? a[0][a[0].length - 1] : NIL; };
  List['flatten/1'] = function (a) {
    var out = [];
    (function rec(x) {
      if (Array.isArray(x)) x.forEach(rec); else out.push(x);
    })(a[0]);
    return out;
  };
  List['flatten/2'] = function (a) {
    var flat = List['flatten/1']([a[0]]);
    return flat.concat(toListSafe(a[1]));
  };
  List['zip/1'] = function (a) {
    var lists = a[0];
    if (!lists.length) return [];
    var len = Math.min.apply(null, lists.map(function (l) { return l.length; }));
    var out = [];
    for (var i = 0; i < len; i++) out.push(new R.Tuple(lists.map(function (l) { return l[i]; })));
    return out;
  };
  List['duplicate/2'] = function (a) {
    var out = [], n = n1(a[1]);
    for (var i = 0; i < n; i++) out.push(a[0]);
    return out;
  };
  List['wrap/1'] = function (a) {
    var v = a[0];
    if (Array.isArray(v)) return v;
    if (v === NIL) return [];
    return [v];
  };
  List['delete/2'] = function (a) {
    return a[0].filter(function (x) { return !R.strictEquals(x, a[1]); });
  };
  List['delete_at/2'] = function (a) {
    var l = a[0].slice(), i = n1(a[1]);
    if (i < 0) i = l.length + i;
    var removed = i >= 0 && i < l.length ? l[i] : NIL;
    if (i >= 0 && i < l.length) l.splice(i, 1);
    return new R.Tuple([l, removed]);
  };
  List['insert_at/3'] = function (a) {
    var l = a[0].slice(), i = n1(a[1]);
    if (i < 0) i = Math.max(0, l.length + 1 + i);
    l.splice(i, 0, a[2]);
    return l;
  };
  List['replace_at/3'] = function (a) {
    var l = a[0].slice(), i = n1(a[1]);
    if (i < 0) i = l.length + i;
    if (i < 0 || i >= l.length) return a[0];
    l[i] = a[2];
    return l;
  };
  List['update_at/3'] = async function (a, I) {
    var l = a[0].slice(), i = n1(a[1]);
    if (i < 0) i = l.length + i;
    if (i < 0 || i >= l.length) return a[0];
    l[i] = await I.applyFn(a[2], [l[i]]);
    return l;
  };
  List['to_tuple/1'] = function (a) { return new R.Tuple(a[0].slice()); };
  List['keyfind/3'] = function (a) {
    var l = a[0], key = a[1], pos = n1(a[2]);
    for (var i = 0; i < l.length; i++) {
      var e = l[i];
      if (e instanceof R.Tuple && e.items.length > pos && R.strictEquals(e.items[pos], key)) return e;
      if (Array.isArray(e) && e.length > pos && R.strictEquals(e[pos], key)) return e;
    }
    return NIL;
  };
  List['keyfind/4'] = List['keyfind/3'];
  List['keymember?/3'] = function (a) {
    return R.toBool(List['keyfind/3'](a) !== NIL);
  };
  List['keydelete/3'] = function (a) {
    var l = a[0], key = a[1], pos = n1(a[2]);
    return l.filter(function (e) {
      if (e instanceof R.Tuple && e.items.length > pos) return !R.strictEquals(e.items[pos], key);
      if (Array.isArray(e) && e.length > pos) return !R.strictEquals(e[pos], key);
      return true;
    });
  };
  List['starts_with?/2'] = function (a) {
    var l = a[0], pre = a[1];
    for (var i = 0; i < pre.length; i++) {
      if (!R.strictEquals(l[i], pre[i])) return R.FALSE;
    }
    return R.TRUE;
  };
  List['foldl/3'] = async function (a, I) {
    var acc = a[1];
    for (var i = 0; i < a[0].length; i++) acc = await I.applyFn(a[2], [a[0][i], acc]);
    return acc;
  };
  List['foldr/3'] = async function (a, I) {
    var acc = a[1];
    for (var i = a[0].length - 1; i >= 0; i--) acc = await I.applyFn(a[2], [a[0][i], acc]);
    return acc;
  };
  List['pop_at/2'] = List['delete_at/2'];
  List['pop_at/3'] = function (a) {
    var l = a[0].slice(), i = n1(a[1]);
    if (i < 0) i = l.length + i;
    var removed = i >= 0 && i < l.length ? l[i] : a[2];
    if (i >= 0 && i < l.length) l.splice(i, 1);
    return new R.Tuple([removed, l]);
  };
  List['myers_difference/2'] = function () { return []; };

  // ---------- Map ----------
  var Map_ = B.Map = {};
  Map_['new/0'] = function () { return new R.MapVal(); };
  Map_['new/1'] = function (a) {
    var m = new R.MapVal();
    R.toList(a[0]).forEach(function (p) {
      if (p instanceof R.Tuple && p.items.length === 2) m.set(p.items[0], p.items[1]);
    });
    return m;
  };
  Map_['get/2'] = function (a) {
    var v = a[0].get(a[1]);
    return v === undefined ? NIL : v;
  };
  Map_['get/3'] = function (a) {
    var v = a[0].get(a[1]);
    return v === undefined ? a[2] : v;
  };
  Map_['fetch/2'] = function (a) {
    var v = a[0].get(a[1]);
    return v === undefined ? A('error') : new R.Tuple([OK, v]);
  };
  Map_['fetch!/2'] = function (a) {
    var v = a[0].get(a[1]);
    if (v === undefined) throw new EL.KeyError('键 ' + R.inspect(a[1]) + ' 不存在');
    return v;
  };
  Map_['put/3'] = function (a) { return a[0].clone().set(a[1], a[2]); };
  Map_['put_new/3'] = function (a) {
    var m = a[0].clone();
    if (!m.has(a[1])) m.set(a[1], a[2]);
    return m;
  };
  Map_['replace/3'] = function (a) {
    var m = a[0].clone();
    if (!m.has(a[1])) throw new EL.KeyError('键 ' + R.inspect(a[1]) + ' 不存在');
    m.set(a[1], a[2]);
    return m;
  };
  Map_['delete/2'] = function (a) { return a[0].clone().delete(a[1]); };
  Map_['has_key?/2'] = function (a) { return R.toBool(a[0].has(a[1])); };
  Map_['keys/1'] = function (a) { return a[0].pairs().map(function (p) { return p[0]; }); };
  Map_['values/1'] = function (a) { return a[0].pairs().map(function (p) { return p[1]; }); };
  Map_['to_list/1'] = function (a) {
    return a[0].pairs().map(function (p) { return new R.Tuple(p); });
  };
  Map_['from_struct/1'] = function (a) {
    if (a[0] instanceof R.Struct) return a[0].map.clone();
    throw new EL.ArgumentError('Map.from_struct/1 需要结构体');
  };
  Map_['merge/2'] = function (a) {
    var m = a[0].clone();
    a[1].pairs().forEach(function (p) { m.set(p[0], p[1]); });
    return m;
  };
  Map_['merge/3'] = async function (a, I) {
    var m = a[0].clone();
    var pairs = a[1].pairs();
    for (var i = 0; i < pairs.length; i++) {
      var k = pairs[i][0];
      if (m.has(k)) m.set(k, await I.applyFn(a[2], [k, m.get(k), pairs[i][1]]));
      else m.set(k, pairs[i][1]);
    }
    return m;
  };
  Map_['update/4'] = function (a) {
    var m = a[0].clone();
    m.set(a[1], a[3]);
    return m;
  };
  Map_['update!/3'] = async function (a, I) {
    var m = a[0].clone();
    if (!m.has(a[1])) throw new EL.KeyError('键 ' + R.inspect(a[1]) + ' 不存在');
    m.set(a[1], await I.applyFn(a[2], [m.get(a[1])]));
    return m;
  };
  Map_['take/2'] = function (a) {
    var m = new R.MapVal();
    a[1].forEach(function (k) { if (a[0].has(k)) m.set(k, a[0].get(k)); });
    return m;
  };
  Map_['drop/2'] = function (a) {
    var m = a[0].clone();
    a[1].forEach(function (k) { m.delete(k); });
    return m;
  };
  Map_['equal?/2'] = function (a) { return R.toBool(R.strictEquals(a[0], a[1])); };
  Map_['get_and_update/3'] = async function (a, I) {
    var m = a[0].clone();
    var old = m.get(a[1]);
    var res = await I.applyFn(a[2], [old === undefined ? NIL : old]);
    if (res instanceof R.Tuple && res.items.length === 2) {
      if (res.items[1] === A('pop')) m.delete(a[1]);
      else m.set(a[1], res.items[1]);
      return new R.Tuple([res.items[0], m]);
    }
    if (res === A('pop')) { m.delete(a[1]); return new R.Tuple([old === undefined ? NIL : old, m]); }
    return new R.Tuple([res, m]);
  };

  // ---------- String ----------
  var String_ = B.String = {};
  String_['upcase/1'] = function (a) { return R.to_string(a[0]).toUpperCase(); };
  String_['downcase/1'] = function (a) { return R.to_string(a[0]).toLowerCase(); };
  String_['capitalize/1'] = function (a) {
    var s = R.to_string(a[0]);
    return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
  };
  String_['length/1'] = function (a) { return R.to_string(a[0]).length; };
  String_['trim/1'] = function (a) { return R.to_string(a[0]).trim(); };
  String_['trim_leading/1'] = function (a) { return R.to_string(a[0]).replace(/^\s+/, ''); };
  String_['trim_trailing/1'] = function (a) { return R.to_string(a[0]).replace(/\s+$/, ''); };
  String_['trim/2'] = function (a) {
    var s = R.to_string(a[0]), c = R.to_string(a[1]);
    return s.split(c).filter(function (x, i, arr) { return x !== '' || (i > 0 && i < arr.length - 1); }).join(c);
  };
  String_['split/1'] = function (a) { return R.to_string(a[0]).trim().split(/\s+/).filter(function (x) { return x !== ''; }); };
  String_['split/2'] = function (a) {
    var s = R.to_string(a[0]), pat = R.to_string(a[1]);
    if (pat === '') return s.split('');
    return s.split(pat);
  };
  String_['split/3'] = function (a) {
    var s = R.to_string(a[0]), pat = R.to_string(a[1]);
    var parts = pat === '' ? s.split('') : s.split(pat);
    var opts = a[2] || [];
    if (R.keywordGet(opts, 'trim', R.FALSE) === R.TRUE) {
      parts = parts.filter(function (x) { return x !== ''; });
    }
    return parts;
  };
  String_['split_at/2'] = function (a) {
    var s = R.to_string(a[0]), i = n1(a[1]);
    var idx = i >= 0 ? i : Math.max(0, s.length + i);
    return new R.Tuple([s.slice(0, idx), s.slice(idx)]);
  };
  String_['replace/3'] = function (a) {
    return R.to_string(a[0]).split(R.to_string(a[1])).join(R.to_string(a[2]));
  };
  String_['replace/4'] = String_['replace/3'];
  String_['replace_prefix/3'] = function (a) {
    var s = R.to_string(a[0]), p = R.to_string(a[1]);
    return s.indexOf(p) === 0 ? R.to_string(a[2]) + s.slice(p.length) : s;
  };
  String_['contains?/2'] = function (a) { return R.toBool(R.to_string(a[0]).indexOf(R.to_string(a[1])) >= 0); };
  String_['starts_with?/2'] = function (a) {
    var s = R.to_string(a[0]), p = R.to_string(a[1]);
    return R.toBool(p === '' || s.indexOf(p) === 0);
  };
  String_['ends_with?/2'] = function (a) {
    var s = R.to_string(a[0]), p = R.to_string(a[1]);
    return R.toBool(p === '' || s.slice(-p.length) === p);
  };
  String_['slice/2'] = function (a) {
    var s = R.to_string(a[0]), r = a[1];
    if (r instanceof R.Range) return s.slice(r.first, r.last + 1);
    var i = n1(r);
    return s.charAt(i);
  };
  String_['slice/3'] = function (a) {
    var s = R.to_string(a[0]);
    return s.substr(n1(a[1]), n1(a[2]));
  };
  String_['at/2'] = function (a) {
    var s = R.to_string(a[0]), i = n1(a[1]);
    if (i < 0) i = s.length + i;
    var c = s.charAt(i);
    return c === '' ? NIL : c;
  };
  String_['first/1'] = function (a) {
    var s = R.to_string(a[0]);
    return s ? s.charAt(0) : NIL;
  };
  String_['last/1'] = function (a) {
    var s = R.to_string(a[0]);
    return s ? s.charAt(s.length - 1) : NIL;
  };
  String_['graphemes/1'] = function (a) {
    var s = R.to_string(a[0]), out = [];
    for (var i = 0; i < s.length; i++) out.push(s[i]);
    return out;
  };
  String_['chars/1'] = String_['graphemes/1'];
  String_['to_charlist/1'] = function (a) {
    var s = R.to_string(a[0]), out = [];
    for (var i = 0; i < s.length; i++) out.push(s.charCodeAt(i));
    var arr = out;
    arr.__charlist = true;
    return arr;
  };
  String_['duplicate/2'] = function (a) { return R.to_string(a[0]).repeat(Math.max(0, n1(a[1]))); };
  String_['reverse/1'] = function (a) { return R.to_string(a[0]).split('').reverse().join(''); };
  String_['pad_leading/2'] = function (a) {
    var s = R.to_string(a[0]), n = n1(a[1]);
    while (s.length < n) s = ' ' + s;
    return s;
  };
  String_['pad_leading/3'] = function (a) {
    var s = R.to_string(a[0]), n = n1(a[1]), pad = R.to_string(a[2]);
    while (s.length < n) s = pad + s;
    return s;
  };
  String_['pad_trailing/2'] = function (a) {
    var s = R.to_string(a[0]), n = n1(a[1]);
    while (s.length < n) s = s + ' ';
    return s;
  };
  String_['to_integer/1'] = function (a) {
    var v = parseInt(R.to_string(a[0]), 10);
    if (isNaN(v)) throw new EL.ArgumentError('String.to_integer/1 无法解析 "' + a[0] + '"');
    return v;
  };
  String_['to_integer/2'] = function (a) {
    return parseInt(R.to_string(a[0]), n1(a[1]));
  };
  String_['to_float/1'] = function (a) {
    var v = parseFloat(R.to_string(a[0]));
    if (isNaN(v)) throw new EL.ArgumentError('String.to_float/1 无法解析 "' + a[0] + '"');
    return new R.FloatVal(v);
  };
  String_['to_atom/1'] = function (a) { return A(R.to_string(a[0])); };
  String_['to_existing_atom/1'] = function (a) { return A(R.to_string(a[0])); };
  String_['equivalent?/2'] = function (a) { return R.toBool(R.to_string(a[0]) === R.to_string(a[1])); };

  // ---------- Integer / Float ----------
  var Integer = B.Integer = {};
  Integer['to_string/1'] = function (a) { return String(n1(a[0])); };
  Integer['to_string/2'] = function (a) { return n1(a[0]).toString(n1(a[1])); };
  Integer['parse/1'] = function (a) {
    var m = /^\s*([+-]?\d+)\s*$/.exec(R.to_string(a[0]));
    if (!m) return A('error');
    return new R.Tuple([parseInt(m[1], 10), '']);
  };
  Integer['parse/2'] = function (a) {
    var v = parseInt(R.to_string(a[0]), n1(a[1]));
    if (isNaN(v)) return A('error');
    return new R.Tuple([v, '']);
  };
  Integer['digits/1'] = function (a) {
    return String(Math.abs(n1(a[0]))).split('').map(Number);
  };
  Integer['digits/2'] = function (a) {
    return n1(a[0]).toString(n1(a[1])).split('').map(function (d) { return parseInt(d, n1(a[1])); });
  };
  Integer['undigits/1'] = function (a) {
    return parseInt(a[0].join(''), 10);
  };
  Integer['undigits/2'] = function (a) {
    return parseInt(a[0].map(function (d) { return d.toString(n1(a[1])); }).join(''), n1(a[1]));
  };
  Integer['is_odd/1'] = function (a) { return R.toBool(Math.abs(n1(a[0])) % 2 === 1); };
  Integer['is_even/1'] = function (a) { return R.toBool(n1(a[0]) % 2 === 0); };
  Integer['pow/2'] = function (a) { return Math.pow(n1(a[0]), n1(a[1])); };
  Integer['gcd/2'] = function (a) {
    var x = Math.abs(n1(a[0])), y = Math.abs(n1(a[1]));
    while (y) { var t = y; y = x % y; x = t; }
    return x;
  };
  Integer['mod/2'] = function (a) {
    var d = n1(a[1]);
    return ((n1(a[0]) % d) + d) % d;
  };

  var Float_ = B.Float = {};
  Float_['round/1'] = function (a) { return Math.round(R.num(a[0])); };
  Float_['round/2'] = function (a) {
    var p = Math.pow(10, n1(a[1]));
    return Math.round(R.num(a[0]) * p) / p;
  };
  Float_['floor/1'] = function (a) { return Math.floor(R.num(a[0])); };
  Float_['ceil/1'] = function (a) { return Math.ceil(R.num(a[0])); };
  Float_['parse/1'] = function (a) {
    var m = /^\s*([+-]?\d+(\.\d+)?([eE][+-]?\d+)?)\s*$/.exec(R.to_string(a[0]));
    if (!m) return A('error');
    return new R.Tuple([new R.FloatVal(parseFloat(m[1])), '']);
  };
  Float_['to_string/1'] = function (a) { return String(R.num(a[0])); };

  // ---------- Tuple / Keyword / Range ----------
  var TupleM = B.Tuple = {};
  TupleM['to_list/1'] = function (a) { return a[0].items.slice(); };
  TupleM['insert_at/3'] = function (a) {
    var items = a[0].items.slice();
    items.splice(n1(a[1]), 0, a[2]);
    return new R.Tuple(items);
  };
  TupleM['append/2'] = function (a) { return new R.Tuple(a[0].items.concat([a[1]])); };
  TupleM['delete_at/2'] = function (a) {
    var items = a[0].items.slice();
    items.splice(n1(a[1]), 1);
    return new R.Tuple(items);
  };

  var Keyword_ = B.Keyword = {};
  Keyword_['get/3'] = function (a) { return R.keywordGet(a[0], a[1] && a[1].name, a[2]); };
  Keyword_['get/2'] = function (a) { return R.keywordGet(a[0], a[1] && a[1].name, NIL); };
  Keyword_['keys/1'] = function (a) {
    return a[0].map(function (p) { return p.items ? p.items[0] : p[0]; });
  };
  Keyword_['values/1'] = function (a) {
    return a[0].map(function (p) { return p.items ? p.items[1] : p[1]; });
  };
  Keyword_['keyword?/1'] = function (a) { return R.toBool(R.isKeyword(a[0])); };
  Keyword_['has_key?/2'] = function (a) {
    var v = R.keywordGet(a[0], a[1].name, null);
    return R.toBool(v !== null);
  };
  Keyword_['equal?/2'] = function (a) { return R.toBool(R.strictEquals(a[0], a[1])); };
  Keyword_['put/3'] = function (a) {
    var out = a[0].filter(function (p) { return !p.items || !R.strictEquals(p.items[0], a[1]); });
    out.push(new R.Tuple([a[1], a[2]]));
    return out;
  };
  Keyword_['delete/2'] = function (a) {
    return a[0].filter(function (p) { return !p.items || !R.strictEquals(p.items[0], a[1]); });
  };

  var RangeM = B.Range = {};
  RangeM['new/2'] = function (a) { return new R.Range(n1(a[0]), n1(a[1]), 1); };
  RangeM['new/3'] = function (a) { return new R.Range(n1(a[0]), n1(a[1]), n1(a[2])); };
  RangeM['to_list/1'] = function (a) { return R.toList(a[0]); };

  // ---------- Process ----------
  var Process = B.Process = {};
  Process['sleep/1'] = function (a, I) { return I.sleep(n1(a[0])); };
  Process['spawn/1'] = function (a, I) { return I.spawn(a[0]); };
  Process['spawn/3'] = function (a, I) { return I.spawnModule(a[0], a[1], a[2]); };
  Process['send/2'] = function (a, I) { I.send(a[0], a[1]); return a[1]; };
  Process['send/3'] = function (a, I) { I.send(a[0], a[1]); return OK; };
  Process['self/0'] = function (a, I) { return I.self(); };
  Process['alive?/1'] = function (a, I) { return R.toBool(I.alive(a[0])); };
  Process['exit/2'] = function (a, I) { I.exitProcess(a[0], a[1]); return OK; };
  Process['whereis/1'] = function (a, I) { return I.whereis(a[0]) || NIL; };
  Process['register/2'] = function (a, I) { I.register(a[0], a[1]); return OK; };
  Process['send_after/3'] = function (a, I) { return I.sendAfter(a[0], a[1], n1(a[2])); };
  Process['list/0'] = function (a, I) { return I.listProcesses(); };
  Process['info/1'] = function (a, I) { return I.processInfo(a[0]); };
  Process['flag/2'] = function () { return A('normal'); };

  EL.ALL_BUILTIN_NAMES = Object.keys(B);

})(typeof window !== 'undefined' ? window : globalThis);
