/*
 * 重写工具：定位 blocks: [ ... ] 整段并替换
 * 用法：node tools/rewrite-blocks.js stages-a.js
 *       node tools/rewrite-blocks.js stages-b.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const TARGET = process.argv[2] || 'data/stages-a.js';

const REWRITES = {

  // ============ stages-a.js ============
  s3l4: `[
            { t: 'p', text: '到这里你应该明白了：Elixir 里<b>没有任何函数会改动你的数据</b>。所有"修改"函数都返回新值。' },
            { t: 'analogy', text: '<b>🎭 今日登场</b><br>阿波："那性能怎么办？每次都全量复制一份，不是很慢？"<br>这个问题问得好。请看下面这张图。' },
            { t: 'code', title: '对比一下', code: 'nums = [3, 1, 2]\\n\\nsorted = Enum.sort(nums)\\nIO.inspect(nums)     # [3, 1, 2]  ← 没变\\nIO.inspect(sorted)   # [1, 2, 3]  ← 新的\\n\\nadded = [0 | nums]      # 在头部加元素，超快\\nIO.inspect(added)    # [0, 3, 1, 2]' },
            { t: 'analogy', text: '<b>🧬 结构共享</b><br>不会全量复制。Elixir 用的是<b>结构共享</b>：新列表只造"<b>变化的那点新格子</b>"，剩下的部分<b>直接指向老数据</b>🧬。<br>因为老数据永远不会变，所以共享是绝对安全的。<br>这意味着 <code>[0 | nums]</code> 这种"加一个头"的操作是 O(1)，极快。' },
            { t: 'code', title: '写代码的正确姿势', code: '# ❌ 别的语言的思路（Elixir 里没用）\\n# list = List.append(list, x)  然后以为 list 变了\\n\\n# ✅ Elixir 的思路：把结果接到下一个操作\\nresult =\\n  [3, 1, 2]\\n  |> Enum.sort()\\n  |> Enum.map(fn x -> x * 10 end)\\n\\nIO.inspect(result)   # [10, 20, 30]' },
            { t: 'analogy', text: '<b>🚿 看到 <code>|&gt;</code> 没？</b><br>它是<b>管道操作符</b>：把左边的结果<b>塞</b>进右边的第一个参数。<code>[3, 1, 2] |&gt; Enum.sort()</code> 等价于 <code>Enum.sort([3, 1, 2])</code>。<br>管道让我们能从上到下、从小到大一路串下去读。这就是<b>Elixir 代码读起来像一篇文章</b>的秘密。' },
            { t: 'tip', text: '因为每次都返回新值，所以 Elixir 特别爱用<b>管道 <code>|&gt;</code></b> 把一串操作串起来。下一阶段的主角，全靠它。' },
            { t: 'p', text: '<b>本章小结</b>：Elixir 用"<b>结构共享</b>"让"每次造新值"也不会慢；用<b>管道 <code>|&gt;</code></b>把"每次造新值"写得优雅。两件事一起把 Elixir 的"函数式"哲学彻底落地。' },
            { t: 'p', text: '<b>下一步</b>：三瓶魔药 —— 入门、模式匹配、不可变数据 —— 都讲完了。下一瓶起，我们正式进入<b>函数式的快乐</b>：匿名函数、模块、管道，以及 Enum 高阶函数的正确打开方式。' }
          ]`,

  // ============ stages-b.js ============
  s4l1: `[
            { t: 'p', text: '前面的代码只是"<b>句子</b>"。这一阶段开始我们要写"<b>函数</b>" —— 给电脑起一些<b>能反复用</b>的小咒语。' },
            { t: 'analogy', text: '<b>🎭 今日登场</b><br>阿波举手："<code>add = fn a, b -> a + b end</code> ……这一坨怪怪的东西是什么？"<br>好眼光 —— 它就是一个函数。我们从最简单的开始。' },
            { t: 'p', text: '在 Elixir 里，<b>函数本身也是一种值</b>（"一等公民"），可以绑到变量上、传给别人、甚至在函数里造新函数。没有名字的就叫<b>匿名函数</b>，用 <code>fn ... end</code> 造。' },
            { t: 'code', title: '造一个函数', code: 'add = fn a, b -> a + b end\\n\\nIO.puts(add.(3, 4))   # 7  ← 注意调用匿名函数要用 .( )' },
            { t: 'p', text: '那个<b>点</b>很重要：<code>add.(3, 4)</code> 而不是 <code>add(3, 4)</code>。Elixir 用点来区分"<b>匿名函数</b>"和"<b>模块里的具名函数</b>"。' },
            { t: 'p', text: '同一个名字可以有好几个"分身"，靠<b>参数模式</b>自动选 —— 这就是模式匹配大显身手的场合：' },
            { t: 'code', title: '多分身', code: 'talk = fn\\n  {:ok, msg} -> "成功了：#{msg}"\\n  {:error, msg} -> "失败了：#{msg}"\\nend\\n\\nIO.puts(talk.({:ok, "登录"}))\\nIO.puts(talk.({:error, "超时"}))' },
            { t: 'p', text: '写<b>短函数</b>的时候，<code>&amp;</code> 简写能省好多字 —— <code>&amp;1</code> / <code>&amp;2</code> 代表第 1、2 个参数。' },
            { t: 'code', title: '简写', code: 'double = &(&1 * 2)\\nIO.puts(double.(21))          # 42\\n\\nIO.inspect(Enum.map([1, 2, 3], &(&1 * 10)))\\nIO.inspect(Enum.map(["a", "b"], &String.upcase/1))  # 直接引用现成函数' },
            { t: 'tip', text: '<code>&amp;String.upcase/1</code> 里的 <code>/1</code> 是<b>元数</b>（参数个数）。Elixir 里 <code>upcase/1</code> 和 <code>upcase/2</code> 是<b>两个不同的函数</b>，哪怕名字一样。' },
            { t: 'p', text: '<b>本章小结</b>：匿名函数 <code>fn ... end</code> 是"会变形的数据"；调用要带点 <code>.( )</code>；模式匹配 + <code>&amp;</code> 简写让短函数像句子一样自然。' },
            { t: 'p', text: '<b>下一步</b>：匿名函数只能<b>当场</b>用一会儿。真正写项目，我们把函数塞进<b>模块</b>，给它起名字、装参数默认值、互相调用 —— 就像给小咒语装进一本<b>咒语书</b>里。' }
          ]`,

  s4l2: `[
            { t: 'p', text: '真正的项目里，函数都住在<b>模块</b>里。模块用 <code>defmodule</code> 定义，函数用 <code>def</code>。' },
            { t: 'analogy', text: '<b>🎭 今日登场</b><br>阿波："函数为什么要住进模块？"<br>因为<b>所有好用的工具都分类放在抽屉里</b>：把字符串处理函数放"文字抽屉"，把数字处理函数放"数字抽屉"，把序列处理函数放"序列抽屉"。你自己的函数，也最好分门别类放进自己做的抽屉。' },
            { t: 'code', title: '第一个模块', code: 'defmodule Math do\\n  def add(a, b) do\\n    a + b\\n  end\\n\\n  def square(x), do: x * x     # 一行写法\\nend\\n\\nIO.puts(Math.add(1, 2))    # 3\\nIO.puts(Math.square(5))    # 25' },
            { t: 'p', text: '几个关键点：' },
            { t: 'list', items: [
              '函数<b>最后一行的值</b>就是返回值 —— 没有 <code>return</code>',
              '<code>defp</code> 定义<b>私有</b>函数，外面调不到（就像抽屉里的小隔层）',
              '同名不同参数个数 = 不同函数（<code>add/2</code>、<code>add/3</code> 是两个）',
              '<code>def</code> 的参数本身可以是<b>模式</b>，多分支从上往下匹配'
            ] },
            { t: 'code', title: '模式 + 递归', code: 'defmodule Fact do\\n  def calc(0), do: 1\\n  def calc(n) when n > 0, do: n * calc(n - 1)\\nend\\n\\nIO.puts(Fact.calc(5))   # 120' },
            { t: 'code', title: '默认参数', code: 'defmodule Greeter do\\n  def hello(name \\\\\\\\ "世界") do\\n    "你好，#{name}"\\n  end\\nend\\n\\nIO.puts(Greeter.hello())        # 你好，世界\\nIO.puts(Greeter.hello("小明"))   # 你好，小明' },
            { t: 'p', text: '<b>本章小结</b>：模块 = 函数<b>抽屉</b>。<code>def</code> 给世界用，<code>defp</code> 留给抽屉里自己用。最后一行的值就是返回值 —— 没有 <code>return</code>，更轻。' },
            { t: 'p', text: '<b>下一步</b>：现在你有咒语了，但咒语叠起来写就成了<b>俄罗斯套娃</b>。下一节学一招让函数一个接一个像<b>流水线</b>一样串起来的语法 —— 管道操作符。' }
          ]`,

  s4l3: `[
            { t: 'p', text: '嵌套调用写成 <code>f(g(h(x)))</code> 要从<b>里往外</b>读，反人类。Elixir 给你<b>管道</b>：' },
            { t: 'code', title: '对比', code: '# 俄罗斯套娃 😵\\nIO.puts(Enum.sum(Enum.filter(Enum.map([1, 2, 3, 4], fn x -> x * 3 end), fn x -> x > 6 end)))\\n\\n# 流水线 😎\\nresult =\\n  [1, 2, 3, 4]\\n  |> Enum.map(fn x -> x * 3 end)\\n  |> Enum.filter(fn x -> x > 6 end)\\n  |> Enum.sum()\\n\\nIO.puts(result)' },
            { t: 'p', text: '<code>a |&gt; f(b)</code> 等价于 <code>f(a, b)</code> —— <b>左边变成右边的第一个参数</b>。' },
            { t: 'analogy', text: '<b>🏭 想象传送带</b><br>原料从左端放上去，经过一道道工序，右端掉出成品。<br>每一步只看"上一步给了我啥"，不用看"全局是什么"。<br>你照着这个思路写，代码读起来就像<b>流水线配方</b>。' },
            { t: 'tip', text: '管道之所以这么顺，是因为每一步都<b>返回新数据</b>（不可变！）。这就是第 3 阶段埋下的伏笔 —— 没有那个铺垫，管道就成了笑话。' },
            { t: 'p', text: '<b>本章小结</b>：<code>|&gt;</code> 把"嵌套调用"换成"流水线"。从这一刻起，你的 Elixir 代码会越写越像<b>配方</b>，越写越不像<b>俄罗斯套娃</b>。' },
            { t: 'p', text: '<b>下一步</b>：管道让我们能优雅地把函数当积木拼起来。下一节介绍让函数当<b>积木</b>用的几种经典方式 —— <code>map</code>、<code>filter</code>、<code>reduce</code>，以及背后那个大宝藏 <code>Enum</code> 模块。' }
          ]`,

  s4l4: `[
            { t: 'p', text: '<b>高阶函数</b> = 把函数当参数传进去。<code>Enum</code> 模块就是靠它横扫天下的。' },
            { t: 'analogy', text: '<b>🎭 今日登场</b><br>阿波："把函数传给函数？函数又不能像数据那样传来传去啊？"<br>—— 在 Elixir 里，<b>函数就是数据</b>。这一点比大多数语言都更激进，但习惯了以后超爽。' },
            { t: 'code', title: '四大金刚', code: 'nums = [1, 2, 3, 4]\\n\\nIO.inspect(Enum.map(nums, &(&1 * 2)))            # 变形：[2, 4, 6, 8]\\nIO.inspect(Enum.filter(nums, &(&1 > 2)))          # 筛选：[3, 4]\\nIO.inspect(Enum.sum(nums))                        # 求和：10\\nIO.inspect(Enum.reduce(nums, 0, fn x, acc -> x + acc end))  # 归约：10' },
            { t: 'p', text: '<code>reduce</code> 是万金油：拿一个"累加器（accumulator）"，逐个把元素揉进去。map/filter/sum 都能用它实现。' },
            { t: 'code', title: 'reduce 的心智模型', code: '# reduce([1, 2, 3], 0, fn x, acc -> x + acc end)\\n# 第 1 步：acc = 0 + 1 = 1\\n# 第 2 步：acc = 1 + 2 = 3\\n# 第 3 步：acc = 3 + 3 = 6\\n\\n# 再来个字符串版的\\nnames = ["小明", "小红"]\\nIO.puts(Enum.reduce(names, "", fn n, acc -> acc <> n <> " " end))' },
            { t: 'code', title: '更多好用的', code: 'IO.inspect(Enum.sort([3, 1, 2]))\\nIO.inspect(Enum.uniq([1, 1, 2]))\\nIO.inspect(Enum.take([1, 2, 3, 4], 2))\\nIO.inspect(Enum.any?([1, 2, 3], &(&1 > 2)))\\nIO.inspect(Enum.all?([1, 2, 3], &(&1 > 0)))\\nIO.inspect(Enum.find([1, 2, 3], &(&1 > 1)))\\nIO.inspect(Enum.group_by(["a", "bb", "cc"], &String.length/1))' },
            { t: 'tip', text: '函数的参数顺序有讲究：<code>Enum</code> 的函数总是<b>集合在前</b>，这样才好配合管道 <code>|&gt;</code>。记不住就翻那个「📖 函数速查」。' },
            { t: 'p', text: '<b>本章小结</b>：<code>Enum.map</code> 变形、<code>filter</code> 筛选、<code>reduce</code> 万能归约 —— 三大件撑起一半的日常编码。' },
            { t: 'p', text: '<b>下一步</b>：你可能隐约发现 —— 这些函数背后都在<b>递归</b>。理解递归不是为了日常写，而是为了能看懂 Elixir 的底层 —— 以及处理那些 <code>Enum</code> 搞不定的特殊情况。' }
          ]`,

  s4l5: `[
            { t: 'p', text: 'Elixir 没有 for/while 循环（真的！）。要"重复做一件事"，用<b>递归</b>。' },
            { t: 'analogy', text: '<b>🎭 今日登场</b><br>阿波："我以前都是 for 循环 —— 你让我<b>不循环</b>？"<br>不是不循环，是把循环拆成"<b>自己调自己</b>"。一开始会反直觉，但用多了反而比 for 循环更清楚。' },
            { t: 'code', title: '数数', code: 'defmodule Counter2 do\\n  def count(0), do: IO.puts("发射！")\\n  def count(n) do\\n    IO.puts(n)\\n    count(n - 1)\\n  end\\nend\\n\\nCounter2.count(3)' },
            { t: 'p', text: '套路永远是这两条：<ol><li><b>基线条件</b>：什么时候停（通常是空列表或 0）</li><li><b>递归步骤</b>：把问题变小，再调自己</li></ol>' },
            { t: 'code', title: '列表求和', code: 'defmodule Sum do\\n  def of([]), do: 0                      # 基线：空列表\\n  def of([head | tail]), do: head + of(tail)   # 变小：头 + 剩下的\\nend\\n\\nIO.puts(Sum.of([1, 2, 3, 4]))   # 10' },
            { t: 'analogy', text: '<b>🧅 像剥洋葱</b><br>每次剥一层（<code>[head | tail]</code>），剥到没了（<code>[]</code>）就停。<br>递归 = 把"做同样的事，但规模变小"反复调自己 —— 规模小到基线，结束。' },
            { t: 'tip', text: '日常写代码优先用 <code>Enum</code>（它是别人写好的递归）。理解递归是为了<b>看懂原理</b>，以及处理 <code>Enum</code> 搞不定的情况。' },
            { t: 'p', text: '<b>本章小结</b>：递归 = 自己调自己。先定基线，再把问题变小，写两到三遍就习惯了。' },
            { t: 'p', text: '<b>下一步</b>：第四瓶魔药 —— 匿名函数、模块、管道、Enum、递归 —— 都讲完了。下一瓶开始我们正式学会<b>让程序做选择</b>：<code>case</code>、<code>cond</code>、<code>if</code>、<code>with</code>，以及 Elixir 独有的"两种错误处理哲学"。' }
          ]`,

  s5l1: `[
            { t: 'p', text: '<code>case</code> = "拿一个值去试好几个图案"。' },
            { t: 'analogy', text: '<b>🎭 今日登场</b><br>阿波："<code>case</code> 跟我之前学的 switch 一样？"<br>远远<b>更强</b>。switch 只能比"<code>==</code>"，case 可以比<b>形状</b>（模式匹配）甚至<b>条件</b>（守卫）。' },
            { t: 'code', title: '基本用法', code: 'result = {:ok, "数据"}\\n\\nmsg = case result do\\n  {:ok, data} -> "拿到：#{data}"\\n  {:error, :timeout} -> "超时了，再试一次"\\n  {:error, reason} -> "出错了：#{reason}"\\n  _ -> "完全不认识"\\nend\\n\\nIO.puts(msg)' },
            { t: 'p', text: '分支<b>从上往下</b>试，第一个匹配上的胜出。最后放个 <code>_ -&gt;</code> 兜底是好习惯 —— 不然匹配不上会抛 <code>CaseClauseError</code>。' },
            { t: 'p', text: '光靠"形状"还不够，加<b>守卫 when</b>：' },
            { t: 'code', title: '守卫', code: 'check = fn n ->\\n  case n do\\n    n when n < 0 -> "负数"\\n    0 -> "零"\\n    n when n < 10 -> "个位数"\\n    _ -> "大数"\\n  end\\nend\\n\\nIO.puts(check.(-5))\\nIO.puts(check.(7))\\nIO.puts(check.(100))' },
            { t: 'tip', text: '守卫里只能用<b>有限的</b>操作：比较、<code>is_xxx</code> 类型判断、简单算术。<b>不能</b>调用普通函数 —— 这是为了让守卫快且无副作用。' },
            { t: 'p', text: '<b>本章小结</b>：<code>case</code> 是 Elixir 的"<b>主选择器</b>"。分支可以按"形状"或"条件"匹配，记得最后放 <code>_</code> 兜底。' },
            { t: 'p', text: '<b>下一步</b>：当条件更多、更不规则时，<code>case</code> 也开始啰嗦。下一节我们看 <code>cond</code> 和 <code>if/unless</code> —— 更轻量的选择器。' }
          ]`,

  s5l2: `[
            { t: 'p', text: '<code>case</code> 是"匹配形状"，<code>cond</code> 是"第一个为真的条件"。' },
            { t: 'code', title: 'cond', code: 'score = 85\\n\\nlevel = cond do\\n  score >= 90 -> "A"\\n  score >= 80 -> "B"\\n  score >= 60 -> "C"\\n  true -> "D"          # 必须有兜底，否则 CondClauseError\\nend\\n\\nIO.puts(level)' },
            { t: 'p', text: '<code>if</code> / <code>unless</code> 在 Elixir 里其实是"两个分支的宏"，返回值就是分支的值：' },
            { t: 'code', title: 'if 返回值', code: 'x = if 1 > 2, do: "大", else: "小"\\nIO.puts(x)   # 小\\n\\nIO.puts(if true do\\n  "走这里"\\nelse\\n  "不走这里"\\nend)\\n\\n# unless = if not\\nIO.puts(unless false, do: "unless 是反过来的 if")' },
            { t: 'tip', text: 'Elixir 里只有 <code>false</code> 和 <code>nil</code> 是"假"，其它（包括 <code>0</code> 和空字符串 <code>""</code>）都是"真"！这和很多语言不一样。' },
            { t: 'p', text: '<b>本章小结</b>：<code>cond</code> 是"找第一个真"，<code>if/unless</code> 是"两选一"。三者按场景挑一个用，都<b>有返回值</b>，可以塞进变量。' },
            { t: 'p', text: '<b>下一步</b>：当"<b>连着做好几步、每步都可能失败</b>"时，<code>case</code> 会变成噩梦版金字塔。下一节我们学一招<b>专门对付这种场景</b>的语法：<code>with</code>。' }
          ]`,

  s5l3: `[
            { t: 'p', text: '当你要"连着做好几步，每步都可能失败"，嵌套 <code>case</code> 会变成噩梦：<b>厄运金字塔</b>。' },
            { t: 'analogy', text: '<b>🎭 今日登场</b><br>阿波：看一眼例子就喊出来："这向右滑的阶梯比我的右——"<br>对，这就是著名的"<b>厄运金字塔</b>"。三步就三层，五步就五层 —— 没人愿意写、没人愿意读、没人愿意改。' },
            { t: 'code', title: '噩梦版', code: 'defmodule Steps do\\n  def step1(), do: {:ok, 1}\\n  def step2(a), do: {:ok, a + 1}\\n  def step3(b), do: {:ok, b + 1}\\nend\\n\\ncase Steps.step1() do\\n  {:ok, a} ->\\n    case Steps.step2(a) do\\n      {:ok, b} ->\\n        case Steps.step3(b) do\\n          {:ok, c} -> {:ok, c}\\n          {:error, e} -> {:error, e}\\n        end\\n      {:error, e} -> {:error, e}\\n    end\\n  {:error, e} -> {:error, e}\\nend\\n|> IO.inspect()' },
            { t: 'p', text: '用 <code>with</code> 秒变清爽：' },
            { t: 'code', title: 'with 版', code: 'result = with {:ok, a} <- {:ok, 1},\\n                {:ok, b} <- {:ok, a + 1},\\n                {:ok, c} <- {:ok, b + 1} do\\n  {:ok, c}\\nend\\n\\nIO.inspect(result)   # {:ok, 3}' },
            { t: 'p', text: '规则：<code>&lt;-</code> 左边是<b>模式</b>，右边是产生值的表达式。<ul><li>匹配成功 → 继续下一步</li><li>匹配失败 → <b>整个 with 立刻返回那个不匹配的值</b></li></ul>' },
            { t: 'code', title: '失败时', code: 'result = with {:ok, a} <- {:ok, 1},\\n                {:ok, b} <- {:error, "第二步挂了"},\\n                {:ok, c} <- {:ok, 3} do\\n  {:ok, c}\\nend\\n\\nIO.inspect(result)   # {:error, "第二步挂了"}   ← 直接短路返回' },
            { t: 'analogy', text: '<b>🎮 闯关游戏</b><br><code>with</code> 像闯关游戏：一路绿灯就到终点，任何一关红灯就<b>立刻带着红灯的原因</b>退出。<br>Python 里你可能见过 "early return"，Elixir 的 <code>with</code> 就是这思想的优雅版本。' },
            { t: 'p', text: '<b>本章小结</b>：连着做好几步、每步都可能失败时用 <code>with</code>，把"<b>厄运金字塔</b>"展平。这是 Elixir 处理"返回值路线"的关键利器。' },
            { t: 'p', text: '<b>下一步</b>：第五瓶魔药讲完了。下一瓶是重头戏 —— <b>并发与 OTP</b>。Elixir 最让别的语言羡慕的地方：几万个小进程一起干活的"轻量并发"，以及 OTP 的"<b>让它崩</b>"哲学。' }
          ]`,

  s5l4: `[
            { t: 'p', text: 'Elixir 有两套处理错误的思路：' },
            { t: 'list', items: [
              '<b>预期内的失败</b>（用户输入错、网络超时）→ 返回值 <code>{:error, reason}</code>，交给模式匹配处理',
              '<b>不该发生的崩溃</b>（bug）→ 直接 <code>raise</code>，让<b>监督者</b>重启它 —— 这就是 OTP 的哲学："让它崩"'
            ] },
            { t: 'analogy', text: '<b>🎭 今日登场</b><br>阿波："那 <code>try/rescue</code> 呢？"<br>好问题。Elixir 里 <code>try/rescue</code> 是"<b>最后一道防线</b>"，不是万能钥匙。日常尽量走返回值路线，把 <code>try/rescue</code> 留给真正意外的情况。' },
            { t: 'code', title: '抛出与接住', code: 'result = try do\\n  raise "数据库连接断了"\\nrescue\\n  e in RuntimeError -> "抓住了：#{e}"\\nend\\n\\nIO.puts(result)' },
            { t: 'p', text: '日常更常用的是<b>返回值路线</b>：' },
            { t: 'code', title: '返回值路线（推荐）', code: 'defmodule Safe do\\n  def parse_age(str) do\\n    case Integer.parse(str) do\\n      {age, _} when age >= 0 and age < 150 -> {:ok, age}\\n      {_, _} -> {:error, "年龄不合理"}\\n      :error -> {:error, "不是数字"}\\n    end\\n  end\\nend\\n\\nIO.inspect(Safe.parse_age("18"))\\nIO.inspect(Safe.parse_age("abc"))' },
            { t: 'tip', text: '<b>口诀</b>："<b>可预见的失败用返回值，不可预见的崩溃用 raise + 监督者重启</b>"。别用 <code>try/rescue</code> 去兜所有错误 —— 那是把 bug 藏起来，等下次爆炸。' },
            { t: 'p', text: '<b>本章小结</b>：Elixir 的错误处理有两条路 —— 返回值（日常）和 <code>raise + 监督者重启</code>（兜底）。能走第一条就不走第二条。' },
            { t: 'p', text: '<b>下一步</b>：第五瓶魔药全部讲完 —— 基础、模式匹配、不可变数据、函数式、控制流与错误处理。六瓶里你已经喝了五瓶。剩下的第六瓶是 Elixir 最让其它语言羡慕的：<b>并发与 OTP</b>。' }
          ]`,

  s6l1: `[
            { t: 'p', text: 'Elixir 的并发单位叫<b>进程</b> —— 但<b>不是</b>操作系统的进程 / 线程！它是 BEAM 虚拟机自己管的小东西。' },
            { t: 'list', items: [
              '创建成本极低：一台机器可以跑<b>几百万个</b>',
              '每个进程有自己的内存，<b>不共享</b>（所以不需要锁！）',
              '进程之间只能靠<b>发消息</b>沟通',
              '一个进程崩了，不会影响别的进程'
            ] },
            { t: 'analogy', text: '<b>🎭 今日登场</b><br>阿波："别的语言里并发是多线程，要加锁、要小心共享内存……"<br>对，那是因为他们<b>共享内存</b>。Elixir 的做法是：<b>彻底不共享</b>。每个进程各自有房间，你只能<b>敲他门递纸条</b>。' },
            { t: 'code', title: '造一个进程', code: 'me = self()\\nIO.inspect(me)          # #PID<0.1.0>  ← 自己的进程号\\n\\nspawn(fn ->\\n  IO.puts("我是子进程，我的 pid 是 #{inspect(self())}")\\n  send(me, {:hello, "我干完活了"})\\nend)\\n\\nIO.puts("主进程继续干活，不等它")' },
            { t: 'analogy', text: '<b>🧚 每个进程像一个小精灵</b><br>有自己的小房间（内存），互相不抢东西，靠传纸条（消息）沟通。<br>雇一个小精灵几乎不要钱。' },
            { t: 'tip', text: '<code>spawn</code> 之后<b>主进程不会等</b>子进程 —— 这就是并发。想等结果，用 <code>receive</code> 或者下节课的 <code>Task</code>。' },
            { t: 'p', text: '<b>本章小结</b>：Elixir 的进程不是系统进程。它<b>极轻</b>、<b>独立</b>、<b>靠消息沟通</b>。这是后面所有 OTP 大厦的地基。' },
            { t: 'p', text: '<b>下一步</b>：进程造出来了，但还要能<b>通信</b>。下一节我们讲进程之间的"<b>邮箱</b>"和<b>收信</b>：<code>send</code> 和 <code>receive</code>。' }
          ]`,

  s6l2: `[
            { t: 'p', text: '每个进程都有一个<b>邮箱</b>（mailbox）。<code>send</code> 投递，<code>receive</code> 取件。' },
            { t: 'code', title: '选择性接收', code: 'me = self()\\n\\nspawn(fn ->\\n  send(me, {:noise, "忽略我"})\\n  send(me, {:important, "重要情报"})\\nend)\\n\\nreceive do\\n  {:important, msg} -> IO.puts("收到：#{msg}")\\nend' },
            { t: 'p', text: '重点：<code>receive</code> 是<b>选择性</b>的 —— 它会从邮箱里找<b>能匹配上的第一条</b>，不匹配的<b>继续留在邮箱里</b>（不会被丢掉）。' },
            { t: 'code', title: '超时保护', code: 'result = receive do\\n  {:ping, x} -> "收到 ping: #{x}"\\nafter\\n  500 -> "等了 500 毫秒，没人理我"\\nend\\n\\nIO.puts(result)' },
            { t: 'tip', text: '<code>after</code> 分支一定要加！不然没人发消息时进程会<b>永远卡住</b> —— 这是新手写并发最常见的死锁。' },
            { t: 'analogy', text: '<b>📮 邮箱 = 快递柜</b><br>别人往里塞包裹，你按"包裹长什么样"去取。取不到就（有超时的话）先走人。<br>用选择性接收，你就只关心你想处理的那一类消息，其他全部先压箱底。' },
            { t: 'p', text: '<b>本章小结</b>：<code>send</code> 投递、<code>receive</code> 选择性取件、<code>after</code> 兜底超时。三个动作记牢，你已经能写出最基础的并发程序了。' },
            { t: 'p', text: '<b>下一步</b>：手写 <code>spawn + send + receive</code> 太啰嗦了。下一节我们用 <code>Task</code> 把这套流程打包成两步：派活 + 等结果。' }
          ]`,

  s6l3: `[
            { t: 'p', text: '"起进程 → 发消息 → 收结果"太啰嗦了。<code>Task</code> 把这套流程打包成两步：<code>async</code> 派活，<code>await</code> 等结果。' },
            { t: 'analogy', text: '<b>🎭 今日登场</b><br>阿波："我能不能就<b>派个活</b>然后等结果？别让我管邮箱那一套？"<br>能，这就是 Task —— 简化版的并发。' },
            { t: 'code', title: 'Task 基本用法', code: 'task = Task.async(fn ->\\n  # 假装很耗时\\n  Enum.sum(1..100)\\nend)\\n\\nIO.puts("派完活，我先干点别的")\\nresult = Task.await(task)\\nIO.puts("结果是 #{result}")' },
            { t: 'p', text: '<code>await</code> 会<b>阻塞等待</b>（默认 5 秒超时）。想同时派多个活：' },
            { t: 'code', title: '并行干活', code: 'tasks = for n <- [10, 20, 30] do\\n  Task.async(fn -> n * n end)\\nend\\n\\nresults = Enum.map(tasks, fn t -> Task.await(t) end)\\nIO.inspect(results)   # [100, 400, 900]' },
            { t: 'analogy', text: '<b>🛵 Task 像外卖订单</b><br>下单（<code>async</code>）之后你可以继续刷手机，饭好了再来取（<code>await</code>）。<br>多个订单就同时派，多个 <code>await</code> 一一取回来。' },
            { t: 'tip', text: '后台<b>不需要结果</b>的活，可以用 <code>Task.start/1</code> —— 派出去就不管了。' },
            { t: 'p', text: '<b>本章小结</b>：<code>Task.async</code> + <code>Task.await</code> 是 Elixir 并发的<b>简单款</b>。能应付大多数"边派边等"的场景。' },
            { t: 'p', text: '<b>下一步</b>：Task 用完一次就结束。想要"<b>长命</b>"的进程（保管一份状态、反复用）？下一节介绍 Elixir 的"<b>小管家</b>" —— <code>Agent</code>。' }
          ]`,

  s6l4: `[
            { t: 'p', text: '数据不可变，那"<b>会变的状态</b>"（比如计数器）放哪？答案是：放在一个<b>专门的进程</b>里，让它替你保管。<code>Agent</code> 就是最简 version。' },
            { t: 'analogy', text: '<b>🎭 今日登场</b><br>阿波："数据<b>不能变</b>，那变量怎么++？"<br>你的<b>进程</b>可以变。你让一个进程"我管一个数字，要加 1 就给他发消息"，数字住在它屋里，外面摸不到。' },
            { t: 'code', title: '计数器', code: '{:ok, box} = Agent.start_link(fn -> 0 end)   # 初始状态 0\\n\\nAgent.update(box, fn n -> n + 1 end)           # 改状态\\nAgent.update(box, fn n -> n + 1 end)\\n\\nvalue = Agent.get(box, fn n -> n end)          # 读状态\\nIO.puts(value)   # 2' },
            { t: 'list', items: [
              '状态<b>住在一个进程里</b>，外面拿不到"引用"，只能通过消息改',
              '<code>Agent.get/update</code> 的函数在<b>那个进程内</b>执行，所以天然串行、不会有竞争',
              '外面看起来"共享"了状态，本质还是消息传递'
            ] },
            { t: 'analogy', text: '<b>🏦 Agent = 银行柜台</b><br>钱（状态）在柜台后面，你不能伸手拿，只能递单子（函数）让柜员操作。<br>每次操作都是"<b>给柜台发消息</b>"，不是直接动手。' },
            { t: 'p', text: '<b>本章小结</b>：Agent = 一位"只管一件事"的小管家。<b>状态</b>住在它屋里，外面只能通过 <code>get/update</code> 这两个动作访问。' },
            { t: 'p', text: '<b>下一步</b>：Agent 太简单，只能"<b>存东西</b>"。如果想"<b>按规矩办事</b>"（收到某种消息该干啥），下一节上 OTP 出场率最高的大角色 —— <code>GenServer</code>。' }
          ]`,

  s6l5: `[
            { t: 'p', text: 'Agent 只能存状态。想要<b>自定义逻辑</b>（"收到这个消息该干啥"），用 <code>GenServer</code> —— OTP 里出场率最高的角色。' },
            { t: 'analogy', text: '<b>🎭 今日登场</b><br>阿波："Agent 简单但太死板，能不能<b>按规矩</b>办事？"<br>能。GenServer 就是"有<b>服务窗口</b>的进程"：客户发请求，前台按你写的规矩处理，再回个话。' },
            { t: 'p', text: '你只要实现几个<b>回调</b>（callback），GenServer 帮你把进程、邮箱、循环全包了：' },
            { t: 'list', items: [
              '<code>init(args)</code> → <code>{:ok, 初始状态}</code>',
              '<code>handle_call(请求, from, 状态)</code>：同步调用，要回复 → <code>{:reply, 回复, 新状态}</code>',
              '<code>handle_cast(请求, 状态)</code>：异步，不回复 → <code>{:noreply, 新状态}</code>'
            ] },
            { t: 'code', title: '一个柜台', code: 'defmodule Counter do\\n  def start_link(initial) do\\n    GenServer.start_link(Counter, initial)\\n  end\\n\\n  def init(n), do: {:ok, n}\\n\\n  def get(pid), do: GenServer.call(pid, :get)\\n  def add(pid, n), do: GenServer.cast(pid, {:add, n})\\n\\n  def handle_call(:get, _from, state) do\\n    {:reply, state, state}\\n  end\\n\\n  def handle_cast({:add, n}, state) do\\n    {:noreply, state + n}\\n  end\\nend\\n\\n{:ok, pid} = Counter.start_link(0)\\nCounter.add(pid, 5)\\nCounter.add(pid, 3)\\nIO.puts(Counter.get(pid))   # 8' },
            { t: 'analogy', text: '<b>🏢 GenServer = 有前台的办公室</b><br><code>call</code> 是<b>打电话</b>（等对方答复）<br><code>cast</code> 是<b>发邮件</b>（发完就走，对方有空再处理）<br>前台按你写的规则处理每件事。' },
            { t: 'tip', text: '注意 <code>Counter.get/1</code> 这种"<b>包装函数</b>"是好习惯：把 <code>GenServer.call(pid, :get)</code> 藏在模块里，外面只管调 <code>Counter.get(pid)</code>。外面永远不需要知道是 GenServer。' },
            { t: 'p', text: '<b>本章小结</b>：GenServer = "<b>有规矩的进程</b>"。三个回调 <code>init</code>、<code>handle_call</code>、<code>handle_cast</code> 写完，你就有了一个能写、能读、能管状态的服务器。' },
            { t: 'p', text: '<b>下一步</b>：GenServer 用得好好的，但万一它崩了呢？下一节介绍 OTP 最反直觉也最强大的思想 —— <b>让它崩</b>，然后由 <code>Supervisor</code> 把它重启。' }
          ]`,

  s6l6: `[
            { t: 'p', text: 'OTP 最反直觉也最强大的思想：<b>不要拼命防崩溃，而是让崩溃的东西自动重启</b>。' },
            { t: 'analogy', text: '<b>🎭 今日登场</b><br>阿波："崩了不就是要修吗？"<br>在 OTP 里，崩了是<b>常态</b>。要修的不是崩本身，而是让另一个角色（监督者）把它<b>扶起来</b>。' },
            { t: 'p', text: '<code>Supervisor</code>（监督者）专门盯着一组进程，谁挂了就按策略重启谁。你只要告诉它"<b>启动谁</b>"：' },
            { t: 'code', title: '监督一个计数器', code: 'defmodule Counter do\\n  use GenServer\\n  def start_link(n), do: GenServer.start_link(Counter, n)\\n  def init(n), do: {:ok, n}\\n  def handle_call(:get, _from, n), do: {:reply, n, n}\\n  def handle_cast({:add, x}, n), do: {:noreply, n + x}\\nend\\n\\n{:ok, sup} = Supervisor.start_link(\\n  [%{id: :my_counter, start: {Counter, :start_link, [0]}}],\\n  strategy: :one_for_one\\n)\\n\\nIO.puts("监督者启动完成")\\nIO.inspect(sup)\\n# 之后如果 Counter 进程挂了，监督者会自动再启一个' },
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
          ]`
};

// ======== 实施替换 ========
function findBlocksRange(s, lessonId) {
  const i = s.indexOf(`id: '${lessonId}'`);
  if (i < 0) return null;
  const blkIdx = s.indexOf('blocks:', i);
  if (blkIdx < 0) return null;
  const arrStart = s.indexOf('[', blkIdx);
  if (arrStart < 0) return null;
  let depth = 0, j = arrStart;
  while (j < s.length) {
    const c = s[j];
    if (c === '[') depth++;
    else if (c === ']') { depth--; if (depth === 0) return { start: arrStart, end: j }; }
    j++;
  }
  return null;
}

let src = fs.readFileSync(path.join(ROOT, TARGET), 'utf8');
let count = 0;
for (const [id, blocksText] of Object.entries(REWRITES)) {
  const range = findBlocksRange(src, id);
  if (!range) { console.error('NOT FOUND: ' + id); continue; }
  src = src.slice(0, range.start) + blocksText + src.slice(range.end + 1);
  count++;
}
fs.writeFileSync(path.join(ROOT, TARGET), src);
console.log(`✅ 已替换 ${count} 个 lesson blocks（${TARGET}）`);