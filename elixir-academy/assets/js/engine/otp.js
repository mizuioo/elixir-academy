/*
 * 轻量级进程模型 + OTP 行为模式（GenServer / Agent / Task / Supervisor）
 * 用 JS 的异步调度模拟 Erlang 的轻量进程与消息传递。
 */
(function (global) {
  'use strict';

  var EL = global.EL || (global.EL = {});
  var R = EL.R;
  var OTP = EL.OTP = {};

  function A(n) { return R.atom(n); }

  // ---------- 进程表 ----------
  function Scheduler() {
    this.procs = new Map();
    this.nextId = 1;
    this.names = {};
    this.trace = [];
    this.maxTrace = 60;
    this.closed = false;   // 顶层 run() 结束后置 true，停止所有后台进程
  }

  Scheduler.prototype.newProc = function (parentPid) {
    var id = this.nextId++;
    var proc = {
      id: id,
      pid: new R.Pid('0.' + id + '.0'),
      mailbox: [],
      waiters: [],
      status: 'running',
      exitReason: null,
      links: [],
      monitors: [],
      onExitCbs: [],
      parent: parentPid || null,
      startedAt: Date.now()
    };
    this.procs.set(id, proc);
    return proc;
  };

  Scheduler.prototype.get = function (pid) {
    if (!(pid instanceof R.Pid)) return null;
    var id = parseInt(String(pid.id).split('.')[1], 10);
    return this.procs.get(id) || null;
  };

  Scheduler.prototype.send = function (pid, msg, fromPid) {
    var p = this.get(pid);
    if (!p || p.status !== 'running') return false;
    p.mailbox.push(msg);
    this.trace.push({
      from: fromPid ? String(fromPid.id) : '?',
      to: String(pid.id),
      msg: R.inspect(msg),
      t: Date.now()
    });
    if (this.trace.length > this.maxTrace) this.trace.shift();
    var ws = p.waiters.slice();
    setTimeout(function () {
      ws.forEach(function (w) { w(); });
    }, 0);
    return true;
  };

  Scheduler.prototype.exit = function (pid, reason) {
    var p = this.get(pid);
    if (!p || p.status !== 'running') return;
    p.status = 'exited';
    p.exitReason = reason;
    var self = this;
    if (this.closed) {
      // 已关停：不再触发监视/链接/重启回调，只唤醒等待者让 promise 落地
      var ws0 = p.waiters.slice();
      p.waiters.length = 0;
      setTimeout(function () { ws0.forEach(function (w) { w(); }); }, 0);
      return;
    }
    // 通知监视者
    p.monitors.forEach(function (m) {
      self.send(m.pid, new R.Tuple([A('DOWN'), m.ref, A('process'), p.pid, reason]), p.pid);
    });
    // 链接进程：异常退出会传播
    if (!(reason instanceof R.Atom) || reason.name !== 'normal') {
      p.links.forEach(function (lp) { self.exit(lp, reason); });
    }
    // 冲刷等待者（让 receive 解除阻塞）
    var ws = p.waiters.slice();
    p.waiters.length = 0;
    setTimeout(function () { ws.forEach(function (w) { w(); }); }, 0);
    p.onExitCbs.forEach(function (cb) { try { cb(reason); } catch (e) { } });
    p.onExitCbs.length = 0;
  };

  Scheduler.prototype.list = function () {
    var out = [];
    this.procs.forEach(function (p) { out.push(p); });
    return out;
  };

  Scheduler.prototype.reset = function () {
    this.procs.clear();
    this.names = {};
    this.trace.length = 0;
    this.nextId = 1;
    this.closed = false;
  };

  // 顶层 run() 结束时调用：让所有后台进程（GenServer / Supervisor / Agent）安静退场
  Scheduler.prototype.shutdown = function () {
    if (this.closed) return;
    this.closed = true;
    var self = this;
    this.procs.forEach(function (p) {
      if (p.status === 'running') {
        p.status = 'exited';
        p.exitReason = A('shutdown');
        var ws = p.waiters.slice();
        p.waiters.length = 0;
        setTimeout(function () { ws.forEach(function (w) { w(); }); }, 0);
      }
    });
  };

  OTP.Scheduler = Scheduler;

  // ---------- OTP 内置模块 ----------
  function registerBuiltins() {
    var B = EL.BUILTINS;

    // ---- GenServer ----
    var GenServer = B.GenServer = {};

    function serverLoop(I, mod, state, proc) {
      return (async function loop() {
        while (proc.status === 'running') {
          var msg = await I.receiveRaw(proc, null);
          if (msg === null) break;
          if (msg instanceof R.Tuple && msg.items[0] instanceof R.Atom) {
            var tag = msg.items[0].name;
            if (tag === '$gen_call') {
              var from = msg.items[1];
              var req = msg.items[2];
              var res = await I.applyModule(mod, 'handle_call', [req, from, state]);
              if (res instanceof R.Tuple) {
                var t = res.items[0] && res.items[0].name;
                if (t === 'reply') {
                  I.sendTo(from, new R.Tuple([msgRefOf(from), res.items[1]]));
                  state = res.items[2];
                } else if (t === 'noreply') {
                  state = res.items[1];
                } else if (t === 'stop') {
                  if (res.items.length === 3) I.sendTo(from, new R.Tuple([msgRefOf(from), res.items[1]]));
                  return;
                } else { state = res.items[res.items.length - 1]; }
              } else { state = res; }
            } else if (tag === '$gen_cast') {
              var req2 = msg.items[1];
              var res2 = await I.applyModule(mod, 'handle_cast', [req2, state]);
              if (res2 instanceof R.Tuple) {
                var t2 = res2.items[0] && res2.items[0].name;
                if (t2 === 'noreply') state = res2.items[1];
                else if (t2 === 'stop') return;
                else state = res2.items[res2.items.length - 1];
              }
            } else if (tag === '$gen_info') {
              continue;
            } else {
              if (I.moduleHasFunction(mod, 'handle_info', 2)) {
                var res3 = await I.applyModule(mod, 'handle_info', [msg, state]);
                if (res3 instanceof R.Tuple && res3.items[0] && res3.items[0].name === 'noreply') state = res3.items[1];
              }
            }
          } else {
            if (I.moduleHasFunction(mod, 'handle_info', 2)) {
              var res4 = await I.applyModule(mod, 'handle_info', [msg, state]);
              if (res4 instanceof R.Tuple && res4.items[0] && res4.items[0].name === 'noreply') state = res4.items[1];
            }
          }
        }
      })();
    }

    function msgRefOf(from) {
      if (from instanceof R.Tuple && from.items.length >= 2) return from.items[1];
      return R.NIL;
    }

    GenServer['start_link/2'] = function (a, I) { return startLink(I, a[0], a[1], []); };
    GenServer['start_link/3'] = function (a, I) { return startLink(I, a[0], a[1], a[2] || []); };

    function startLink(I, mod, args, opts) {
      opts = opts || [];
      var proc = I.spawnRaw(function (p) {
        return (async function () {
          var r = await I.applyModule(mod, 'init', [args]);
          var state = (r instanceof R.Tuple && r.items[0] && r.items[0].name === 'ok') ? r.items[1] : R.NIL;
          await serverLoop(I, mod, state, p);
          return R.NIL;
        })();
      });
      var name = R.keywordGet(opts, 'name', null);
      if (name) I.registerName(name, proc.pid);
      return new R.Tuple([A('ok'), proc.pid]);
    }

    GenServer['call/2'] = async function (a, I) { return gcall(I, a[0], a[1], 3000); };
    GenServer['call/3'] = async function (a, I) {
      var t = R.isNumber(a[2]) ? R.num(a[2]) : 3000;
      return gcall(I, a[0], a[1], t);
    };

    function gcall(I, pid, request, timeout) {
      var ref = new R.Ref('r' + (I.sched.nextId++) );
      var from = new R.Tuple([I.self(), ref]);
      I.sendTo(pid, new R.Tuple([A('$gen_call'), from, request]));
      return I.awaitReply(ref, timeout);
    }

    GenServer['cast/2'] = function (a, I) {
      I.sendTo(a[0], new R.Tuple([A('$gen_cast'), a[1]]));
      return A('ok');
    };
    GenServer['stop/1'] = function (a, I) { I.sched.exit(a[0], A('normal')); return A('ok'); };
    GenServer['stop/3'] = function (a, I) { I.sched.exit(a[0], a[2] || A('normal')); return A('ok'); };
    GenServer['reply/2'] = function (a, I) {
      I.sendTo(a[0], new R.Tuple([msgRefOf(a[0]), a[1]]));
      return A('ok');
    };

    // ---- Agent ----
    var Agent = B.Agent = {};
    Agent['start_link/1'] = function (a, I) { return agentStart(I, a[0], []); };
    Agent['start_link/2'] = function (a, I) { return agentStart(I, a[0], a[1] || []); };

    function agentStart(I, initFn, opts) {
      var proc = I.spawnRaw(function (p) {
        return (async function () {
          var state = (initFn instanceof R.Fn) ? await I.applyFn(initFn, []) : initFn;
          while (p.status === 'running') {
            var msg = await I.receiveRaw(p, null);
            if (msg === null) break;
            if (msg instanceof R.Tuple && msg.items[0] instanceof R.Atom) {
              var tag = msg.items[0].name;
              var from = msg.items[1];
              var ref = msg.items[2];
              if (tag === '$agent_get') {
                var val = await I.applyFn(msg.items[3], [state]);
                I.sendTo(from, new R.Tuple([ref, val]));
              } else if (tag === '$agent_update') {
                var st2 = await I.applyFn(msg.items[3], [state]);
                state = st2;
                I.sendTo(from, new R.Tuple([ref, A('ok')]));
              } else if (tag === '$agent_get_and_update') {
                var r = await I.applyFn(msg.items[3], [state]);
                if (r instanceof R.Tuple && r.items.length === 2) {
                  I.sendTo(from, new R.Tuple([ref, r.items[0]]));
                  state = r.items[1];
                } else {
                  I.sendTo(from, new R.Tuple([ref, r]));
                }
              } else if (tag === '$agent_stop') {
                return R.NIL;
              }
            }
          }
          return R.NIL;
        })();
      });
      var name = R.keywordGet(opts, 'name', null);
      if (name) I.registerName(name, proc.pid);
      return new R.Tuple([A('ok'), proc.pid]);
    }

    function agentOp(I, pid, tag, fun, timeout) {
      var ref = new R.Ref('a' + (I.sched.nextId++));
      I.sendTo(pid, new R.Tuple([A(tag), I.self(), ref, fun]));
      return I.awaitReply(ref, timeout === undefined ? 3000 : timeout);
    }
    Agent['get/2'] = function (a, I) { return agentOp(I, a[0], '$agent_get', a[1]); };
    Agent['get/3'] = function (a, I) { return agentOp(I, a[0], '$agent_get', a[1], 3000); };
    Agent['update/2'] = function (a, I) { return agentOp(I, a[0], '$agent_update', a[1]); };
    Agent['update/3'] = function (a, I) { return agentOp(I, a[0], '$agent_update', a[1], 3000); };
    Agent['get_and_update/2'] = function (a, I) { return agentOp(I, a[0], '$agent_get_and_update', a[1]); };
    Agent['get_and_update/3'] = function (a, I) { return agentOp(I, a[0], '$agent_get_and_update', a[1], 3000); };
    Agent['stop/1'] = function (a, I) { I.sendTo(a[0], new R.Tuple([A('$agent_stop')])); return A('ok'); };
    Agent['stop/3'] = function (a, I) { I.sendTo(a[0], new R.Tuple([A('$agent_stop')])); return A('ok'); };

    // ---- Task ----
    var Task = B.Task = {};
    Task['async/1'] = function (a, I) {
      var ref = new R.Ref('t' + (I.sched.nextId++));
      var parent = I.self();
      var proc = I.spawnRaw(function (p) {
        return (async function () {
          var v = await I.applyFn(a[0], []);
          I.sendTo(parent, new R.Tuple([ref, v]));
          return v;
        })();
      });
      var m = new R.MapVal();
      m.set(A('pid'), proc.pid);
      m.set(A('ref'), ref);
      return m;
    };
    Task['async/3'] = function (a, I) {
      var ref = new R.Ref('t' + (I.sched.nextId++));
      var parent = I.self();
      var proc = I.spawnRaw(function (p) {
        return (async function () {
          var v = await I.applyModule(a[0], a[1], R.toList(a[2]));
          I.sendTo(parent, new R.Tuple([ref, v]));
          return v;
        })();
      });
      var m = new R.MapVal();
      m.set(A('pid'), proc.pid);
      m.set(A('ref'), ref);
      return m;
    };
    Task['await/1'] = async function (a, I) {
      var task = a[0];
      var ref = task instanceof R.MapVal ? task.get(A('ref')) : null;
      return I.awaitReply(ref, 5000);
    };
    Task['await/2'] = async function (a, I) {
      var task = a[0];
      var ref = task instanceof R.MapVal ? task.get(A('ref')) : null;
      return I.awaitReply(ref, R.num(a[1]));
    };
    Task['await_many/1'] = async function (a, I) {
      var out = [];
      for (var i = 0; i < a[0].length; i++) {
        var t = a[0][i];
        out.push(await I.awaitReply(t.get(A('ref')), 5000));
      }
      return out;
    };

    // ---- Supervisor ----
    var Supervisor = B.Supervisor = {};
    Supervisor['start_link/2'] = function (a, I) { return supervisorStart(I, a[0], a[1] || []); };
    Supervisor['start_link/3'] = function (a, I) { return supervisorStart(I, a[1], a[2] || []); };

    async function supervisorStart(I, children, opts) {
      var strategy = R.keywordGet(opts, 'strategy', A('one_for_one'));
      var maxRestarts = R.num(R.keywordGet(opts, 'max_restarts', 3));
      var started = [];

      async function startChild(spec) {
        var mod, fun, args;
        if (spec instanceof R.MapVal) {
          var s = spec.get(A('start'));
          if (s instanceof R.Tuple) { mod = s.items[0]; fun = s.items[1]; args = s.items[2] || []; }
          else return null;
        } else if (spec instanceof R.Tuple && spec.items.length >= 3) {
          mod = spec.items[0]; fun = spec.items[1]; args = spec.items[2];
        } else if (spec instanceof R.Atom) {
          mod = spec; fun = A('start_link'); args = [];
        } else return null;
        if (!mod) return null;
        var res = await I.callNow(mod, fun && fun.name ? fun.name : 'start_link', R.toList(args));
        if (res instanceof R.Tuple && res.items[0] && res.items[0].name === 'ok') {
          var pid = res.items[1];
          var proc = I.sched.get(pid);
          if (proc) {
            proc.onExitCbs.push(function (reason) {
              setTimeout(async function () {
                var r2 = await startChild(spec);
                if (r2) {
                  I.restartLog = I.restartLog || [];
                  I.restartLog.push(R.inspect(spec));
                }
              }, 10);
            });
          }
          return pid;
        }
        return null;
      }

      for (var i = 0; i < children.length; i++) {
        var p = await startChild(children[i]);
        if (p) started.push({ spec: children[i], pid: p, restarts: 0 });
      }
      I.supervisors = I.supervisors || [];
      I.supervisors.push({ children: started, strategy: strategy });
      return new R.Tuple([A('ok'), I.self()]);
    }

    Supervisor['which_children/1'] = function (a, I) { return []; };
    Supervisor['stop/1'] = function () { return A('ok'); };
  }

  OTP.registerBuiltins = registerBuiltins;

})(typeof window !== 'undefined' ? window : globalThis);
