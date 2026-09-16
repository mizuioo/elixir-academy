/*
 * 内置模块与函数速查表（用于编辑器的自动补全 + 函数手册）
 */
(function (global) {
  'use strict';

  var EL = global.EL || (global.EL = {});

  // 名称 → 模块定位解析帮助
  var CATALOG = {
    'IO': {
      desc: '输入 / 输出',
      fns: [
        { name: 'puts',   arity: 1, desc: '打印，末尾自动换行' },
        { name: 'write',  arity: 1, desc: '打印，不换行' },
        { name: 'inspect',arity: 1, desc: '带类型标记打印（调试最爱）' },
        { name: 'gets',   arity: 1, desc: '读一行用户输入（先打印 prompt）' },
        { name: 'read',   arity: 1, desc: '读文件全部内容（传路径）' },
        { name: 'warn',   arity: 1, desc: '输出到标准错误 stderr' },
        { name: 'format', arity: 2, desc: '用占位符格式化输出' }
      ]
    },
    'Kernel': {
      desc: '核心函数（直接可用，不用前缀）',
      fns: [
        { name: 'is_integer', arity: 1, desc: '是整数吗' },
        { name: 'is_float',   arity: 1, desc: '是浮点数吗' },
        { name: 'is_binary',  arity: 1, desc: '是字符串吗' },
        { name: 'is_atom',    arity: 1, desc: '是原子吗' },
        { name: 'is_boolean', arity: 1, desc: '是布尔吗' },
        { name: 'is_nil',     arity: 1, desc: '是 nil 吗' },
        { name: 'is_list',    arity: 1, desc: '是列表吗' },
        { name: 'is_tuple',   arity: 1, desc: '是元组吗' },
        { name: 'is_map',     arity: 1, desc: '是映射吗' },
        { name: 'is_function',arity: 1, desc: '是函数吗' },
        { name: 'is_struct',  arity: 1, desc: '是结构体吗' },
        { name: 'is_pid',     arity: 1, desc: '是进程 pid 吗' },
        { name: 'div',        arity: 2, desc: '整数除法：div(10, 3) → 3' },
        { name: 'rem',        arity: 2, desc: '取余：rem(10, 3) → 1' },
        { name: 'length',     arity: 1, desc: '列表长度' },
        { name: 'hd',         arity: 1, desc: '取列表的第一个元素' },
        { name: 'tl',         arity: 1, desc: '取列表的剩余部分' },
        { name: 'elem',       arity: 2, desc: '取元组的第 i 项' },
        { name: 'put_elem',   arity: 3, desc: '返回新元组（替换第 i 项）' },
        { name: 'to_string',  arity: 1, desc: '把任意值转成字符串' },
        { name: 'to_integer', arity: 1, desc: '解析字符串为整数' },
        { name: 'raise',      arity: 1, desc: '抛出一个 RuntimeError' },
        { name: 'abs',        arity: 1, desc: '绝对值' },
        { name: '+',          arity: 2, desc: '算术 + 比较（用中缀）' },
        { name: '*',          arity: 2, desc: '乘法（同上）' }
      ]
    },
    'Enum': {
      desc: '列表（以及一切可枚举对象）的高阶操作',
      fns: [
        { name: 'map',       arity: 2, desc: '对每一项调用 fun → 新列表' },
        { name: 'filter',    arity: 2, desc: '留下 fun 返回真值的项' },
        { name: 'reduce',    arity: 3, desc: '从初始值折叠（acc ← fun(x, acc)）' },
        { name: 'reduce',    arity: 2, desc: '无初值折叠（首项作为初值）' },
        { name: 'sum',       arity: 1, desc: '求和' },
        { name: 'count',     arity: 1, desc: '元素个数' },
        { name: 'reverse',   arity: 1, desc: '反转顺序' },
        { name: 'sort',      arity: 1, desc: '升序排序' },
        { name: 'sort',      arity: 2, desc: '用 fun 比较排序' },
        { name: 'min',       arity: 1, desc: '最小值' },
        { name: 'min',       arity: 2, desc: 'a, b 取小' },
        { name: 'max',       arity: 1, desc: '最大值' },
        { name: 'max',       arity: 2, desc: 'a, b 取大' },
        { name: 'member?',   arity: 2, desc: 'value 出现在 enum 中吗' },
        { name: 'any?',      arity: 1, desc: '至少一个为真' },
        { name: 'all?',      arity: 1, desc: '全部为真' },
        { name: 'to_list',   arity: 1, desc: '转成普通列表' },
        { name: 'take',      arity: 2, desc: '取前 n 项' },
        { name: 'drop',      arity: 2, desc: '去掉前 n 项' },
        { name: 'zip',       arity: 1, desc: '按位打包成元组列表' },
        { name: 'unzip',     arity: 1, desc: 'zip 的反向操作' },
        { name: 'group_by',  arity: 2, desc: '按 fun 结果分组' },
        { name: 'concat',    arity: 1, desc: '把一堆列表拼成一个大列表' },
        { name: 'flat_map',  arity: 2, desc: 'map 然后 concat' },
        { name: 'join',      arity: 2, desc: '用分隔符把列表拼成字符串' }
      ]
    },
    'String': {
      desc: '字符串处理（Elixir 的字符串底层是 UTF-8 二进制）',
      fns: [
        { name: 'length',     arity: 1, desc: '字符个数' },
        { name: 'upcase',     arity: 1, desc: '转大写' },
        { name: 'downcase',   arity: 1, desc: '转小写' },
        { name: 'trim',       arity: 1, desc: '去掉首尾空白' },
        { name: 'split',      arity: 2, desc: '用分隔符拆成列表' },
        { name: 'replace',    arity: 3, desc: '替换子串' },
        { name: 'contains?',  arity: 2, desc: '是否包含某子串' },
        { name: 'starts_with?',arity: 2, desc: '是否以某字符串开头' },
        { name: 'ends_with?', arity: 2, desc: '是否以某字符串结尾' },
        { name: 'reverse',    arity: 1, desc: '反转字符顺序' },
        { name: 'at',         arity: 2, desc: '取第 i 个字符' },
        { name: 'to_integer', arity: 1, desc: '解析为整数' },
        { name: 'first',      arity: 1, desc: '首字符' },
        { name: 'last',       arity: 1, desc: '末字符' }
      ]
    },
    'Map': {
      desc: '映射操作（返回新映射，不修改原映射）',
      fns: [
        { name: 'get',        arity: 2, desc: '取值，没有就返回 nil' },
        { name: 'get',        arity: 3, desc: '取值，没有就返回 default' },
        { name: 'put',        arity: 3, desc: '返回新映射（含 k:v）' },
        { name: 'delete',     arity: 2, desc: '删除键' },
        { name: 'keys',       arity: 1, desc: '所有键（列表）' },
        { name: 'values',     arity: 1, desc: '所有值（列表）' },
        { name: 'has_key?',   arity: 2, desc: '是否含某个键' },
        { name: 'merge',      arity: 2, desc: '合并两个映射' },
        { name: 'size',       arity: 1, desc: '键的数量' },
        { name: 'to_list',    arity: 1, desc: '转成 {key, value} 列表' },
        { name: 'new',        arity: 1, desc: '从关键字列表建映射' }
      ]
    },
    'List': {
      desc: '列表操作（返回新列表，原列表不变）',
      fns: [
        { name: 'first',      arity: 1, desc: '第一个元素' },
        { name: 'last',       arity: 1, desc: '最后一个元素' },
        { name: 'wrap',       arity: 1, desc: '把值包装成单元素列表' },
        { name: 'delete',     arity: 2, desc: '删掉第一个等于 v 的元素' },
        { name: 'delete_at',  arity: 2, desc: '删掉第 i 项' },
        { name: 'replace_at', arity: 3, desc: '返回新列表（替换第 i 项）' },
        { name: 'insert_at',  arity: 3, desc: '返回新列表（第 i 位插入 v）' },
        { name: 'flatten',    arity: 1, desc: '把嵌套列表展平一层' },
        { name: 'duplicate',  arity: 2, desc: '把 v 重复 n 次' }
      ]
    },
    'Tuple': {
      desc: '元组操作',
      fns: [
        { name: 'append',     arity: 2, desc: '末尾追加一项（返回新元组）' },
        { name: 'delete_at',  arity: 2, desc: '删除第 i 项' },
        { name: 'insert_at',  arity: 3, desc: '插入一项' },
        { name: 'to_list',    arity: 1, desc: '转成列表' }
      ]
    },
    'Range': {
      desc: '区间（惰性序列）',
      fns: [
        { name: 'to_list',    arity: 1, desc: '把区间展开成列表' }
      ]
    },
    'Integer': {
      desc: '整数工具',
      fns: [
        { name: 'parse',      arity: 1, desc: '把字符串解析为整数' },
        { name: 'to_string',  arity: 1, desc: '整数转字符串' },
        { name: 'is_even',    arity: 1, desc: '偶数？' },
        { name: 'is_odd',     arity: 1, desc: '奇数？' }
      ]
    },
    'Float': {
      desc: '浮点工具',
      fns: [
        { name: 'parse',      arity: 1, desc: '把字符串解析为浮点数' },
        { name: 'to_string',  arity: 1, desc: '浮点转字符串' }
      ]
    },
    'Keyword': {
      desc: '关键字列表 [k: v, ...] 操作',
      fns: [
        { name: 'get',        arity: 3, desc: '取值，没有就返回 default' },
        { name: 'put',        arity: 3, desc: '加一个 k:v（前者优先）' },
        { name: 'delete',     arity: 2, desc: '删除指定键' },
        { name: 'has_key?',   arity: 2, desc: '是否有这个键' },
        { name: 'keys',       arity: 1, desc: '所有键（列表）' }
      ]
    }
  };

  // OTP / 并发
  CATALOG['Process'] = {
    desc: '进程与信号（OTP 入门）',
    fns: [
      { name: 'spawn',     arity: 1, desc: '起一个新进程跑 fun，返回 pid' },
      { name: 'spawn',     arity: 3, desc: '起新进程跑 Module.fun(args)' },
      { name: 'send',      arity: 2, desc: '向 pid 发消息' },
      { name: 'self',      arity: 0, desc: '当前进程的 pid' },
      { name: 'alive?',    arity: 1, desc: '进程还活着吗' },
      { name: 'exit',      arity: 2, desc: '让进程以 reason 退出' },
      { name: 'link',      arity: 1, desc: '与目标进程建立链接' }
    ]
  };
  CATALOG['Task'] = {
    desc: 'Task —— 一次性异步任务',
    fns: [
      { name: 'async',     arity: 1, desc: '异步执行 fun，返回 %Task{}' },
      { name: 'await',     arity: 1, desc: '等待异步任务返回值' },
      { name: 'await_many',arity: 1, desc: '等待多个任务，按列表顺序返回值' }
  ]};
  CATALOG['Agent'] = {
    desc: 'Agent —— 专门保存状态的进程',
    fns: [
      { name: 'start_link',  arity: 1, desc: '启动一个 Agent（传 fn 返回初值）' },
      { name: 'get',         arity: 3, desc: '读 Agent 里的状态' },
      { name: 'update',      arity: 3, desc: '改 Agent 里的状态' },
      { name: 'get_and_update',arity: 3, desc: '改状态并把旧值返回' },
      { name: 'stop',        arity: 2, desc: '停掉 Agent' }
  ]};
  CATALOG['GenServer'] = {
    desc: 'GenServer —— 通用的服务端进程',
    fns: [
      { name: 'start_link', arity: 2, desc: '用 module + args 启动 GenServer' },
      { name: 'start_link', arity: 3, desc: '同上，多传一个 name' },
      { name: 'call',       arity: 2, desc: '同步请求（会等 handle_call 回复）' },
      { name: 'call',       arity: 3, desc: '同步请求 + 超时时间' },
      { name: 'cast',       arity: 2, desc: '异步请求（不等回复）' },
      { name: 'reply',      arity: 2, desc: '在 handle_call 之外主动回复' },
      { name: 'stop',       arity: 2, desc: '让 GenServer 停下' }
  ]};
  CATALOG['Supervisor'] = {
    desc: 'Supervisor —— 自动重启策略',
    fns: [
      { name: 'start_link', arity: 2, desc: '启动监督者，参数 [child_spec] + opts' }
  ]};

  EL.BUILTIN_CATALOG = CATALOG;
  EL.MODULE_NAMES = Object.keys(CATALOG);

})(typeof window !== 'undefined' ? window : globalThis);