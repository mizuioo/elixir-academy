/*
 * 课程体系（第 4~6 阶段）：函数式编程 / 控制流 / 并发与 OTP
 */
(function (global) {
  'use strict';

  global.STAGES_B = [

    // ===================== 阶段 4 =====================
    {
      id: 's4',
      title: '第四瓶魔药：函数式的快乐',
      subtitle: '把"怎么做"变成"是什么"，管道一开，代码如诗',
      icon: '⚙️',
      color: '#FF9F43',
      lessons: [
        {
          id: 's4l1',
          title: '第 1 课 · 匿名函数与 <code>&</code> 简写',
          minutes: 10,
          blocks: [
            { t: 'p', text: '前面的代码只是"<b>句子</b>"。这一阶段开始我们要写"<b>函数</b>" —— 给电脑起一些<b>能反复用</b>的小咒语。' },
            { t: 'analogy', text: '<b>🎭 今日登场</b><br>阿波举手："<code>add = fn a, b -> a + b end</code> ……这一坨怪怪的东西是什么？"<br>好眼光 —— 它就是一个函数。我们从最简单的开始。' },
            { t: 'p', text: '在 Elixir 里，<b>函数本身也是一种值</b>（"一等公民"），可以绑到变量上、传给别人、甚至在函数里造新函数。没有名字的就叫<b>匿名函数</b>，用 <code>fn ... end</code> 造。' },
            { t: 'code', title: '造一个函数', code: 'add = fn a, b -> a + b end\n\nIO.puts(add.(3, 4))   # 7  ← 注意调用匿名函数要用 .( )' },
            { t: 'p', text: '那个<b>点</b>很重要：<code>add.(3, 4)</code> 而不是 <code>add(3, 4)</code>。Elixir 用点来区分"<b>匿名函数</b>"和"<b>模块里的具名函数</b>"。' },
            { t: 'p', text: '同一个名字可以有好几个"分身"，靠<b>参数模式</b>自动选 —— 这就是模式匹配大显身手的场合：' },
            { t: 'code', title: '多分身', code: 'talk = fn\n  {:ok, msg} -> "成功了：#{msg}"\n  {:error, msg} -> "失败了：#{msg}"\nend\n\nIO.puts(talk.({:ok, "登录"}))\nIO.puts(talk.({:error, "超时"}))' },
            { t: 'p', text: '写<b>短函数</b>的时候，<code>&amp;</code> 简写能省好多字 —— <code>&amp;1</code> / <code>&amp;2</code> 代表第 1、2 个参数。' },
            { t: 'code', title: '简写', code: 'double = &(&1 * 2)\nIO.puts(double.(21))          # 42\n\nIO.inspect(Enum.map([1, 2, 3], &(&1 * 10)))\nIO.inspect(Enum.map(["a", "b"], &String.upcase/1))  # 直接引用现成函数' },
            { t: 'tip', text: '<code>&amp;String.upcase/1</code> 里的 <code>/1</code> 是<b>元数</b>（参数个数）。Elixir 里 <code>upcase/1</code> 和 <code>upcase/2</code> 是<b>两个不同的函数</b>，哪怕名字一样。' },
            { t: 'p', text: '<b>本章小结</b>：匿名函数 <code>fn ... end</code> 是"会变形的数据"；调用要带点 <code>.( )</code>；模式匹配 + <code>&amp;</code> 简写让短函数像句子一样自然。' },
            { t: 'p', text: '<b>下一步</b>：匿名函数只能<b>当场</b>用一会儿。真正写项目，我们把函数塞进<b>模块</b>，给它起名字、装参数默认值、互相调用 —— 就像给小咒语装进一本<b>咒语书</b>里。' }
          ],
          exercises: [
            {
              id: 's4l1e1',
              title: '练习：温度转换',
              prompt: '写一个匿名函数 <code>to_f</code>，把摄氏度转华氏度（<code>c * 9 / 5 + 32</code>），并用它算 100 度。',
              starter: '# TODO: 定义 to_f\nto_f = fn c -> c end\n\nIO.puts(to_f.(100))\n',
              solution: 'to_f = fn c -> c * 9 / 5 + 32 end\nIO.puts(to_f.(100))\n',
              checks: [
                { label: 'to_f.(100) 是 212.0', code: 'to_f.(100) == 212.0' },
                { label: 'to_f.(0) 是 32.0', code: 'to_f.(0) == 32.0' }
              ],
              hints: ['<code>fn c -&gt; c * 9 / 5 + 32 end</code>', '调用匿名函数别忘了点：<code>to_f.(100)</code>']
            },
            {
              id: 's4l1e2',
              title: '练习：& 简写',
              prompt: '用 <code>&</code> 简写定义一个"加感叹号"的函数 <code>shout</code>，并把它应用到列表 <code>["hi", "wow"]</code> 上。',
              starter: '# TODO: shout = &(&1 <> "!")\nshout = &(&1)\n\nIO.inspect(Enum.map(["hi", "wow"], shout))\n',
              solution: 'shout = &(&1 <> "!")\nIO.inspect(Enum.map(["hi", "wow"], shout))\n',
              checks: [
                { label: 'shout.("hi") 是 "hi!"', code: 'shout.("hi") == "hi!"' },
                { label: '映射结果是 ["hi!", "wow!"]', code: 'Enum.map(["hi", "wow"], shout) == ["hi!", "wow!"]' }
              ],
              hints: ['<code>&(&1 &lt;&gt; "!")</code>', '字符串拼接用 <code>&lt;&gt;</code>']
            }
          ]
        },

        {
          id: 's4l2',
          title: '第 2 课 · 具名函数与模块',
          minutes: 12,
          blocks: [
            { t: 'p', text: '真正的项目里，函数都住在<b>模块</b>里。模块用 <code>defmodule</code> 定义，函数用 <code>def</code>。' },
            { t: 'analogy', text: '<b>🎭 今日登场</b><br>阿波："函数为什么要住进模块？"<br>因为<b>所有好用的工具都分类放在抽屉里</b>：把字符串处理函数放"文字抽屉"，把数字处理函数放"数字抽屉"，把序列处理函数放"序列抽屉"。你自己的函数，也最好分门别类放进自己做的抽屉。' },
            { t: 'code', title: '第一个模块', code: 'defmodule Math do\n  def add(a, b) do\n    a + b\n  end\n\n  def square(x), do: x * x     # 一行写法\nend\n\nIO.puts(Math.add(1, 2))    # 3\nIO.puts(Math.square(5))    # 25' },
            { t: 'p', text: '几个关键点：' },
            { t: 'list', items: [
              '函数<b>最后一行的值</b>就是返回值 —— 没有 <code>return</code>',
              '<code>defp</code> 定义<b>私有</b>函数，外面调不到（就像抽屉里的小隔层）',
              '同名不同参数个数 = 不同函数（<code>add/2</code>、<code>add/3</code> 是两个）',
              '<code>def</code> 的参数本身可以是<b>模式</b>，多分支从上往下匹配'
            ] },
            { t: 'code', title: '模式 + 递归', code: 'defmodule Fact do\n  def calc(0), do: 1\n  def calc(n) when n > 0, do: n * calc(n - 1)\nend\n\nIO.puts(Fact.calc(5))   # 120' },
            { t: 'code', title: '默认参数', code: 'defmodule Greeter do\n  def hello(name \\\\ "世界") do\n    "你好，#{name}"\n  end\nend\n\nIO.puts(Greeter.hello())        # 你好，世界\nIO.puts(Greeter.hello("小明"))   # 你好，小明' },
            { t: 'p', text: '<b>本章小结</b>：模块 = 函数<b>抽屉</b>。<code>def</code> 给世界用，<code>defp</code> 留给抽屉里自己用。最后一行的值就是返回值 —— 没有 <code>return</code>，更轻。' },
            { t: 'p', text: '<b>下一步</b>：现在你有咒语了，但咒语叠起来写就成了<b>俄罗斯套娃</b>。下一节学一招让函数一个接一个像<b>流水线</b>一样串起来的语法 —— 管道操作符。' }
          ],
          exercises: [
            {
              id: 's4l2e1',
              title: '练习：计算器',
              prompt: '定义模块 <code>Calc</code>，实现 <code>add/2</code>、<code>sub/2</code>、<code>mul/2</code>、<code>divi/2</code>（除法用 <code>/</code>）。',
              starter: 'defmodule Calc do\n  # TODO: 实现 add / sub / mul / divi\nend\n',
              solution: 'defmodule Calc do\n  def add(a, b), do: a + b\n  def sub(a, b), do: a - b\n  def mul(a, b), do: a * b\n  def divi(a, b), do: a / b\nend\n',
              checks: [
                { label: 'add(3, 4) == 7', code: 'Calc.add(3, 4) == 7' },
                { label: 'sub(10, 4) == 6', code: 'Calc.sub(10, 4) == 6' },
                { label: 'mul(3, 5) == 15', code: 'Calc.mul(3, 5) == 15' },
                { label: 'divi(10, 4) == 2.5', code: 'Calc.divi(10, 4) == 2.5' }
              ],
              hints: ['一行写法：<code>def add(a, b), do: a + b</code>', '函数名别用 <code>div</code>（和内置函数重名），用 <code>divi</code>']
            },
            {
              id: 's4l2e2',
              title: '练习：成绩评级',
              prompt: '定义模块 <code>Grade</code>，<code>level/1</code>：90 分及以上 "A"，60 及以上 "B"，其余 "C"。用<b>守卫</b> <code>when</code> 写。',
              starter: 'defmodule Grade do\n  # TODO: 用三个 def + when 实现\nend\n',
              solution: 'defmodule Grade do\n  def level(score) when score >= 90, do: "A"\n  def level(score) when score >= 60, do: "B"\n  def level(_), do: "C"\nend\n',
              checks: [
                { label: '95 分是 A', code: 'Grade.level(95) == "A"' },
                { label: '75 分是 B', code: 'Grade.level(75) == "B"' },
                { label: '30 分是 C', code: 'Grade.level(30) == "C"' }
              ],
              hints: ['守卫写法：<code>def level(s) when s &gt;= 90, do: "A"</code>', '兜底分支写 <code>def level(_), do: "C"</code>']
            }
          ]
        },

        {
          id: 's4l3',
          title: '第 3 课 · 管道 <code>|&gt;</code>：工厂流水线',
          minutes: 10,
          blocks: [
            { t: 'p', text: '嵌套调用写成 <code>f(g(h(x)))</code> 要从<b>里往外</b>读，反人类。Elixir 给你<b>管道</b>：' },
            { t: 'code', title: '对比', code: '# 俄罗斯套娃 😵\nIO.puts(Enum.sum(Enum.filter(Enum.map([1, 2, 3, 4], fn x -> x * 3 end), fn x -> x > 6 end)))\n\n# 流水线 😎\nresult =\n  [1, 2, 3, 4]\n  |> Enum.map(fn x -> x * 3 end)\n  |> Enum.filter(fn x -> x > 6 end)\n  |> Enum.sum()\n\nIO.puts(result)' },
            { t: 'p', text: '<code>a |&gt; f(b)</code> 等价于 <code>f(a, b)</code> —— <b>左边变成右边的第一个参数</b>。' },
            { t: 'analogy', text: '<b>🏭 想象传送带</b><br>原料从左端放上去，经过一道道工序，右端掉出成品。<br>每一步只看"上一步给了我啥"，不用看"全局是什么"。<br>你照着这个思路写，代码读起来就像<b>流水线配方</b>。' },
            { t: 'tip', text: '管道之所以这么顺，是因为每一步都<b>返回新数据</b>（不可变！）。这就是第 3 阶段埋下的伏笔 —— 没有那个铺垫，管道就成了笑话。' },
            { t: 'p', text: '<b>本章小结</b>：<code>|&gt;</code> 把"嵌套调用"换成"流水线"。从这一刻起，你的 Elixir 代码会越写越像<b>配方</b>，越写越不像<b>俄罗斯套娃</b>。' },
            { t: 'p', text: '<b>下一步</b>：管道让我们能优雅地把函数当积木拼起来。下一节介绍让函数当<b>积木</b>用的几种经典方式 —— <code>map</code>、<code>filter</code>、<code>reduce</code>，以及背后那个大宝藏 <code>Enum</code> 模块。' }
          ],
          exercises: [
            {
              id: 's4l3e1',
              title: '练习：句子加工',
              prompt: '把 <code>" hello elixir world "</code> 变成 <code>"HELLO ELIXIR WORLD"</code>：去空格 → 转大写。用管道。',
              starter: 'result =\n  " hello elixir world "\n  |> String.trim()\n  # TODO: 再加一步 String.upcase\n\nIO.puts(result)\n',
              solution: 'result =\n  " hello elixir world "\n  |> String.trim()\n  |> String.upcase()\n\nIO.puts(result)\n',
              checks: [
                { label: '结果是 "HELLO ELIXIR WORLD"', code: 'result == "HELLO ELIXIR WORLD"' }
              ],
              hints: ['<code>|&gt; String.upcase()</code>', '管道把左边当作第一个参数传进去']
            },
            {
              id: 's4l3e2',
              title: '练习：把嵌套改写成管道',
              prompt: '下面这行太难读了，请用管道重写，结果存到 <code>total</code>。',
              starter: 'nums = [1, 2, 3, 4, 5, 6]\n\n# 嵌套版（请改写成管道）\ntotal = Enum.sum(Enum.filter(nums, fn x -> rem(x, 2) == 0 end))\n\nIO.puts(total)\n',
              solution: 'nums = [1, 2, 3, 4, 5, 6]\ntotal =\n  nums\n  |> Enum.filter(fn x -> rem(x, 2) == 0 end)\n  |> Enum.sum()\n\nIO.puts(total)\n',
              checks: [
                { label: 'total 是 12', code: 'total == 12' }
              ],
              hints: ['先 <code>nums</code>，再 <code>|&gt; Enum.filter(...)</code>，最后 <code>|&gt; Enum.sum()</code>', '偶数之和：2 + 4 + 6 = 12']
            }
          ]
        },

        {
          id: 's4l4',
          title: '第 4 课 · 高阶函数：Enum 家族',
          minutes: 14,
          blocks: [
            { t: 'p', text: '<b>高阶函数</b> = 把函数当参数传进去。<code>Enum</code> 模块就是靠它横扫天下的。' },
            { t: 'analogy', text: '<b>🎭 今日登场</b><br>阿波："把函数传给函数？函数又不能像数据那样传来传去啊？"<br>—— 在 Elixir 里，<b>函数就是数据</b>。这一点比大多数语言都更激进，但习惯了以后超爽。' },
            { t: 'code', title: '四大金刚', code: 'nums = [1, 2, 3, 4]\n\nIO.inspect(Enum.map(nums, &(&1 * 2)))            # 变形：[2, 4, 6, 8]\nIO.inspect(Enum.filter(nums, &(&1 > 2)))          # 筛选：[3, 4]\nIO.inspect(Enum.sum(nums))                        # 求和：10\nIO.inspect(Enum.reduce(nums, 0, fn x, acc -> x + acc end))  # 归约：10' },
            { t: 'p', text: '<code>reduce</code> 是万金油：拿一个"累加器（accumulator）"，逐个把元素揉进去。map/filter/sum 都能用它实现。' },
            { t: 'code', title: 'reduce 的心智模型', code: '# reduce([1, 2, 3], 0, fn x, acc -> x + acc end)\n# 第 1 步：acc = 0 + 1 = 1\n# 第 2 步：acc = 1 + 2 = 3\n# 第 3 步：acc = 3 + 3 = 6\n\n# 再来个字符串版的\nnames = ["小明", "小红"]\nIO.puts(Enum.reduce(names, "", fn n, acc -> acc <> n <> " " end))' },
            { t: 'code', title: '更多好用的', code: 'IO.inspect(Enum.sort([3, 1, 2]))\nIO.inspect(Enum.uniq([1, 1, 2]))\nIO.inspect(Enum.take([1, 2, 3, 4], 2))\nIO.inspect(Enum.any?([1, 2, 3], &(&1 > 2)))\nIO.inspect(Enum.all?([1, 2, 3], &(&1 > 0)))\nIO.inspect(Enum.find([1, 2, 3], &(&1 > 1)))\nIO.inspect(Enum.group_by(["a", "bb", "cc"], &String.length/1))' },
            { t: 'tip', text: '函数的参数顺序有讲究：<code>Enum</code> 的函数总是<b>集合在前</b>，这样才好配合管道 <code>|&gt;</code>。记不住就翻那个「📖 函数速查」。' },
            { t: 'p', text: '<b>本章小结</b>：<code>Enum.map</code> 变形、<code>filter</code> 筛选、<code>reduce</code> 万能归约 —— 三大件撑起一半的日常编码。' },
            { t: 'p', text: '<b>下一步</b>：你可能隐约发现 —— 这些函数背后都在<b>递归</b>。理解递归不是为了日常写，而是为了能看懂 Elixir 的底层 —— 以及处理那些 <code>Enum</code> 搞不定的特殊情况。' }
          ],
          exercises: [
            {
              id: 's4l4e1',
              title: '练习：购物车结算',
              prompt: '有一车商品 <code>[%{name: "苹果", price: 3}, %{name: "香蕉", price: 5}, %{name: "西瓜", price: 20}]</code>。算出总价 <code>total</code>（用 reduce 或 sum + map）。',
              starter: 'cart = [%{name: "苹果", price: 3}, %{name: "香蕉", price: 5}, %{name: "西瓜", price: 20}]\n\n# TODO: 算出 total\ntotal = 0\n\nIO.puts(total)\n',
              solution: 'cart = [%{name: "苹果", price: 3}, %{name: "香蕉", price: 5}, %{name: "西瓜", price: 20}]\ntotal =\n  cart\n  |> Enum.map(fn item -> item.price end)\n  |> Enum.sum()\n\nIO.puts(total)\n',
              checks: [
                { label: 'total 是 28', code: 'total == 28' }
              ],
              hints: ['先 <code>Enum.map(&amp;(&amp;1.price))</code> 取出价格，再 <code>Enum.sum()</code>', '或者一步到位：<code>Enum.reduce(cart, 0, fn item, acc -&gt; acc + item.price end)</code>']
            },
            {
              id: 's4l4e2',
              title: '练习：及格名单',
              prompt: '学生成绩 <code>[{"小明", 85}, {"小红", 58}, {"小刚", 92}]</code>。找出<b>及格（&gt;=60）</b>的，按分数<b>从高到低</b>排序，结果存 <code>passed</code>。',
              starter: 'scores = [{"小明", 85}, {"小红", 58}, {"小刚", 92}]\n\n# TODO: 筛选 + 排序（降序）\npassed = scores\n\nIO.inspect(passed)\n',
              solution: 'scores = [{"小明", 85}, {"小红", 58}, {"小刚", 92}]\npassed =\n  scores\n  |> Enum.filter(fn {_, s} -> s >= 60 end)\n  |> Enum.sort_by(fn {_, s} -> s end, :desc)\n\nIO.inspect(passed)\n',
              checks: [
                { label: '只剩下两个人', code: 'length(passed) == 2' },
                { label: '第一名是 92 分的小刚', code: 'passed == [{"小刚", 92}, {"小明", 85}]' }
              ],
              hints: ['<code>Enum.filter(fn {_, s} -&gt; s &gt;= 60 end)</code>', '降序排序：<code>Enum.sort_by(fn {_, s} -&gt; s end, :desc)</code>']
            }
          ]
        },

        {
          id: 's4l5',
          title: '第 5 课 · 递归：自己调自己',
          minutes: 12,
          blocks: [
            { t: 'p', text: 'Elixir 没有 for/while 循环（真的！）。要"重复做一件事"，用<b>递归</b>。' },
            { t: 'analogy', text: '<b>🎭 今日登场</b><br>阿波："我以前都是 for 循环 —— 你让我<b>不循环</b>？"<br>不是不循环，是把循环拆成"<b>自己调自己</b>"。一开始会反直觉，但用多了反而比 for 循环更清楚。' },
            { t: 'code', title: '数数', code: 'defmodule Counter2 do\n  def count(0), do: IO.puts("发射！")\n  def count(n) do\n    IO.puts(n)\n    count(n - 1)\n  end\nend\n\nCounter2.count(3)' },
            { t: 'p', text: '套路永远是这两条：<ol><li><b>基线条件</b>：什么时候停（通常是空列表或 0）</li><li><b>递归步骤</b>：把问题变小，再调自己</li></ol>' },
            { t: 'code', title: '列表求和', code: 'defmodule Sum do\n  def of([]), do: 0                      # 基线：空列表\n  def of([head | tail]), do: head + of(tail)   # 变小：头 + 剩下的\nend\n\nIO.puts(Sum.of([1, 2, 3, 4]))   # 10' },
            { t: 'analogy', text: '<b>🧅 像剥洋葱</b><br>每次剥一层（<code>[head | tail]</code>），剥到没了（<code>[]</code>）就停。<br>递归 = 把"做同样的事，但规模变小"反复调自己 —— 规模小到基线，结束。' },
            { t: 'tip', text: '日常写代码优先用 <code>Enum</code>（它是别人写好的递归）。理解递归是为了<b>看懂原理</b>，以及处理 <code>Enum</code> 搞不定的情况。' },
            { t: 'p', text: '<b>本章小结</b>：递归 = 自己调自己。先定基线，再把问题变小，写两到三遍就习惯了。' },
            { t: 'p', text: '<b>下一步</b>：第四瓶魔药 —— 匿名函数、模块、管道、Enum、递归 —— 都讲完了。下一瓶开始我们正式学会<b>让程序做选择</b>：<code>case</code>、<code>cond</code>、<code>if</code>、<code>with</code>，以及 Elixir 独有的"两种错误处理哲学"。' }
          ],
          exercises: [
            {
              id: 's4l5e1',
              title: '练习：自己实现 sum',
              prompt: '定义模块 <code>MyList</code> 的 <code>sum/1</code>，用递归求列表元素之和（不许用 Enum.sum）。',
              starter: 'defmodule MyList do\n  # TODO: 空列表返回 0\n  def sum([]), do: 0\n\n  # TODO: [head | tail] 返回 head + sum(tail)\nend\n\nIO.puts(MyList.sum([1, 2, 3, 4, 5]))\n',
              solution: 'defmodule MyList do\n  def sum([]), do: 0\n  def sum([head | tail]), do: head + sum(tail)\nend\n\nIO.puts(MyList.sum([1, 2, 3, 4, 5]))\n',
              checks: [
                { label: 'sum([1,2,3,4,5]) 是 15', code: 'MyList.sum([1, 2, 3, 4, 5]) == 15' },
                { label: 'sum([]) 是 0', code: 'MyList.sum([]) == 0' }
              ],
              hints: ['两个 <code>def sum</code>，参数分别是 <code>[]</code> 和 <code>[head | tail]</code>', '递归步骤：<code>head + sum(tail)</code>']
            },
            {
              id: 's4l5e2',
              title: '练习：数一数有几个',
              prompt: '给 <code>MyList</code> 加 <code>length_of/1</code>，用递归数列表长度（不许用 length）。',
              starter: 'defmodule MyList do\n  def length_of([]), do: 0\n  # TODO: 递归步骤：1 + length_of(tail)\nend\n\nIO.puts(MyList.length_of([1, 2, 3]))\n',
              solution: 'defmodule MyList do\n  def length_of([]), do: 0\n  def length_of([_head | tail]), do: 1 + length_of(tail)\nend\n\nIO.puts(MyList.length_of([1, 2, 3]))\n',
              checks: [
                { label: 'length_of([1,2,3]) 是 3', code: 'MyList.length_of([1, 2, 3]) == 3' },
                { label: 'length_of([]) 是 0', code: 'MyList.length_of([]) == 0' }
              ],
              hints: ['不关心元素值就用 <code>[_head | tail]</code>', '每剥一层 +1']
            }
          ]
        }
      ],
      quiz: [
        { q: '调用匿名函数 <code>add</code> 的正确写法是？', options: ['add(1, 2)', 'add.(1, 2)', 'add[1, 2]'], answer: 1, explain: '匿名函数必须用<b>点</b>调用：<code>add.(1, 2)</code>。' },
        { q: '<code>a |> f(b)</code> 等价于？', options: ['f(a, b)', 'f(b, a)', 'a.f(b)'], answer: 0, explain: '管道把左边塞进右边的<b>第一个参数</b>位。' },
        { q: '模块里函数的返回值是？', options: ['return 语句后面', '函数最后一个表达式的值', '第一行'], answer: 1, explain: 'Elixir 没有 return，最后一行算出来啥就返回啥。' },
        { q: '<code>Enum.reduce([1,2,3], 0, fn x, acc -> x + acc end)</code> 的结果是？', options: ['0', '6', '[1, 2, 3]'], answer: 1, explain: 'reduce 把 0 作为初始累加器，逐个相加，得到 6。' },
        { q: '写递归函数最重要的是？', options: ['函数要很短', '必须有让递归停下来的基线条件', '必须用 Enum'], answer: 1, explain: '没有基线条件就会无限递归——这是新手最常见的翻车点。' }
      ]
    },

    // ===================== 阶段 5 =====================
    {
      id: 's5',
      title: '第五瓶魔药：控制流与错误处理',
      subtitle: 'case / cond / with，以及"让崩溃可控"的艺术',
      icon: '🛡️',
      color: '#E8577A',
      lessons: [
        {
          id: 's5l1',
          title: '第 1 课 · <code>case</code> 与守卫',
          minutes: 12,
          blocks: [
            { t: 'p', text: '<code>case</code> = "拿一个值去试好几个图案"。' },
            { t: 'analogy', text: '<b>🎭 今日登场</b><br>阿波："<code>case</code> 跟我之前学的 switch 一样？"<br>远远<b>更强</b>。switch 只能比"<code>==</code>"，case 可以比<b>形状</b>（模式匹配）甚至<b>条件</b>（守卫）。' },
            { t: 'code', title: '基本用法', code: 'result = {:ok, "数据"}\n\nmsg = case result do\n  {:ok, data} -> "拿到：#{data}"\n  {:error, :timeout} -> "超时了，再试一次"\n  {:error, reason} -> "出错了：#{reason}"\n  _ -> "完全不认识"\nend\n\nIO.puts(msg)' },
            { t: 'p', text: '分支<b>从上往下</b>试，第一个匹配上的胜出。最后放个 <code>_ -&gt;</code> 兜底是好习惯 —— 不然匹配不上会抛 <code>CaseClauseError</code>。' },
            { t: 'p', text: '光靠"形状"还不够，加<b>守卫 when</b>：' },
            { t: 'code', title: '守卫', code: 'check = fn n ->\n  case n do\n    n when n < 0 -> "负数"\n    0 -> "零"\n    n when n < 10 -> "个位数"\n    _ -> "大数"\n  end\nend\n\nIO.puts(check.(-5))\nIO.puts(check.(7))\nIO.puts(check.(100))' },
            { t: 'tip', text: '守卫里只能用<b>有限的</b>操作：比较、<code>is_xxx</code> 类型判断、简单算术。<b>不能</b>调用普通函数 —— 这是为了让守卫快且无副作用。' },
            { t: 'p', text: '<b>本章小结</b>：<code>case</code> 是 Elixir 的"<b>主选择器</b>"。分支可以按"形状"或"条件"匹配，记得最后放 <code>_</code> 兜底。' },
            { t: 'p', text: '<b>下一步</b>：当条件更多、更不规则时，<code>case</code> 也开始啰嗦。下一节我们看 <code>cond</code> 和 <code>if/unless</code> —— 更轻量的选择器。' }
          ],
          exercises: [
            {
              id: 's5l1e1',
              title: '练习：HTTP 状态码',
              prompt: '写函数 <code>describe/1</code>（放在模块 <code>Http</code> 里）：200 → "成功"，404 → "没找到"，500 → "服务器炸了"，其它 → "未知"。用 case。',
              starter: 'defmodule Http do\n  def describe(code) do\n    case code do\n      # TODO: 补上分支\n    end\n  end\nend\n',
              solution: 'defmodule Http do\n  def describe(code) do\n    case code do\n      200 -> "成功"\n      404 -> "没找到"\n      500 -> "服务器炸了"\n      _ -> "未知"\n    end\n  end\nend\n',
              checks: [
                { label: 'describe(200) 是 "成功"', code: 'Http.describe(200) == "成功"' },
                { label: 'describe(404) 是 "没找到"', code: 'Http.describe(404) == "没找到"' },
                { label: 'describe(999) 是 "未知"', code: 'Http.describe(999) == "未知"' }
              ],
              hints: ['分支格式：<code>200 -&gt; "成功"</code>', '别忘最后的 <code>_ -&gt; "未知"</code>']
            },
            {
              id: 's5l1e2',
              title: '练习：带守卫的判断',
              prompt: '在 <code>Http</code> 里加 <code>classify/1</code>：用守卫判断——小于 0 → "无效"，小于 300 → "正常"，小于 500 → "客户端问题"，其余 → "服务端问题"。',
              starter: 'defmodule Http do\n  def classify(code) do\n    cond do\n      # TODO: 用 cond 或 case + when 实现\n    end\n  end\nend\n',
              solution: 'defmodule Http do\n  def classify(code) do\n    cond do\n      code < 0 -> "无效"\n      code < 300 -> "正常"\n      code < 500 -> "客户端问题"\n      true -> "服务端问题"\n    end\n  end\nend\n',
              checks: [
                { label: 'classify(200) 是 "正常"', code: 'Http.classify(200) == "正常"' },
                { label: 'classify(404) 是 "客户端问题"', code: 'Http.classify(404) == "客户端问题"' },
                { label: 'classify(503) 是 "服务端问题"', code: 'Http.classify(503) == "服务端问题"' }
              ],
              hints: ['<code>cond</code> 从上往下找第一个为真的条件', '最后的 <code>true -&gt;</code> 是兜底']
            }
          ]
        },

        {
          id: 's5l2',
          title: '第 2 课 · <code>cond</code> / <code>if</code> / <code>unless</code>',
          minutes: 8,
          blocks: [
            { t: 'p', text: '<code>case</code> 是"匹配形状"，<code>cond</code> 是"第一个为真的条件"。' },
            { t: 'code', title: 'cond', code: 'score = 85\n\nlevel = cond do\n  score >= 90 -> "A"\n  score >= 80 -> "B"\n  score >= 60 -> "C"\n  true -> "D"          # 必须有兜底，否则 CondClauseError\nend\n\nIO.puts(level)' },
            { t: 'p', text: '<code>if</code> / <code>unless</code> 在 Elixir 里其实是"两个分支的宏"，返回值就是分支的值：' },
            { t: 'code', title: 'if 返回值', code: 'x = if 1 > 2, do: "大", else: "小"\nIO.puts(x)   # 小\n\nIO.puts(if true do\n  "走这里"\nelse\n  "不走这里"\nend)\n\n# unless = if not\nIO.puts(unless false, do: "unless 是反过来的 if")' },
            { t: 'tip', text: 'Elixir 里只有 <code>false</code> 和 <code>nil</code> 是"假"，其它（包括 <code>0</code> 和空字符串 <code>""</code>）都是"真"！这和很多语言不一样。' },
            { t: 'p', text: '<b>本章小结</b>：<code>cond</code> 是"找第一个真"，<code>if/unless</code> 是"两选一"。三者按场景挑一个用，都<b>有返回值</b>，可以塞进变量。' },
            { t: 'p', text: '<b>下一步</b>：当"<b>连着做好几步、每步都可能失败</b>"时，<code>case</code> 会变成噩梦版金字塔。下一节我们学一招<b>专门对付这种场景</b>的语法：<code>with</code>。' }
          ],
          exercises: [
            {
              id: 's5l2e1',
              title: '练习：打折',
              prompt: '写函数 <code>Shop.discount/1</code>：消费 &gt;= 1000 打 7 折，&gt;= 500 打 8 折，&gt;= 200 打 9 折，否则不打折。返回折后价格（浮点）。',
              starter: 'defmodule Shop do\n  def discount(amount) do\n    cond do\n      # TODO: 补条件\n    end\n  end\nend\n',
              solution: 'defmodule Shop do\n  def discount(amount) do\n    cond do\n      amount >= 1000 -> amount * 0.7\n      amount >= 500 -> amount * 0.8\n      amount >= 200 -> amount * 0.9\n      true -> amount * 1.0\n    end\n  end\nend\n',
              checks: [
                { label: '1000 元打 7 折', code: 'Shop.discount(1000) == 700.0' },
                { label: '600 元打 8 折', code: 'Shop.discount(600) == 480.0' },
                { label: '100 元不打折', code: 'Shop.discount(100) == 100.0' }
              ],
              hints: ['条件从大到小写，否则会被前面的先截胡', '记得返回的是<b>数值</b>，不是字符串']
            },
            {
              id: 's5l2e2',
              title: '练习：真假判断',
              prompt: '下面几行哪些会走 "真" 分支？把 <code>answers</code> 写成列表：依次判断 <code>0</code>、<code>""</code>、<code>nil</code>、<code>false</code> 是否"真"，结果存成 <code>[true, true, false, false]</code> 这样的形式。',
              starter: '# TODO: 用 if 判断每个值是否为真，组成列表\nanswers = []\n\nIO.inspect(answers)\n',
              solution: 'answers = [\n  if 0, do: true, else: false,\n  if "", do: true, else: false,\n  if nil, do: true, else: false,\n  if false, do: true, else: false\n]\nIO.inspect(answers)\n',
              checks: [
                { label: 'answers 是 [true, true, false, false]', code: 'answers == [true, true, false, false]' }
              ],
              hints: ['Elixir 里只有 <code>false</code> 和 <code>nil</code> 是假', '<code>0</code> 和 <code>""</code> 都是真！']
            }
          ]
        },

        {
          id: 's5l3',
          title: '第 3 课 · <code>with</code>：快乐路径',
          minutes: 12,
          blocks: [
            { t: 'p', text: '当你要"连着做好几步，每步都可能失败"，嵌套 <code>case</code> 会变成噩梦：<b>厄运金字塔</b>。' },
            { t: 'analogy', text: '<b>🎭 今日登场</b><br>阿波：看一眼例子就喊出来："这向右滑的阶梯比我的右——"<br>对，这就是著名的"<b>厄运金字塔</b>"。三步就三层，五步就五层 —— 没人愿意写、没人愿意读、没人愿意改。' },
            { t: 'code', title: '噩梦版', code: 'defmodule Steps do\n  def step1(), do: {:ok, 1}\n  def step2(a), do: {:ok, a + 1}\n  def step3(b), do: {:ok, b + 1}\nend\n\ncase Steps.step1() do\n  {:ok, a} ->\n    case Steps.step2(a) do\n      {:ok, b} ->\n        case Steps.step3(b) do\n          {:ok, c} -> {:ok, c}\n          {:error, e} -> {:error, e}\n        end\n      {:error, e} -> {:error, e}\n    end\n  {:error, e} -> {:error, e}\nend\n|> IO.inspect()' },
            { t: 'p', text: '用 <code>with</code> 秒变清爽：' },
            { t: 'code', title: 'with 版', code: 'result = with {:ok, a} <- {:ok, 1},\n                {:ok, b} <- {:ok, a + 1},\n                {:ok, c} <- {:ok, b + 1} do\n  {:ok, c}\nend\n\nIO.inspect(result)   # {:ok, 3}' },
            { t: 'p', text: '规则：<code>&lt;-</code> 左边是<b>模式</b>，右边是产生值的表达式。<ul><li>匹配成功 → 继续下一步</li><li>匹配失败 → <b>整个 with 立刻返回那个不匹配的值</b></li></ul>' },
            { t: 'code', title: '失败时', code: 'result = with {:ok, a} <- {:ok, 1},\n                {:ok, b} <- {:error, "第二步挂了"},\n                {:ok, c} <- {:ok, 3} do\n  {:ok, c}\nend\n\nIO.inspect(result)   # {:error, "第二步挂了"}   ← 直接短路返回' },
            { t: 'analogy', text: '<b>🎮 闯关游戏</b><br><code>with</code> 像闯关游戏：一路绿灯就到终点，任何一关红灯就<b>立刻带着红灯的原因</b>退出。<br>Python 里你可能见过 "early return"，Elixir 的 <code>with</code> 就是这思想的优雅版本。' },
            { t: 'p', text: '<b>本章小结</b>：连着做好几步、每步都可能失败时用 <code>with</code>，把"<b>厄运金字塔</b>"展平。这是 Elixir 处理"返回值路线"的关键利器。' },
            { t: 'p', text: '<b>下一步</b>：第五瓶魔药讲完了。下一瓶是重头戏 —— <b>并发与 OTP</b>。Elixir 最让别的语言羡慕的地方：几万个小进程一起干活的"轻量并发"，以及 OTP 的"<b>让它崩</b>"哲学。' }
          ],
          exercises: [
            {
              id: 's5l3e1',
              title: '练习：注册流程',
              prompt: '三步：检查名字 → 检查邮箱 → 创建用户。用 <code>with</code> 串起来（前两步直接给 <code>{:ok, ...}</code> 即可），成功后返回 <code>{:ok, "用户创建成功"}</code>。',
              starter: 'result = with {:ok, name} <- {:ok, "小明"},\n                # TODO: 第二步 {:ok, email} <- {:ok, "a@b.com"}\n                # TODO: 第三步 {:ok, _} <- {:ok, :saved}\n                do\n  {:ok, "用户创建成功"}\nend\n\nIO.inspect(result)\n',
              solution: 'result = with {:ok, name} <- {:ok, "小明"},\n                {:ok, email} <- {:ok, "a@b.com"},\n                {:ok, _} <- {:ok, :saved} do\n  {:ok, "用户创建成功"}\nend\n\nIO.inspect(result)\n',
              checks: [
                { label: '结果是 {:ok, "用户创建成功"}', code: 'result == {:ok, "用户创建成功"}' }
              ],
              hints: ['每一步格式：<code>{:ok, 变量} &lt;- 产生值的表达式</code>', '最后 <code>do ... end</code> 里写成功时的返回值']
            },
            {
              id: 's5l3e2',
              title: '练习：短路',
              prompt: '把第二步改成 <code>{:error, "邮箱已存在"}</code>，看看 <code>result</code> 是什么——<code>with</code> 会立刻短路。',
              starter: 'result = with {:ok, name} <- {:ok, "小明"},\n                {:ok, email} <- {:error, "邮箱已存在"},\n                {:ok, _} <- {:ok, :saved} do\n  {:ok, "用户创建成功"}\nend\n\nIO.inspect(result)\n',
              solution: 'result = with {:ok, name} <- {:ok, "小明"},\n                {:ok, email} <- {:error, "邮箱已存在"},\n                {:ok, _} <- {:ok, :saved} do\n  {:ok, "用户创建成功"}\nend\n\nIO.inspect(result)\n',
              checks: [
                { label: 'result 是 {:error, "邮箱已存在"}', code: 'result == {:error, "邮箱已存在"}' }
              ],
              hints: ['<code>with</code> 匹配不上就<b>原样返回</b>那个值', '所以错误会自动往上传，不用手写 if']
            }
          ]
        },

        {
          id: 's5l4',
          title: '第 4 课 · 错误处理：让它崩，还是接住',
          minutes: 12,
          blocks: [
            { t: 'p', text: 'Elixir 有两套处理错误的思路：' },
            { t: 'list', items: [
              '<b>预期内的失败</b>（用户输入错、网络超时）→ 返回值 <code>{:error, reason}</code>，交给模式匹配处理',
              '<b>不该发生的崩溃</b>（bug）→ 直接 <code>raise</code>，让<b>监督者</b>重启它 —— 这就是 OTP 的哲学："让它崩"'
            ] },
            { t: 'analogy', text: '<b>🎭 今日登场</b><br>阿波："那 <code>try/rescue</code> 呢？"<br>好问题。Elixir 里 <code>try/rescue</code> 是"<b>最后一道防线</b>"，不是万能钥匙。日常尽量走返回值路线，把 <code>try/rescue</code> 留给真正意外的情况。' },
            { t: 'code', title: '抛出与接住', code: 'result = try do\n  raise "数据库连接断了"\nrescue\n  e in RuntimeError -> "抓住了：#{e}"\nend\n\nIO.puts(result)' },
            { t: 'p', text: '日常更常用的是<b>返回值路线</b>：' },
            { t: 'code', title: '返回值路线（推荐）', code: 'defmodule Safe do\n  def parse_age(str) do\n    case Integer.parse(str) do\n      {age, _} when age >= 0 and age < 150 -> {:ok, age}\n      {_, _} -> {:error, "年龄不合理"}\n      :error -> {:error, "不是数字"}\n    end\n  end\nend\n\nIO.inspect(Safe.parse_age("18"))\nIO.inspect(Safe.parse_age("abc"))' },
            { t: 'tip', text: '<b>口诀</b>："<b>可预见的失败用返回值，不可预见的崩溃用 raise + 监督者重启</b>"。别用 <code>try/rescue</code> 去兜所有错误 —— 那是把 bug 藏起来，等下次爆炸。' },
            { t: 'p', text: '<b>本章小结</b>：Elixir 的错误处理有两条路 —— 返回值（日常）和 <code>raise + 监督者重启</code>（兜底）。能走第一条就不走第二条。' },
            { t: 'p', text: '<b>下一步</b>：第五瓶魔药全部讲完 —— 基础、模式匹配、不可变数据、函数式、控制流与错误处理。六瓶里你已经喝了五瓶。剩下的第六瓶是 Elixir 最让其它语言羡慕的：<b>并发与 OTP</b>。' }
          ],
          exercises: [
            {
              id: 's5l4e1',
              title: '练习：安全地解析数字',
              prompt: '实现 <code>Safe.parse_int/1</code>：能解析就返回 <code>{:ok, 数字}</code>，不能就返回 <code>{:error, "不是数字"}</code>。用 <code>Integer.parse/1</code> + case。',
              starter: 'defmodule Safe do\n  def parse_int(str) do\n    case Integer.parse(str) do\n      # TODO: {n, _} -> {:ok, n}；:error -> {:error, "不是数字"}\n    end\n  end\nend\n',
              solution: 'defmodule Safe do\n  def parse_int(str) do\n    case Integer.parse(str) do\n      {n, _} -> {:ok, n}\n      :error -> {:error, "不是数字"}\n    end\n  end\nend\n',
              checks: [
                { label: 'parse_int("42") 是 {:ok, 42}', code: 'Safe.parse_int("42") == {:ok, 42}' },
                { label: 'parse_int("abc") 是 error', code: 'Safe.parse_int("abc") == {:error, "不是数字"}' }
              ],
              hints: ['<code>Integer.parse("42")</code> 返回 <code>{42, ""}</code>，失败返回 <code>:error</code>', '用 case 匹配这两种形状']
            },
            {
              id: 's5l4e2',
              title: '练习：接住异常',
              prompt: '用 <code>try/rescue</code> 包住 <code>raise "boom"</code>，rescue 后返回字符串 <code>"接住了"</code>，结果存到 <code>caught</code>。',
              starter: 'caught = try do\n  raise "boom"\nrescue\n  # TODO: e in RuntimeError -> "接住了"\nend\n\nIO.puts(caught)\n',
              solution: 'caught = try do\n  raise "boom"\nrescue\n  e in RuntimeError -> "接住了"\nend\n\nIO.puts(caught)\n',
              checks: [
                { label: 'caught 是 "接住了"', code: 'caught == "接住了"' }
              ],
              hints: ['写法：<code>e in RuntimeError -&gt; "接住了"</code>', '<code>try ... rescue ... end</code> 整体有返回值']
            }
          ]
        }
      ],
      quiz: [
        { q: '<code>case</code> 没有任何分支匹配时会？', options: ['返回 nil', '抛出 CaseClauseError', '走最后一个分支'], answer: 1, explain: '所以养成写 <code>_ -&gt;</code> 兜底的习惯。' },
        { q: 'Elixir 里哪些值是"假"？', options: ['false 和 nil', 'false、nil、0、空字符串', '只有 false'], answer: 0, explain: '只有 <code>false</code> 和 <code>nil</code> 是假，<code>0</code> 和 <code>""</code> 都是真。' },
        { q: '<code>with</code> 中某一步 <code>{:ok, x} &lt;-</code> 没匹配上会怎样？', options: ['继续下一步', '整个 with 立刻返回那个不匹配的值', '抛出 MatchError'], answer: 1, explain: '短路返回——这正是 with 处理错误链最爽的地方。' },
        { q: '处理"用户输入了非法数据"最推荐的做法是？', options: ['raise 异常', '返回 {:error, 原因}', '返回 nil'], answer: 1, explain: '可预见的失败是<b>数据</b>，不是异常；用带标签的元组交给调用方处理。' },
        { q: '<code>cond</code> 里没有兜底的 <code>true -&gt;</code> 会？', options: ['返回 nil', '抛出 CondClauseError', '跳过'], answer: 1, explain: 'cond 需要至少一个恒真分支兜底，否则报错。' }
      ]
    },

    // ===================== 阶段 6 =====================
    {
      id: 's6',
      title: '第六瓶魔药：并发与 OTP',
      subtitle: '成千上万的小精灵，替你同时干活',
      icon: '🚀',
      color: '#4FC3F7',
      lessons: [
        {
          id: 's6l1',
          title: '第 1 课 · 进程：便宜到离谱',
          minutes: 12,
          blocks: [
            { t: 'p', text: 'Elixir 的并发单位叫<b>进程</b> —— 但<b>不是</b>操作系统的进程 / 线程！它是 BEAM 虚拟机自己管的小东西。' },
            { t: 'list', items: [
              '创建成本极低：一台机器可以跑<b>几百万个</b>',
              '每个进程有自己的内存，<b>不共享</b>（所以不需要锁！）',
              '进程之间只能靠<b>发消息</b>沟通',
              '一个进程崩了，不会影响别的进程'
            ] },
            { t: 'analogy', text: '<b>🎭 今日登场</b><br>阿波："别的语言里并发是多线程，要加锁、要小心共享内存……"<br>对，那是因为他们<b>共享内存</b>。Elixir 的做法是：<b>彻底不共享</b>。每个进程各自有房间，你只能<b>敲他门递纸条</b>。' },
            { t: 'code', title: '造一个进程', code: 'me = self()\nIO.inspect(me)          # #PID<0.1.0>  ← 自己的进程号\n\nspawn(fn ->\n  IO.puts("我是子进程，我的 pid 是 #{inspect(self())}")\n  send(me, {:hello, "我干完活了"})\nend)\n\nIO.puts("主进程继续干活，不等它")' },
            { t: 'analogy', text: '<b>🧚 每个进程像一个小精灵</b><br>有自己的小房间（内存），互相不抢东西，靠传纸条（消息）沟通。<br>雇一个小精灵几乎不要钱。' },
            { t: 'tip', text: '<code>spawn</code> 之后<b>主进程不会等</b>子进程 —— 这就是并发。想等结果，用 <code>receive</code> 或者下节课的 <code>Task</code>。' },
            { t: 'p', text: '<b>本章小结</b>：Elixir 的进程不是系统进程。它<b>极轻</b>、<b>独立</b>、<b>靠消息沟通</b>。这是后面所有 OTP 大厦的地基。' },
            { t: 'p', text: '<b>下一步</b>：进程造出来了，但还要能<b>通信</b>。下一节我们讲进程之间的"<b>邮箱</b>"和<b>收信</b>：<code>send</code> 和 <code>receive</code>。' }
          ],
          exercises: [
            {
              id: 's6l1e1',
              title: '练习：派个小精灵',
              prompt: '用 <code>spawn</code> 起一个进程，让它算 <code>6 * 7</code> 并把结果用 <code>send</code> 发回给自己。主进程 <code>receive</code> 收下，存到 <code>answer</code>。',
              starter: 'me = self()\n\nspawn(fn ->\n  # TODO: send(me, {:answer, 6 * 7})\nend)\n\n# TODO: 用 receive 收下 {:answer, v} -> v\nanswer = 0\n\nIO.puts(answer)\n',
              solution: 'me = self()\nspawn(fn ->\n  send(me, {:answer, 6 * 7})\nend)\n\nanswer = receive do\n  {:answer, v} -> v\nend\n\nIO.puts(answer)\n',
              checks: [
                { label: 'answer 是 42', code: 'answer == 42' }
              ],
              hints: ['子进程里：<code>send(me, {:answer, 6 * 7})</code>', '主进程：<code>receive do {:answer, v} -&gt; v end</code>']
            },
            {
              id: 's6l1e2',
              title: '练习：两个精灵赛跑',
              prompt: '起两个进程，分别发 <code>{:done, "A"}</code> 和 <code>{:done, "B"}</code>。主进程收两次消息，把收到的两个字符串拼起来存 <code>got</code>。',
              starter: 'me = self()\nspawn(fn -> send(me, {:done, "A"}) end)\n# TODO: 再起一个发 "B" 的进程\n\nfirst = receive do\n  {:done, x} -> x\nend\n# TODO: 再收一次，存 second\nsecond = ""\n\ngot = first <> second\nIO.puts(got)\n',
              solution: 'me = self()\nspawn(fn -> send(me, {:done, "A"}) end)\nspawn(fn -> send(me, {:done, "B"}) end)\n\nfirst = receive do\n  {:done, x} -> x\nend\nsecond = receive do\n  {:done, x} -> x\nend\n\ngot = first <> second\nIO.puts(got)\n',
              checks: [
                { label: 'got 里同时有 A 和 B', code: 'String.contains?(got, "A") and String.contains?(got, "B") and String.length(got) == 2' }
              ],
              hints: ['<code>receive</code> 每次从邮箱里取一条匹配的消息', '邮箱是先进先出的，但两个进程谁先发不一定']
            }
          ]
        },

        {
          id: 's6l2',
          title: '第 2 课 · 邮箱：send / receive',
          minutes: 12,
          blocks: [
            { t: 'p', text: '每个进程都有一个<b>邮箱</b>（mailbox）。<code>send</code> 投递，<code>receive</code> 取件。' },
            { t: 'code', title: '选择性接收', code: 'me = self()\n\nspawn(fn ->\n  send(me, {:noise, "忽略我"})\n  send(me, {:important, "重要情报"})\nend)\n\nreceive do\n  {:important, msg} -> IO.puts("收到：#{msg}")\nend' },
            { t: 'p', text: '重点：<code>receive</code> 是<b>选择性</b>的 —— 它会从邮箱里找<b>能匹配上的第一条</b>，不匹配的<b>继续留在邮箱里</b>（不会被丢掉）。' },
            { t: 'code', title: '超时保护', code: 'result = receive do\n  {:ping, x} -> "收到 ping: #{x}"\nafter\n  500 -> "等了 500 毫秒，没人理我"\nend\n\nIO.puts(result)' },
            { t: 'tip', text: '<code>after</code> 分支一定要加！不然没人发消息时进程会<b>永远卡住</b> —— 这是新手写并发最常见的死锁。' },
            { t: 'analogy', text: '<b>📮 邮箱 = 快递柜</b><br>别人往里塞包裹，你按"包裹长什么样"去取。取不到就（有超时的话）先走人。<br>用选择性接收，你就只关心你想处理的那一类消息，其他全部先压箱底。' },
            { t: 'p', text: '<b>本章小结</b>：<code>send</code> 投递、<code>receive</code> 选择性取件、<code>after</code> 兜底超时。三个动作记牢，你已经能写出最基础的并发程序了。' },
            { t: 'p', text: '<b>下一步</b>：手写 <code>spawn + send + receive</code> 太啰嗦了。下一节我们用 <code>Task</code> 把这套流程打包成两步：派活 + 等结果。' }
          ],
          exercises: [
            {
              id: 's6l2e1',
              title: '练习：加个超时',
              prompt: '写一段 <code>receive</code>：等 <code>{:msg, x}</code> 消息，但只等 300 毫秒；超时就返回 <code>"超时了"</code>。结果存 <code>result</code>（没人发消息，所以应该走超时分支）。',
              starter: 'result = receive do\n  {:msg, x} -> "收到: #{x}"\n# TODO: 加 after 300 -> "超时了"\nend\n\nIO.puts(result)\n',
              solution: 'result = receive do\n  {:msg, x} -> "收到: #{x}"\nafter\n  300 -> "超时了"\nend\n\nIO.puts(result)\n',
              checks: [
                { label: 'result 是 "超时了"', code: 'result == "超时了"' }
              ],
              hints: ['格式：<code>after</code> 换行 <code>300 -&gt; "超时了"</code>', '单位是毫秒']
            },
            {
              id: 's6l2e2',
              title: '练习：回声服务器',
              prompt: '写一个"回声"函数：主进程给自己发 <code>{:echo, "你好"}</code>，然后 receive 把它变成 <code>"回声: 你好"</code>，存到 <code>echoed</code>。',
              starter: 'me = self()\nsend(me, {:echo, "你好"})\n\n# TODO: receive 出 {:echo, text} -> "回声: " <> text\nechoed = ""\n\nIO.puts(echoed)\n',
              solution: 'me = self()\nsend(me, {:echo, "你好"})\n\nechoed = receive do\n  {:echo, text} -> "回声: " <> text\nend\n\nIO.puts(echoed)\n',
              checks: [
                { label: 'echoed 是 "回声: 你好"', code: 'echoed == "回声: 你好"' }
              ],
              hints: ['给自己发消息也是可以的：<code>send(self(), ...)</code>', '然后 receive 取出来']
            }
          ]
        },

        {
          id: 's6l3',
          title: '第 3 课 · Task：派活 + 等结果',
          minutes: 10,
          blocks: [
            { t: 'p', text: '"起进程 → 发消息 → 收结果"太啰嗦了。<code>Task</code> 把这套流程打包成两步：<code>async</code> 派活，<code>await</code> 等结果。' },
            { t: 'analogy', text: '<b>🎭 今日登场</b><br>阿波："我能不能就<b>派个活</b>然后等结果？别让我管邮箱那一套？"<br>能，这就是 Task —— 简化版的并发。' },
            { t: 'code', title: 'Task 基本用法', code: 'task = Task.async(fn ->\n  # 假装很耗时\n  Enum.sum(1..100)\nend)\n\nIO.puts("派完活，我先干点别的")\nresult = Task.await(task)\nIO.puts("结果是 #{result}")' },
            { t: 'p', text: '<code>await</code> 会<b>阻塞等待</b>（默认 5 秒超时）。想同时派多个活：' },
            { t: 'code', title: '并行干活', code: 'tasks = for n <- [10, 20, 30] do\n  Task.async(fn -> n * n end)\nend\n\nresults = Enum.map(tasks, fn t -> Task.await(t) end)\nIO.inspect(results)   # [100, 400, 900]' },
            { t: 'analogy', text: '<b>🛵 Task 像外卖订单</b><br>下单（<code>async</code>）之后你可以继续刷手机，饭好了再来取（<code>await</code>）。<br>多个订单就同时派，多个 <code>await</code> 一一取回来。' },
            { t: 'tip', text: '后台<b>不需要结果</b>的活，可以用 <code>Task.start/1</code> —— 派出去就不管了。' },
            { t: 'p', text: '<b>本章小结</b>：<code>Task.async</code> + <code>Task.await</code> 是 Elixir 并发的<b>简单款</b>。能应付大多数"边派边等"的场景。' },
            { t: 'p', text: '<b>下一步</b>：Task 用完一次就结束。想要"<b>长命</b>"的进程（保管一份状态、反复用）？下一节介绍 Elixir 的"<b>小管家</b>" —— <code>Agent</code>。' }
          ],
          exercises: [
            {
              id: 's6l3e1',
              title: '练习：并行求和',
              prompt: '用 <code>Task.async</code> 起一个任务算 <code>Enum.sum(1..100)</code>，用 <code>Task.await</code> 拿到结果存 <code>total</code>。',
              starter: '# TODO: task = Task.async(fn -> Enum.sum(1..100) end)\n\n# TODO: total = Task.await(task)\ntotal = 0\n\nIO.puts(total)\n',
              solution: 'task = Task.async(fn -> Enum.sum(1..100) end)\ntotal = Task.await(task)\nIO.puts(total)\n',
              checks: [
                { label: 'total 是 5050', code: 'total == 5050' }
              ],
              hints: ['<code>Task.async(fn -&gt; ... end)</code> 返回任务', '<code>Task.await(task)</code> 拿到结果']
            },
            {
              id: 's6l3e2',
              title: '练习：三个任务一起算',
              prompt: '用 <code>for</code> + <code>Task.async</code> 同时算 <code>1*1</code>、<code>2*2</code>、<code>3*3</code>，再用 <code>Enum.map</code> + <code>Task.await</code> 收集到 <code>results</code>。',
              starter: 'tasks = for n <- [1, 2, 3] do\n  # TODO: Task.async(fn -> n * n end)\nend\n\n# TODO: results = Enum.map(tasks, fn t -> Task.await(t) end)\nresults = []\n\nIO.inspect(results)\n',
              solution: 'tasks = for n <- [1, 2, 3] do\n  Task.async(fn -> n * n end)\nend\n\nresults = Enum.map(tasks, fn t -> Task.await(t) end)\nIO.inspect(results)\n',
              checks: [
                { label: 'results 是 [1, 4, 9]', code: 'results == [1, 4, 9]' }
              ],
              hints: ['<code>for n &lt;- [1, 2, 3] do ... end</code> 会得到一个列表', '每个 task 都要 await 才能拿到值']
            }
          ]
        },

        {
          id: 's6l4',
          title: '第 4 课 · Agent：看管状态的保险箱',
          minutes: 12,
          blocks: [
            { t: 'p', text: '数据不可变，那"<b>会变的状态</b>"（比如计数器）放哪？答案是：放在一个<b>专门的进程</b>里，让它替你保管。<code>Agent</code> 就是最简 version。' },
            { t: 'analogy', text: '<b>🎭 今日登场</b><br>阿波："数据<b>不能变</b>，那变量怎么++？"<br>你的<b>进程</b>可以变。你让一个进程"我管一个数字，要加 1 就给他发消息"，数字住在它屋里，外面摸不到。' },
            { t: 'code', title: '计数器', code: '{:ok, box} = Agent.start_link(fn -> 0 end)   # 初始状态 0\n\nAgent.update(box, fn n -> n + 1 end)           # 改状态\nAgent.update(box, fn n -> n + 1 end)\n\nvalue = Agent.get(box, fn n -> n end)          # 读状态\nIO.puts(value)   # 2' },
            { t: 'list', items: [
              '状态<b>住在一个进程里</b>，外面拿不到"引用"，只能通过消息改',
              '<code>Agent.get/update</code> 的函数在<b>那个进程内</b>执行，所以天然串行、不会有竞争',
              '外面看起来"共享"了状态，本质还是消息传递'
            ] },
            { t: 'analogy', text: '<b>🏦 Agent = 银行柜台</b><br>钱（状态）在柜台后面，你不能伸手拿，只能递单子（函数）让柜员操作。<br>每次操作都是"<b>给柜台发消息</b>"，不是直接动手。' },
            { t: 'p', text: '<b>本章小结</b>：Agent = 一位"只管一件事"的小管家。<b>状态</b>住在它屋里，外面只能通过 <code>get/update</code> 这两个动作访问。' },
            { t: 'p', text: '<b>下一步</b>：Agent 太简单，只能"<b>存东西</b>"。如果想"<b>按规矩办事</b>"（收到某种消息该干啥），下一节上 OTP 出场率最高的大角色 —— <code>GenServer</code>。' }
          ],
          exercises: [
            {
              id: 's6l4e1',
              title: '练习：计分板',
              prompt: '用 Agent 存初始分数 0，加 10 分、再加 5 分，最后读出 <code>score</code> 并打印。',
              starter: '# TODO: {:ok, box} = Agent.start_link(fn -> 0 end)\n\n# TODO: 加 10\n# TODO: 加 5\n\n# TODO: score = Agent.get(box, fn n -> n end)\nscore = 0\n\nIO.puts(score)\n',
              solution: '{:ok, box} = Agent.start_link(fn -> 0 end)\nAgent.update(box, fn n -> n + 10 end)\nAgent.update(box, fn n -> n + 5 end)\nscore = Agent.get(box, fn n -> n end)\nIO.puts(score)\n',
              checks: [
                { label: 'score 是 15', code: 'score == 15' }
              ],
              hints: ['<code>Agent.start_link(fn -&gt; 0 end)</code> 返回 <code>{:ok, pid}</code>', '<code>Agent.update(box, fn n -&gt; n + 10 end)</code>']
            },
            {
              id: 's6l4e2',
              title: '练习：购物篮',
              prompt: '用 Agent 存一个列表 <code>[]</code> 当购物篮，依次加入 <code>"苹果"</code> 和 <code>"香蕉"</code>，最后读出 <code>basket</code>。',
              starter: '# TODO: {:ok, cart} = Agent.start_link(fn -> [] end)\n\n# TODO: 加入 "苹果"：Agent.update(cart, fn list -> list ++ ["苹果"] end)\n# TODO: 加入 "香蕉"\n\n# TODO: basket = Agent.get(cart, fn list -> list end)\nbasket = []\n\nIO.inspect(basket)\n',
              solution: '{:ok, cart} = Agent.start_link(fn -> [] end)\nAgent.update(cart, fn list -> list ++ ["苹果"] end)\nAgent.update(cart, fn list -> list ++ ["香蕉"] end)\nbasket = Agent.get(cart, fn list -> list end)\nIO.inspect(basket)\n',
              checks: [
                { label: 'basket 是 ["苹果", "香蕉"]', code: 'basket == ["苹果", "香蕉"]' }
              ],
              hints: ['初始状态用空列表 <code>[]</code>', '加元素：<code>list ++ ["苹果"]</code>']
            }
          ]
        },

        {
          id: 's6l5',
          title: '第 5 课 · GenServer：OTP 的大管家',
          minutes: 16,
          blocks: [
            { t: 'p', text: 'Agent 只能存状态。想要<b>自定义逻辑</b>（"收到这个消息该干啥"），用 <code>GenServer</code> —— OTP 里出场率最高的角色。' },
            { t: 'analogy', text: '<b>🎭 今日登场</b><br>阿波："Agent 简单但太死板，能不能<b>按规矩</b>办事？"<br>能。GenServer 就是"有<b>服务窗口</b>的进程"：客户发请求，前台按你写的规矩处理，再回个话。' },
            { t: 'p', text: '你只要实现几个<b>回调</b>（callback），GenServer 帮你把进程、邮箱、循环全包了：' },
            { t: 'list', items: [
              '<code>init(args)</code> → <code>{:ok, 初始状态}</code>',
              '<code>handle_call(请求, from, 状态)</code>：同步调用，要回复 → <code>{:reply, 回复, 新状态}</code>',
              '<code>handle_cast(请求, 状态)</code>：异步，不回复 → <code>{:noreply, 新状态}</code>'
            ] },
            { t: 'code', title: '一个柜台', code: 'defmodule Counter do\n  def start_link(initial) do\n    GenServer.start_link(Counter, initial)\n  end\n\n  def init(n), do: {:ok, n}\n\n  def get(pid), do: GenServer.call(pid, :get)\n  def add(pid, n), do: GenServer.cast(pid, {:add, n})\n\n  def handle_call(:get, _from, state) do\n    {:reply, state, state}\n  end\n\n  def handle_cast({:add, n}, state) do\n    {:noreply, state + n}\n  end\nend\n\n{:ok, pid} = Counter.start_link(0)\nCounter.add(pid, 5)\nCounter.add(pid, 3)\nIO.puts(Counter.get(pid))   # 8' },
            { t: 'analogy', text: '<b>🏢 GenServer = 有前台的办公室</b><br><code>call</code> 是<b>打电话</b>（等对方答复）<br><code>cast</code> 是<b>发邮件</b>（发完就走，对方有空再处理）<br>前台按你写的规则处理每件事。' },
            { t: 'tip', text: '注意 <code>Counter.get/1</code> 这种"<b>包装函数</b>"是好习惯：把 <code>GenServer.call(pid, :get)</code> 藏在模块里，外面只管调 <code>Counter.get(pid)</code>。外面永远不需要知道是 GenServer。' },
            { t: 'p', text: '<b>本章小结</b>：GenServer = "<b>有规矩的进程</b>"。三个回调 <code>init</code>、<code>handle_call</code>、<code>handle_cast</code> 写完，你就有了一个能写、能读、能管状态的服务器。' },
            { t: 'p', text: '<b>下一步</b>：GenServer 用得好好的，但万一它崩了呢？下一节介绍 OTP 最反直觉也最强大的思想 —— <b>让它崩</b>，然后由 <code>Supervisor</code> 把它重启。' }
          ],
          exercises: [
            {
              id: 's6l5e1',
              title: '练习：做一个计数器',
              prompt: '照上面的例子写模块 <code>Counter</code>，启动初值 0，然后 add 5 和 add 3，读出 <code>value</code>（应为 8）。',
              starter: 'defmodule Counter do\n  def start_link(initial) do\n    GenServer.start_link(Counter, initial)\n  end\n\n  # TODO: init\n  # TODO: get / add 包装函数\n  # TODO: handle_call(:get, ...) 和 handle_cast({:add, n}, ...)\nend\n\n{:ok, pid} = Counter.start_link(0)\n# TODO: add 5、add 3\n# TODO: value = Counter.get(pid)\nvalue = 0\nIO.puts(value)\n',
              solution: 'defmodule Counter do\n  def start_link(initial) do\n    GenServer.start_link(Counter, initial)\n  end\n\n  def init(n), do: {:ok, n}\n\n  def get(pid), do: GenServer.call(pid, :get)\n  def add(pid, n), do: GenServer.cast(pid, {:add, n})\n\n  def handle_call(:get, _from, state) do\n    {:reply, state, state}\n  end\n\n  def handle_cast({:add, n}, state) do\n    {:noreply, state + n}\n  end\nend\n\n{:ok, pid} = Counter.start_link(0)\nCounter.add(pid, 5)\nCounter.add(pid, 3)\nvalue = Counter.get(pid)\nIO.puts(value)\n',
              checks: [
                { label: 'value 是 8', code: 'value == 8' },
                { label: '再 add 2 后是 10', code: 'Counter.add(pid, 2)' }
              ],
              hints: ['<code>handle_call</code> 返回 <code>{:reply, 回复, 新状态}</code>', '<code>handle_cast</code> 返回 <code>{:noreply, 新状态}</code>']
            },
            {
              id: 's6l5e2',
              title: '练习：待办清单服务',
              prompt: '写一个 <code>Todo</code> GenServer：状态是列表。<code>add(pid, item)</code> 用 cast 添加，<code>all(pid)</code> 用 call 返回全部。加两条后读出 <code>items</code>。',
              starter: 'defmodule Todo do\n  def start_link(_), do: GenServer.start_link(Todo, [])\n\n  # TODO: init(_) -> {:ok, []}\n\n  # TODO: add(pid, item) -> GenServer.cast(pid, {:add, item})\n  # TODO: all(pid) -> GenServer.call(pid, :all)\n\n  # TODO: handle_cast({:add, item}, items) -> {:noreply, items ++ [item]}\n  # TODO: handle_call(:all, _from, items) -> {:reply, items, items}\nend\n\n{:ok, pid} = Todo.start_link([])\n# TODO: 加 "买牛奶"、"写代码"\n# TODO: items = Todo.all(pid)\nitems = []\nIO.inspect(items)\n',
              solution: 'defmodule Todo do\n  def start_link(_), do: GenServer.start_link(Todo, [])\n\n  def init(_), do: {:ok, []}\n\n  def add(pid, item), do: GenServer.cast(pid, {:add, item})\n  def all(pid), do: GenServer.call(pid, :all)\n\n  def handle_cast({:add, item}, items) do\n    {:noreply, items ++ [item]}\n  end\n\n  def handle_call(:all, _from, items) do\n    {:reply, items, items}\n  end\nend\n\n{:ok, pid} = Todo.start_link([])\nTodo.add(pid, "买牛奶")\nTodo.add(pid, "写代码")\nitems = Todo.all(pid)\nIO.inspect(items)\n',
              checks: [
                { label: 'items 是 ["买牛奶", "写代码"]', code: 'items == ["买牛奶", "写代码"]' }
              ],
              hints: ['状态就是列表，添加用 <code>items ++ [item]</code>', 'call 要回复：<code>{:reply, items, items}</code>']
            }
          ]
        },

        {
          id: 's6l6',
          title: '第 6 课 · Supervisor：让它崩，然后重启',
          minutes: 12,
          blocks: [
            { t: 'p', text: 'OTP 最反直觉也最强大的思想：<b>不要拼命防崩溃，而是让崩溃的东西自动重启</b>。' },
            { t: 'analogy', text: '<b>🎭 今日登场</b><br>阿波："崩了不就是要修吗？"<br>在 OTP 里，崩了是<b>常态</b>。要修的不是崩本身，而是让另一个角色（监督者）把它<b>扶起来</b>。' },
            { t: 'p', text: '<code>Supervisor</code>（监督者）专门盯着一组进程，谁挂了就按策略重启谁。你只要告诉它"<b>启动谁</b>"：' },
            { t: 'code', title: '监督一个计数器', code: 'defmodule Counter do\n  use GenServer\n  def start_link(n), do: GenServer.start_link(Counter, n)\n  def init(n), do: {:ok, n}\n  def handle_call(:get, _from, n), do: {:reply, n, n}\n  def handle_cast({:add, x}, n), do: {:noreply, n + x}\nend\n\n{:ok, sup} = Supervisor.start_link(\n  [%{id: :my_counter, start: {Counter, :start_link, [0]}}],\n  strategy: :one_for_one\n)\n\nIO.puts("监督者启动完成")\nIO.inspect(sup)\n# 之后如果 Counter 进程挂了，监督者会自动再启一个' },
            { t: 'p', text: '常见策略：' },
            { t: 'list', items: [
              '<code>:one_for_one</code>：谁挂重启谁（最常用）',
              '<code>:one_for_all</code>：一个挂了，全部重启（进程间有依赖时用）',
              '<code>:rest_for_one</code>：挂的那个以及它<b>后面</b>启动的都重启'
            ] },
            { t: 'analogy', text: '<b>👩‍🏫 监督者 = 幼儿园老师</b><br>小朋友（进程）摔倒了，扶起来拍拍土继续玩，而不是给每个小朋友套上盔甲。<br>这就是"<b>让它崩</b>"的哲学。' },
            { t: 'tip', text: '真实系统里是<b>监督树</b>：最顶层监督中层，中层监督底层工人。整个应用是一棵树，局部崩溃不会影响全局 —— 这就是 Erlang 能做到 99.9999999% 可用率的秘密。' },
            { t: 'p', text: '<b>本章小结</b>：监督者 = "<b>让崩变成日常</b>"的角色。它按策略重启子进程，组合起来就成监督树。' },
            { t: 'p', text: '<b>下一步</b>：六瓶魔药全部喝完 —— 你已经从"<b>开口说第一句话</b>"走到"<b>指挥一群进程相互协作</b>"。接下来你愿意怎么玩，都随你：做小工具、做网站、做实时系统，Elixir 都接得住。恭喜出师！' }
          ],
          exercises: [
            {
              id: 's6l6e1',
              title: '练习：启动一个监督者',
              prompt: '启动一个 Supervisor 监督 <code>Counter</code>（前面定义过的模块），把返回的第一个元素存到 <code>status</code>（应为 <code>:ok</code>）。',
              starter: 'defmodule Counter do\n  def start_link(initial), do: GenServer.start_link(Counter, initial)\n  def init(n), do: {:ok, n}\n  def get(pid), do: GenServer.call(pid, :get)\n  def handle_call(:get, _from, state), do: {:reply, state, state}\nend\n\n# TODO: {:ok, sup} = Supervisor.start_link([...], strategy: :one_for_one)\nresult = {:error, "还没写"}\nstatus = elem(result, 0)\nIO.inspect(status)\n',
              solution: 'defmodule Counter do\n  def start_link(initial), do: GenServer.start_link(Counter, initial)\n  def init(n), do: {:ok, n}\n  def get(pid), do: GenServer.call(pid, :get)\n  def handle_call(:get, _from, state), do: {:reply, state, state}\nend\n\nresult = Supervisor.start_link(\n  [%{id: :counter, start: {Counter, :start_link, [0]}}],\n  strategy: :one_for_one\n)\nstatus = elem(result, 0)\nIO.inspect(status)\n',
              checks: [
                { label: 'status 是 :ok', code: 'status == :ok' }
              ],
              hints: ['子进程规格：<code>%{id: :counter, start: {Counter, :start_link, [0]}}</code>', '<code>elem(result, 0)</code> 取出元组的第一个元素']
            }
          ]
        }
      ],
      quiz: [
        { q: 'Elixir 的"进程"是什么？', options: ['操作系统进程', 'BEAM 虚拟机自己管理的超轻量执行单元', '线程'], answer: 1, explain: '它不是 OS 进程/线程，创建成本极低，一台机器能跑几百万个。' },
        { q: '进程之间如何交换数据？', options: ['共享内存', '发送和接收消息', '全局变量'], answer: 1, explain: '进程内存互相隔离，只能靠消息——所以几乎不需要锁。' },
        { q: '<code>receive</code> 找不到匹配的消息时会？', options: ['返回 nil', '一直等（除非写了 after 超时）', '报错'], answer: 1, explain: '所以生产代码一定要加 <code>after</code> 超时分支，否则进程会永久阻塞。' },
        { q: '<code>GenServer.call</code> 和 <code>cast</code> 的区别？', options: ['call 是异步的', 'call 同步等待回复，cast 发完就走', '没区别'], answer: 1, explain: 'call = 打电话等答复；cast = 发邮件不管回音。' },
        { q: 'OTP 对待崩溃的哲学是？', options: ['用 try/rescue 包住所有代码', '让它崩，由监督者自动重启', '尽量避免多进程'], answer: 1, explain: '"让它崩"——单个进程崩溃被隔离，监督者负责重启，系统整体继续服务。' }
      ]
    }
  ];

})(typeof window !== 'undefined' ? window : globalThis);
