/* Node 端引擎冒烟测试 */
const path = require('path');
const base = path.join(__dirname, '..', 'assets', 'js', 'engine');
require(path.join(base, 'lexer.js'));
require(path.join(base, 'parser.js'));
require(path.join(base, 'runtime.js'));
require(path.join(base, 'builtins.js'));
require(path.join(base, 'otp.js'));
require(path.join(base, 'interp.js'));
global.EL.OTP.registerBuiltins();

const EL = global.EL;
const R = EL.R;

const tests = [
  ['基础输出', 'IO.puts("hello")', 'hello\n'],
  ['算术', 'IO.puts(1 + 2 * 3)', '7\n'],
  ['除法', 'IO.puts(10 / 4)', '2.5\n'],
  ['字符串插值', 'x = 5\nIO.puts("x = #{x}")', 'x = 5\n'],
  ['变量重绑定', 'x = 1\nx = 2\nIO.puts(x)', '2\n'],
  ['列表', 'IO.inspect([1, 2, 3] ++ [4])', '[1, 2, 3, 4]\n'],
  ['元组', 'IO.inspect({:ok, 1})', '{:ok, 1}\n'],
  ['映射', 'IO.inspect(%{a: 1, b: 2})', '%{a: 1, b: 2}\n'],
  ['模式匹配解构', '[a, b] = [1, 2]\nIO.puts(a + b)', '3\n'],
  ['head|tail', '[h | t] = [1, 2, 3]\nIO.inspect(h)\nIO.inspect(t)', '1\n[2, 3]\n'],
  ['元组匹配', '{:ok, v} = {:ok, 42}\nIO.puts(v)', '42\n'],
  ['映射匹配', '%{name: n} = %{name: "tom", age: 3}\nIO.puts(n)', 'tom\n'],
  ['pin 运算符', 'x = 1\n^x = 1\nIO.puts("ok")', 'ok\n'],
  ['case', 'IO.puts(case 2 do\n 1 -> "one"\n _ -> "other"\nend)', 'other\n'],
  ['case 守卫', 'IO.puts(case 5 do\n n when n > 3 -> "big"\n _ -> "small"\nend)', 'big\n'],
  ['cond', 'IO.puts(cond do\n 1 > 2 -> "a"\n true -> "b"\nend)', 'b\n'],
  ['if/else', 'IO.puts(if false, do: "y", else: "n")', 'n\n'],
  ['匿名函数', 'add = fn a, b -> a + b end\nIO.puts(add.(1, 2))', '3\n'],
  ['捕获 &1', 'd = &(&1 * 2)\nIO.puts(d.(21))', '42\n'],
  ['模块函数', 'defmodule M do\n def add(a, b), do: a + b\n def fact(0), do: 1\n def fact(n), do: n * fact(n - 1)\nend\nIO.puts(M.add(2, 3))\nIO.puts(M.fact(5))', '5\n120\n'],
  ['默认参数', 'defmodule G do\n def hi(name \\\\ "world"), do: "hi " <> name\nend\nIO.puts(G.hi())\nIO.puts(G.hi("tom"))', 'hi world\nhi tom\n'],
  ['管道', 'IO.puts([1,2,3] |> Enum.map(fn x -> x * 2 end) |> Enum.sum())', '12\n'],
  ['Enum.reduce', 'IO.puts(Enum.reduce([1,2,3], 0, fn x, acc -> x + acc end))', '6\n'],
  ['递归求和', 'defmodule R2 do\n def sum([]), do: 0\n def sum([h | t]), do: h + sum(t)\nend\nIO.puts(R2.sum([1,2,3,4]))', '10\n'],
  ['结构体', 'defmodule User do\n defstruct name: "anon", age: 0\nend\nu = %User{name: "tom"}\nIO.inspect(u)', '%User{age: 0, name: "tom"}\n'],
  ['for 推导', 'IO.inspect(for x <- 1..3, do: x * x)', '[1, 4, 9]\n'],
  ['with', 'IO.puts(with {:ok, v} <- {:ok, 7} do\n v * 2\nend)', '14\n'],
  ['关键字列表', 'IO.inspect([a: 1, b: 2])', '[a: 1, b: 2]\n'],
  ['String 模块', 'IO.puts(String.upcase("elixir"))', 'ELIXIR\n'],
  ['Map 操作', 'm = %{a: 1}\nm = Map.put(m, :b, 2)\nIO.inspect(m)', '%{a: 1, b: 2}\n'],
  ['排序', 'IO.inspect(Enum.sort([3,1,2]))', '[1, 2, 3]\n'],
  ['spawn/send/receive', 'me = self()\nspawn(fn -> send(me, {:hi, 42}) end)\nreceive do\n {:hi, v} -> IO.puts(v)\nend', '42\n'],
  ['Task', 't = Task.async(fn -> 1 + 2 end)\nIO.puts(Task.await(t))', '3\n'],
  ['Agent', '{:ok, a} = Agent.start_link(fn -> 0 end)\nAgent.update(a, fn s -> s + 5 end)\nIO.puts(Agent.get(a, fn s -> s end))', '5\n'],
  ['GenServer', 'defmodule Counter do\n def start_link(_), do: GenServer.start_link(Counter, 0)\n def init(n), do: {:ok, n}\n def handle_call(:get, _from, n), do: {:reply, n, n}\n def handle_cast({:add, x}, n), do: {:noreply, n + x}\nend\n{:ok, c} = Counter.start_link([])\nGenServer.cast(c, {:add, 3})\nIO.puts(GenServer.call(c, :get))', '3\n'],
  ['不可变性', 'a = [1, 2, 3]\nb = List.replace_at(a, 0, 99)\nIO.inspect(a)\nIO.inspect(b)', '[1, 2, 3]\n[99, 2, 3]\n'],
  ['字符串拼接', 'IO.puts("a" <> "b")', 'ab\n'],
  ['in 运算符', 'IO.puts(2 in [1,2,3])', 'true\n'],
  ['多行管道', 'r =\n [1, 2, 3]\n |> Enum.map(fn x -> x * 3 end)\n |> Enum.sum()\nIO.puts(r)', '18\n'],
  ['map 更新语法', 'm = %{a: 1, b: 2}\nIO.inspect(%{m | a: 10})', '%{a: 10, b: 2}\n'],
  ['Enum.filter', 'IO.inspect(Enum.filter([1,2,3,4], fn x -> rem(x, 2) == 0 end))', '[2, 4]\n'],
  ['Enum.group_by', 'IO.inspect(Enum.group_by(["a","bb","cc"], &String.length/1))', null],
  ['match?', 'IO.puts(match?({:ok, _}, {:ok, 1}))', 'true\n'],
  ['模块属性', 'defmodule Cfg do\n @rate 2\n def calc(x), do: x * @rate\nend\nIO.puts(Cfg.calc(5))', '10\n'],
  ['守卫函数', 'defmodule G2 do\n def f(x) when is_integer(x) and x > 0, do: "pos"\n def f(_), do: "other"\nend\nIO.puts(G2.f(5))\nIO.puts(G2.f(-1))', 'pos\nother\n'],
  ['字符串 split', 'IO.inspect(String.split("a,b,c", ","))', '["a", "b", "c"]\n'],
];

(async function () {
  let pass = 0, fail = 0;
  for (const [name, src, expect] of tests) {
    const I = EL.createInterp({});
    let res;
    try {
      res = await I.run(src);
    } catch (e) {
      res = { ok: false, error: e, output: I.output };
    }
    let status;
    if (!res.ok) status = 'FAIL(err) ' + (res.error && res.error.message);
    else if (expect !== null && res.output !== expect) status = 'FAIL(out) got=' + JSON.stringify(res.output) + ' want=' + JSON.stringify(expect);
    else status = 'ok';
    if (status === 'ok') { pass++; console.log('  PASS  ' + name); }
    else { fail++; console.log('  X     ' + name + '  -> ' + status); }
  }
  console.log('\n通过 ' + pass + ' / ' + (pass + fail));
  process.exit(fail ? 1 : 0);
})();
