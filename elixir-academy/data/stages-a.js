/*
 * 课程体系（第 1~3 阶段）：入门 / 模式匹配 / 不可变数据
 * 面向零基础，风格：炼金术学院闯关
 */
(function (global) {
  'use strict';

  global.STAGES_A = [

    // ===================== 阶段 1 =====================
    {
      id: 's1',
      title: '第一瓶魔药：认识 Elixir',
      subtitle: '学会跟计算机说一门"会变形"的语言',
      icon: '🌱',
      color: '#6C8CFF',
      lessons: [
        {
          id: 's1l1',
          title: '第 1 课 · 打个招呼吧',
          minutes: 7,
          blocks: [
            { t: 'p', text: '欢迎来到<b>炼金术学院</b>。我负责带你走完这一程，叫我<b>导师</b>就好。在你旁边还有一位新生 —— <b>阿波</b>，她问的问题可能正是你心里想问的；如果她问了你也在想的，就当她在帮你你心里。' },
            { t: 'analogy', text: '<b>🎭 角色介绍</b><br>• <b>导师</b>（我）—— 会解释、会陪你试错<br>• <b>你</b> —— 拿鼠标点 ▶ 运行的那个人<br>• <b>阿波</b> —— 零基础新生，会问一些看似很傻但其实很关键的问题' },
            { t: 'p', text: '先别急着看代码。我先带你认识一下你现在坐的这个房间 ——。右边那块亮着的框框，是你的<b>配方试炼台</b>，我会一直叫它<b>「试炼台」</b>。你写一句话进去，点一下右上的 ▶，下面那一格就会<b>说出</b>你的话。' },
            { t: 'p', text: '这就是你和电脑说话的方式：你<b>写</b>一句，它<b>念</b>出来。专业一点讲，这叫 <b>REPL</b>（Read-Eval-Print-Loop —— 读你写的话、算一下、念出来、再听你下一句）。一个不停循环的小会话窗口。' },
            { t: 'code', title: '第一次跟电脑说话', code: '"你好，电脑！"' },
            { t: 'p', text: '看到了吗？你刚在试炼台里写了一串被双引号包起来的字，点 ▶，它就回了一句一样的话。那串被双引号包起来的字，在 Elixir 里有自己的名字 —— 叫 <b>字符串</b>（英文是 <i>string</i>）。你可以把它当成一段话、一个名字、一段咒语，只要用双引号 <code>"..."</code> 包起来就行。' },
            { t: 'analogy', text: '<b>📦 字符串 = 带包装的句子</b><br>双引号是"<b>外包装</b>"，里面的字是"<b>内容</b>"。这包装不是装饰 —— 它是计算机区分"这是文字"和"这是指令"的唯一标记。' },
            { t: 'p', text: 'OK，现在说回真正的主角 —— <code>IO.puts</code>。它样子怪怪的，但其实可以拆成两半看：' },
            { t: 'list', items: [
              '<b>IO</b> —— "Input/Output"（输入/输出）的缩写，是 Elixir 的<b>口舌</b>。所有"<b>我要说话</b>"、"<b>我要听话</b>"的事都归它管。',
              '<b>.</b> —— 只是个"<b>的</b>"，就像中文里说"<b>我.导师</b>"一样。它说"<b>IO 这个东西的</b>"下面那个方法。',
              '<b>puts</b> —— "put string" 的省略写法，念"扑次"，意思是"<b>把字符串放到屏幕上</b>"。'
            ]},
            { t: 'p', text: '合在一起：<code>IO.puts</code> 就是"<b>用 IO 这个口舌，把字符串放到屏幕上去</b>"。下面的括号里写什么，它就念什么：' },
            { t: 'code', title: '让电脑开口', code: 'IO.puts("你好，电脑！")\nIO.puts("我是一条中文，也能念")' },
            { t: 'p', text: '<code>IO.puts</code> 念完会自动<b>换行</b>（像我们写完一句换一行）。如果你不想要那个换行，换成堂兄弟 <code>IO.write</code> 就行 —— 它念完不换行，紧贴着。' },
            { t: 'p', text: '还有一位很爱管闲事的亲戚：<code>IO.inspect</code>。<code>puts</code> 是念给<b>人</b>听的（所以字符串不带引号），<code>inspect</code> 是念给<b>程序员</b>听的 —— 它会把数据的<b>原形</b>照出来（带引号、带括号、什么类型一目了然）。调试的时候你会一直用它。' },
            { t: 'code', title: '给人听 vs 给程序员听', code: 'IO.puts("你好")      # 念给人听：你好\nIO.inspect("你好")   # 念给程序员听："你好"\nIO.inspect([1, 2, 3]) # 列表的样子：[1, 2, 3]' },
            { t: 'tip', text: '你刚看到了一行写着 <code>#</code> 开头的字。<code>#</code> 后面那一行是写给<b>人</b>看的（注释），电脑会自动跳过。学写程序的时候，多写注释 —— <b>未来的你</b>会感谢现在的你（这是真的，我以前也没写注释，后来都后悔了）。' },
            { t: 'analogy', text: '<b>🔍 三个口诀</b><br>• <code>IO.puts</code> —— <b>说话</b>，给用户听<br>• <code>IO.write</code> —— <b>说话但不留换行</b>，紧贴下一句<br>• <code>IO.inspect</code> —— <b>照妖镜</b>，给程序员调试用<br>只要记住这三个，你就敢开口了。' },
            { t: 'p', text: '小总结 —— 这一章我们一起做的就两件事：<b>① 学会在试炼台上写代码、点运行、看输出</b>；<b>② 学会用 IO 这个口舌的三种说话方式</b>。看着不多，但这是<b>所有后面魔法</b>的起点。' },
            { t: 'p', text: '下一步我们会认识 Elixir 里的各种"<b>材料</b>" —— 整数、浮点数、原子、布尔、nil。每一个都有自己固定的样貌，记牢了就能一眼认出它们。' }
          ],
          exercises: [
            {
              id: 's1l1e1',
              title: '练习：自我介绍',
              prompt: '用 <code>IO.puts</code> 打印两行：第一行是 <code>Hello, Elixir!</code>，第二行是你的名字。',
              starter: '# 在这里写下你的第一行 Elixir\nIO.puts("Hello, Elixir!")\n\n# TODO: 再打印一行你的名字\n',
              solution: 'IO.puts("Hello, Elixir!")\nIO.puts("小明")\n',
              checks: [
                { label: '调用了两次 IO.puts', code: 'true' },
                { label: '输出里包含 Hello, Elixir!', code: 'String.contains?(out, "Hello, Elixir!")' }
              ],
              hints: ['照着例子写：<code>IO.puts("你想说的话")</code>', '名字也用双引号包起来，例如 <code>IO.puts("张三")</code>']
            },
            {
              id: 's1l1e2',
              title: '练习：照妖镜',
              prompt: '用 <code>IO.inspect</code> 分别打印数字 <code>42</code>、字符串 <code>"42"</code>、列表 <code>[1, 2, 3]</code>，观察它们的区别。',
              starter: '# TODO: 用 IO.inspect 打印下面三个东西\n',
              solution: 'IO.inspect(42)\nIO.inspect("42")\nIO.inspect([1, 2, 3])\n',
              checks: [
                { label: '三行都打印出来了', code: 'String.contains?(out, "42") and String.contains?(out, "\\"42\\"") and String.contains?(out, "[1, 2, 3]")' }
              ],
              hints: ['<code>IO.inspect(42)</code> 就好', '注意字符串打印出来<b>带引号</b>，数字不带']
            }
          ]
        },

        {
          id: 's1l2',
          title: '第 2 课 · 认识你的「材料」',
          minutes: 9,
          blocks: [
            { t: 'p', text: '上一课我们只是让电脑<b>开口说话</b>。这一课我们要认识<b>材料</b> —— 你<b>递给</b>电脑的那些东西，到底分几种、长得各不一样。' },
            { t: 'analogy', text: '<b>🎭 今日登场</b><br>阿波举手了："导师……为什么我写 <code>IO.puts(1)</code> 和 <code>IO.puts(\"1\")</code>，看起来都是 1，但好像又不一样？"<br>很好，正是我们这节课要回答的。' },
            { t: 'p', text: '把世界上所有 Elixir 程序员最常用的"原料"摆出来，主要有六种。我不打算用表格糊你脸，咱们一个个认识：' },
            { t: 'list', items: [
              '<b>整数 integer</b>：<code>1</code>、<code>-7</code>、<code>1_000_000</code> —— 末尾的下划线<b>只是给人看</b>的，让大数字好读，电脑直接忽略',
              '<b>浮点数 float</b>：<code>3.14</code>、<code>0.5</code> —— 凡带小数点都是浮点。注意 <code>10 / 2</code> 结果是 <code>5.0</code>，不是 <code>5</code>。除法永远给你小数',
              '<b>字符串 string</b>：<code>"hello"</code>、<code>"你好"</code> —— 双引号包起来的字串。它底层其实是"一串字节"，所以有时候也叫 <i>binary</i>',
              '<b>原子 atom</b>：<code>:ok</code>、<code>:error</code>、<code>:apple</code> —— 冒号开头。它自己就是它自己，<b>不再等于任何别的东西</b>',
              '<b>布尔 boolean</b>：<code>true</code>、<code>false</code> —— 是 / 否。它<b>也是原子</b>，只是名字固定了',
              '<b>空 nil</b>：<code>nil</code> —— "啥也没有"。也是原子'
            ]},
            { t: 'code', title: '六种材料', code: 'IO.inspect(42)          # 整数\nIO.inspect(3.14)        # 浮点\nIO.inspect("字符串")     # 字符串\nIO.inspect(:ok)         # 原子\nIO.inspect(true)        # 布尔\nIO.inspect(nil)         # 空' },
            { t: 'analogy', text: '<b>💡 想象一下</b><br>原子就像一枚<b>刻好字的徽章</b>：它自己就是它自己，不指向别的东西。<code>:ok</code> 就是 :ok，全世界只有一个 :ok。' },
            { t: 'p', text: '阿波立刻又举手："那我怎么<b>认出</b>手里拿的到底是哪一种？"' },
            { t: 'p', text: '—— 用<b>照妖镜函数</b>。这一家子函数名字都是 <code>is_xxx</code>，问你"这是不是 xxx"，答你 <code>true</code> 或 <code>false</code>：' },
            { t: 'code', title: '类型判断', code: 'IO.puts(is_integer(42))    # true\nIO.puts(is_float(3.14))    # true\nIO.puts(is_binary("hi"))   # true（Elixir 里字符串就叫 binary）\nIO.puts(is_atom(:ok))      # true\nIO.puts(is_boolean(true))  # true\nIO.puts(is_nil(nil))       # true' },
            { t: 'tip', text: '<code>is_binary</code> 这名字怪对吧？因为 Elixir 里字符串的底层就是"二进制字节串"，所以叫 binary。记住这点，以后看到 <code>binary</code> 别慌 —— 它是字符串。' },
            { t: 'analogy', text: '<b>🪞 总结口诀</b><br>• 整数 <code>42</code>、浮点 <code>3.14</code> —— 数学材料<br>• 字符串 <code>"hi"</code> —— 包着双引号的文字<br>• 原子 <code>:ok</code> —— 自己就是自己的徽章<br>• 布尔 <code>true/false</code>、空 <code>nil</code> —— 特殊的原子<br>记不住不要紧，你每次用 <code>is_xxx</code> 问一句就行。' },
            { t: 'p', text: '<b>本章小结</b>：认识了 Elixir 的六种基本"材料"，学会了用 <code>is_xxx</code> 一组照妖镜照出类型。' },
            { t: 'p', text: '<b>下一步</b>：下一节课我们用一个最重要的概念 —— <b>"变量不是盒子"</b>。听起来像绕口令，但理解了它，你对 Elixir 的<b>不可变</b>哲学会有底。' }
          ],
          exercises: [
            {
              id: 's1l2e1',
              title: '练习：认材料',
              prompt: '定义变量 <code>a</code> 到 <code>f</code>，分别是整数、浮点数、字符串、原子、布尔、nil（值随便），然后用 <code>IO.inspect</code> 打印出来。',
              starter: 'a = 1\n# TODO: 补上 b（浮点）、c（字符串）、d（原子）、e（布尔）、f（nil）\n\nIO.inspect(a)\n',
              solution: 'a = 1\nb = 2.5\nc = "hi"\nd = :ok\ne = true\nf = nil\nIO.inspect(a)\nIO.inspect(b)\nIO.inspect(c)\nIO.inspect(d)\nIO.inspect(e)\nIO.inspect(f)\n',
              checks: [
                { label: 'a 是整数', code: 'is_integer(a)' },
                { label: 'b 是浮点数', code: 'is_float(b)' },
                { label: 'c 是字符串', code: 'is_binary(c)' },
                { label: 'd 是原子', code: 'is_atom(d)' },
                { label: 'e 是布尔', code: 'is_boolean(e)' },
                { label: 'f 是 nil', code: 'is_nil(f)' }
              ],
              hints: ['浮点数一定要有小数点，比如 <code>2.5</code> 不能写 <code>2</code>', '原子前面加冒号：<code>:error</code>']
            },
            {
              id: 's1l2e2',
              title: '练习：除法的坑',
              prompt: '算一算 <code>10 / 2</code> 和 <code>div(10, 2)</code> 分别是什么，并打印出来。你会发现 Elixir 有两种除法。',
              starter: 'x = 10 / 2\ny = div(10, 2)\n# TODO: 打印 x 和 y\n',
              solution: 'x = 10 / 2\ny = div(10, 2)\nIO.inspect(x)\nIO.inspect(y)\n',
              checks: [
                { label: 'x 是浮点数 5.0', code: 'is_float(x) and x == 5.0' },
                { label: 'y 是整数 5', code: 'is_integer(y) and y == 5' }
              ],
              hints: ['<code>/</code> 永远给小数；想要整数商就用 <code>div(10, 2)</code>', '取余数用 <code>rem(10, 3)</code>']
            }
          ]
        },

        {
          id: 's1l3',
          title: '第 3 课 · 变量不是盒子，是标签',
          minutes: 10,
          blocks: [
            { t: 'p', text: '我们刚认识了六种"材料"。现在要让电脑<b>记住</b>一个值，下次想用时叫它一声就行。这就是<b>变量</b>。' },
            { t: 'analogy', text: '<b>🎭 今日登场</b><br>阿波举手："我学过别的语言，那里的变量是<b>盒子</b>，先造一个盒子，再把东西装进去。Elixir 呢？"<br>好问题 —— Elixir 不是盒子，是<b>标签</b>。' },
            { t: 'p', text: 'Elixir 的<b>第一个</b>反常识：<b>数据本身永远不变</b>。一旦造出来，谁都改不了它（包括你自己）。' },
            { t: 'p', text: '那 <code>x = 1</code> 是啥意思？叫<b>绑定</b>（binding）：给数据 <code>1</code> 贴上一张写着 <code>x</code> 的标签。下次写 <code>x</code>，就是顺着这张标签去找那个 1。' },
            { t: 'code', title: '贴标签', code: 'x = 1\nIO.puts(x)   # 1\nx = 2        # 允许！这是"重新贴标签"，1 本身没变\nIO.puts(x)   # 2' },
            { t: 'p', text: '关键区别来了 —— <b>数据本身</b>从来不会被"改坏"。你看上去好像改了，其实都是新造一个：' },
            { t: 'code', title: '不可变的证据', code: 'list = [1, 2, 3]\nnew_list = List.delete(list, 2)\nIO.inspect(list)      # [1, 2, 3]  ← 原封不动！\nIO.inspect(new_list)  # [1, 3]     ← 这是个新的' },
            { t: 'analogy', text: '<b>📷 便利贴的比喻</b><br>想象你有一张照片 📷。别人"改"照片，其实是<b>洗一张新的</b>，你手里那张还是原样。<br>• 数据 = 照片本身<br>• 变量 = 贴在照片上的便利贴<br>• 你可以<b>撕下便利贴</b>贴到另一张照片上（重新绑定），但<b>旧照片不会变</b>。' },
            { t: 'tip', text: '不可变听着麻烦，实际超爽：再也不用担心"谁偷偷改了我的数据"，尤其在多任务并发时（一个程序同时干好几件事）。这是 Elixir 稳如老狗的秘密之一。' },
            { t: 'analogy', text: '<b>🎭 阿波的疑问</b><br>"那我<b>改</b>一个列表怎么办？"<br>你不用"改"，你"造个新的"。<code>List.delete</code> / <code>Map.put</code> 这些函数都是给你"造新的"。原始数据原封不动。' },
            { t: 'p', text: '<b>本章小结</b>：Elixir 的变量是<b>贴在数据上的标签</b>，可以撕下来贴到别的数据上；数据本身永远不变。' },
            { t: 'p', text: '<b>下一步</b>：有了材料，有了标签，我们就能<b>算账</b>了 —— 下一节我们认识 Elixir 的运算符，并学一招 <b>字符串插值</b> 让你的字串"活"起来。' }
          ],
          exercises: [
            {
              id: 's1l3e1',
              title: '练习：撕便利贴',
              prompt: '把 <code>x</code> 先绑定到 <code>1</code>，再重新绑定到 <code>"one"</code>，两次都打印出来。Elixir 允许变量换类型哦。',
              starter: 'x = 1\nIO.inspect(x)\n\n# TODO: 把 x 重新绑定成字符串 "one"，再打印一次\n',
              solution: 'x = 1\nIO.inspect(x)\nx = "one"\nIO.inspect(x)\n',
              checks: [
                { label: 'x 最后是字符串 "one"', code: 'x == "one"' },
                { label: '两次都打印了', code: 'String.contains?(out, "1") and String.contains?(out, "\\"one\\"")' }
              ],
              hints: ['再写一行 <code>x = "one"</code> 就行', '然后 <code>IO.inspect(x)</code>']
            },
            {
              id: 's1l3e2',
              title: '练习：原封不动',
              prompt: '用 <code>List.replace_at/3</code> 把 <code>nums</code> 的第 0 项换成 <code>99</code>，存到 <code>changed</code>。然后打印 <code>nums</code> 和 <code>changed</code>，亲眼确认原来的没变。',
              starter: 'nums = [1, 2, 3]\n\n# TODO: 用 List.replace_at 造一个新列表\nchanged = nums\n\nIO.inspect(nums)\nIO.inspect(changed)\n',
              solution: 'nums = [1, 2, 3]\nchanged = List.replace_at(nums, 0, 99)\nIO.inspect(nums)\nIO.inspect(changed)\n',
              checks: [
                { label: 'nums 仍然是 [1, 2, 3]', code: 'nums == [1, 2, 3]' },
                { label: 'changed 是 [99, 2, 3]', code: 'changed == [99, 2, 3]' }
              ],
              hints: ['<code>List.replace_at(列表, 下标, 新值)</code>，下标从 0 开始', '记得把结果<b>存到新变量</b>，原列表不会自己变']
            }
          ]
        },

        {
          id: 's1l4',
          title: '第 4 课 · 运算符与字符串插值',
          minutes: 9,
          blocks: [
            { t: 'p', text: '加减乘除你已经会了。这一课我们多学几招，并见识一个会让你的字串"活"起来的小魔法。' },
            { t: 'analogy', text: '<b>🎭 今日登场</b><br>阿波小声问："<code>x = x + 1</code> 在我熟悉的语言里是「x 加一」。Elixir 也能这么写？"<br>能写，并且<b>意思一样</b> —— 你看，标签贴到 <code>x + 1</code> 这份"新数据"上，原始的 1 还在。' },
            { t: 'p', text: 'Elixir 给你的运算工具，比你想象的多一点：' },
            { t: 'list', items: [
              '<code>+</code> <code>-</code> <code>*</code> <code>/</code>：加减乘除。记一下：<code>/</code> 永远返回<b>浮点</b>，<code>10 / 2</code> = <code>5.0</code>',
              '<code>div(a, b)</code> 整除、<code>rem(a, b)</code> 取余：要整数商就用它们',
              '<code>++</code> 拼列表、<code>--</code> 从列表里删除某项、<code>&lt;&gt;</code> 拼字符串',
              '<code>==</code> <code>!=</code> <code>&lt;</code> <code>&gt;</code> <code>&lt;=</code> <code>&gt;=</code>：大小 / 等于比较',
              '<code>===</code> <code>!==</code>：<b>严格</b>比较。整数和浮点在 <code>==</code> 看来是一回事，<code>===</code> 不答应',
              '<code>and</code> <code>or</code> <code>not</code>：正经的逻辑，<b>要求两边都是严格的布尔</b>；<code>&amp;&amp;</code> <code>||</code> <code>!</code> 更宽松，非布尔也能算'
            ]},
            { t: 'code', title: '拼拼拼', code: 'IO.inspect([1, 2] ++ [3])      # [1, 2, 3]\nIO.inspect([1, 2, 3] -- [2])   # [1, 3]\nIO.puts("el" <> "ixir")        # elixir\nIO.puts(1 == 1.0)              # true\nIO.puts(1 === 1.0)             # false' },
            { t: 'p', text: '<b>==</b> 宽松、<b>===</b> 严格 —— Elixir 把这俩分开，是为了不让你写代码时不小心把整数和浮点搅在一起。慢慢你会感谢这设计。' },
            { t: 'p', text: '最后这一招，是<b>每个 Elixir 程序员最喜欢的</b>：<b>字符串插值</b>。在双引号字符串里写 <code>#{...}</code>，里面的代码会被算出来塞回去。' },
            { t: 'analogy', text: '<b>🪄 占位符</b><br><code>#{}</code> 是"挖个洞"，把<b>值</b>填进来。洞里能放变量、能放算式、放你想放的任何 Elixir 代码。' },
            { t: 'code', title: '插值魔法', code: 'name = "小明"\nage = 18\nIO.puts("我叫 #{name}，今年 #{age} 岁")\nIO.puts("明年我就 #{age + 1} 岁了")\nIO.puts("1 + 2 = #{1 + 2}")' },
            { t: 'tip', text: '只有<b>双引号</b>字符串 <code>"..."</code> 才支持插值。单引号 <code>\'abc\'</code> 在 Elixir 里是另一种东西（<b>字符列表</b>，老古董），没有 <code>#{}</code> 的魔法。' },
            { t: 'analogy', text: '<b>🎭 阿波又问</b><br>"<code>#{}</code> 里能塞多复杂的代码？"<br>能塞，但请克制 —— 通常只放一个变量或一个简单算式。复杂逻辑请先算好，再放进 <code>#{}</code>。' },
            { t: 'p', text: '<b>本章小结</b>：认识了 Elixir 的一整套运算符，最关键的两招是：<b>除法永远给浮点</b> 和 <b>双等号与三等号的区别</b>。然后学了<b>字符串插值</b> <code>#{}</code>，这是后面每节课都会用的宝贝。' },
            { t: 'p', text: '<b>下一步</b>：第一瓶魔药的全部内容讲完了 —— 你已经能和电脑说第一句话、认识它的材料、贴标签、算账。这一瓶喝完，会进入<b>第二瓶</b>：<b>模式匹配</b> —— Elixir 最让初学者措手不及、也最让人上瘾的绝技。' }
          ],
          exercises: [
            {
              id: 's1l4e1',
              title: '练习：做一张名片',
              prompt: '定义 <code>name</code> 和 <code>city</code> 两个变量，用插值打印一句话，格式类似：<code>我是小明，来自北京</code>。',
              starter: 'name = "小明"\ncity = "北京"\n\n# TODO: 用字符串插值打印一句话\n',
              solution: 'name = "小明"\ncity = "北京"\nIO.puts("我是#{name}，来自#{city}")\n',
              checks: [
                { label: '打印了 "我是小明，来自北京"', code: 'String.contains?(out, "我是小明，来自北京")' }
              ],
              hints: ['句子里写 <code>#{name}</code> 就能把变量插进去', '注意逗号要用中文逗号，和示例保持一致']
            },
            {
              id: 's1l4e2',
              title: '练习：购物车小计',
              prompt: '苹果 3 元/斤买 2 斤，香蕉 5 元/斤买 1 斤。算出总价 <code>total</code>，并打印 <code>总价：11 元</code>（用插值）。',
              starter: 'apple = 3 * 2\nbanana = 5 * 1\n\n# TODO: 算出 total 并打印\n',
              solution: 'apple = 3 * 2\nbanana = 5 * 1\ntotal = apple + banana\nIO.puts("总价：#{total} 元")\n',
              checks: [
                { label: 'total 等于 11', code: 'total == 11' },
                { label: '打印了 总价：11 元', code: 'String.contains?(out, "总价：11 元")' }
              ],
              hints: ['<code>total = apple + banana</code>', '打印：<code>IO.puts("总价：#{total} 元")</code>']
            }
          ]
        }
      ],
      quiz: [
        { q: '在 Elixir 里，<code>x = 1</code> 最准确的说法是？', options: ['把 1 装进叫 x 的盒子', '给数据 1 贴上一张叫 x 的标签', '声明 x 的类型是整数'], answer: 1, explain: '这叫"绑定"——给数据贴标签，不是往盒子里塞东西。' },
        { q: '<code>10 / 2</code> 的结果是？', options: ['5', '5.0', '2'], answer: 1, explain: 'Elixir 的 <code>/</code> 永远返回浮点数；要整数商请用 <code>div(10, 2)</code>。' },
        { q: '下面哪个是原子（atom）？', options: ['"ok"', ':ok', '[ok]'], answer: 1, explain: '冒号开头、自己代表自己的就是原子，比如 <code>:ok</code>、<code>:error</code>。' },
        { q: '执行 <code>list = [1,2,3]</code> 再执行 <code>List.delete(list, 2)</code> 之后，list 是？', options: ['[1, 3]', '[1, 2, 3]', '报错'], answer: 1, explain: '数据不可变！delete 返回的是<b>新列表</b>，原来的 list 一动不动。' },
        { q: '哪个写法能把变量 age 插进字符串？', options: ['"我 #{age} 岁"', '"我 {age} 岁"', "'我 #{age} 岁'"], answer: 0, explain: '双引号 + <code>#{}</code>。单引号是字符列表，不支持插值。' }
      ]
    },

    // ===================== 阶段 2 =====================
    {
      id: 's2',
      title: '第二瓶魔药：模式匹配',
      subtitle: 'Elixir 最上瘾的超能力，学会就回不去了',
      icon: '🧩',
      color: '#9B6CFF',
      lessons: [
        {
          id: 's2l1',
          title: '第 1 课 · <code>=</code> 不是赋值，是拼图',
          minutes: 9,
          blocks: [
            { t: 'p', text: '阿波举手："导师，我以前学的语言里 <code>=</code> 是<b>赋值</b>。Elixir 呢？"<br>……好问题。请把"赋值"这两个字<b>从脑子里擦掉</b>，Elixir 里 <code>=</code> 是一台<b>拼图机</b>。' },
            { t: 'p', text: '它让<b>左边</b>的形状跟<b>右边</b>对得上。对得上：成功，顺便把没填的洞填上；对不上：<b>直接翻脸</b>，抛 <code>MatchError</code>。' },
            { t: 'code', title: '拼图（最后一行会报错，故意的）', xfail: 'MatchError', code: 'x = 1        # 左边是空白标签 x，于是 x 被绑定成 1\nIO.puts(x)\n\n1 = x        # 1 和 1 匹配，成功（结果就是 1）\n2 = x        # 2 和 1 对不上 → MatchError！' },
            { t: 'analogy', text: '<b>🧩 拼图</b><br><code>=</code> 是一台拼图机：左边是"<b>带缺口的图纸</b>"，右边是"<b>零件</b>"。形状对得上就拼好（顺便给缺口起名字），对不上就报错。<br>注意：左右两边是<b>同时</b>完成的，不是"先把右边塞进左边的盒子"。' },
            { t: 'p', text: '既然是一台<b>拼图机</b>，它就不只能匹配"贴标签"，也能匹配"拆包裹"：' },
            { t: 'code', title: '一次填多个坑', code: '{a, b} = {1, 2}\nIO.puts(a)   # 1\nIO.puts(b)   # 2' },
            { t: 'tip', text: '这看上去"花哨"，但<b>真正的威力</b>在后面：函数参数、case 子句、<code>{:ok, x}</code> 这类返回值。你会天天用，天天爽。' },
            { t: 'analogy', text: '<b>🎭 阿波的反应</b><br>"等一下，<code>2 = x</code> 这种"两边都不是变量"的写法也能用？"<br>能。因为 <code>=</code> 不在乎"是不是变量"，它在乎"形状对不对"。右边算出是 <code>1</code>，左边的 <code>2</code> 和它形状不同，所以翻脸。' },
            { t: 'p', text: '<b>本章小结</b>：Elixir 的 <code>=</code> 是<b>匹配运算符</b>，不是赋值。左右形状对得上就过，对不上就报错。' },
            { t: 'p', text: '<b>下一步</b>：拼图机既能"贴标签"，也能"拆包裹"。下一节课我们练三种最常用的拆法 —— 列表、元组、映射。' }
          ],
          exercises: [
            {
              id: 's2l1e1',
              title: '练习：拆元组',
              prompt: '把 <code>{:ok, "登录成功"}</code> 匹配到 <code>{status, msg}</code>，然后打印 <code>status</code> 和 <code>msg</code>。',
              starter: 'result = {:ok, "登录成功"}\n\n# TODO: 用模式匹配拆出 status 和 msg\n\nIO.inspect(status)\nIO.inspect(msg)\n',
              solution: 'result = {:ok, "登录成功"}\n{status, msg} = result\nIO.inspect(status)\nIO.inspect(msg)\n',
              checks: [
                { label: 'status 是 :ok', code: 'status == :ok' },
                { label: 'msg 是 "登录成功"', code: 'msg == "登录成功"' }
              ],
              hints: ['写法：<code>{status, msg} = result</code>', '左边写变量名，右边写要拆的东西']
            },
            {
              id: 's2l1e2',
              title: '练习：配对成功了吗？',
              prompt: '下面有一行会报错。先运行看看，然后把报错的那行<b>改对</b>（把 2 改成 1），让它顺利跑完。',
              starter: 'x = 1\n2 = x   # TODO: 这一行会报 MatchError，改成能匹配的值\nIO.puts("匹配成功")\n',
              solution: 'x = 1\n1 = x\nIO.puts("匹配成功")\n',
              checks: [
                { label: '程序没有报错地跑完', code: 'true' },
                { label: '打印了 匹配成功', code: 'String.contains?(out, "匹配成功")' }
              ],
              hints: ['<code>2 = x</code> 对不上，因为 x 是 1', '改成 <code>1 = x</code> 就能对上']
            }
          ]
        },

        {
          id: 's2l2',
          title: '第 2 课 · 拆包裹：列表、元组、映射',
          minutes: 10,
          blocks: [
            { t: 'p', text: '上一节课的 <code>=</code> 既能"贴标签"也能"拆包裹"。这一节我们练<b>拆包裹</b>的几种经典姿势 —— 三种最常用的"包裹"都能被拆开。' },
            { t: 'analogy', text: '<b>🎭 今日登场</b><br>阿波举一反三："那是不是 <code>[a, b] = [1, 2]</code> 也能拆？"<br>能，并且你已经猜到了 —— 这是 Elixir 里<b>最常用</b>的拆法。' },
            { t: 'code', title: '拆列表', code: '[first, second] = ["苹果", "香蕉"]\nIO.puts(first)    # 苹果\n\n# 更常用：[头 | 剩下的]\n[head | tail] = [1, 2, 3]\nIO.inspect(head)  # 1\nIO.inspect(tail)  # [2, 3]' },
            { t: 'p', text: '<code>[head | tail]</code> 是 Elixir 最经典的套路：取第一个元素，剩下的留给 tail。<b>整个列表的递归</b>全靠它 —— 你会一用再用。' },
            { t: 'code', title: '拆映射', code: '%{name: name} = %{name: "小明", age: 18}\nIO.puts(name)   # 小明\n\n# 映射匹配只要"有这个键"就行，右边的键可以更多\n%{age: age} = %{name: "小明", age: 18}\nIO.puts(age)    # 18' },
            { t: 'tip', text: '列表要求<b>个数完全一致</b>，少一个多一个都不行；映射只要求<b>左边的键都存在</b>，右边多出来的键无所谓。' },
            { t: 'analogy', text: '<b>🃏 拆快递</b><br>• 拆列表像"<b>抽第一张牌</b>" —— 一张一张来，按顺序<br>• 拆映射像"<b>按名字取快递柜</b>" —— 给个名字（键），柜子把包裹给你<br>记住了，你这一辈子都在做这两种事。' },
            { t: 'p', text: '<b>本章小结</b>：学会了三种"拆包裹"的姿势 —— 列表（<code>[a, b]</code> 和 <code>[h \| t]</code>）、元组（<code>{:ok, x}</code>）、映射（<code>%{k: v}</code>）。' },
            { t: 'p', text: '<b>下一步</b>：拆得开心，但有时候我们想"我不在乎那个值"或者"我不许它变"。这就引出两个超好用的小符号：<b><code>_</code></b> 和 <b><code>^</code></b>。' }
          ],
          exercises: [
            {
              id: 's2l2e1',
              title: '练习：第一项和剩下的',
              prompt: '把 <code>[10, 20, 30]</code> 拆成 <code>first</code> 和 <code>rest</code>，打印出来（first 应为 10，rest 应为 [20, 30]）。',
              starter: 'nums = [10, 20, 30]\n\n# TODO: 用 [head | tail] 的写法拆开\n\nIO.inspect(first)\nIO.inspect(rest)\n',
              solution: 'nums = [10, 20, 30]\n[first | rest] = nums\nIO.inspect(first)\nIO.inspect(rest)\n',
              checks: [
                { label: 'first 是 10', code: 'first == 10' },
                { label: 'rest 是 [20, 30]', code: 'rest == [20, 30]' }
              ],
              hints: ['写法：<code>[first | rest] = nums</code>', '竖线 <code>|</code> 左边是第一个元素，右边是剩下的列表']
            },
            {
              id: 's2l2e2',
              title: '练习：取快递柜',
              prompt: '有用户信息 <code>user</code>，拆出 <code>name</code> 和 <code>city</code> 并打印。注意 <code>user</code> 里还藏着别的键——没关系。',
              starter: 'user = %{name: "小红", age: 20, city: "上海"}\n\n# TODO: 用 %{...} 匹配出 name 和 city\n\nIO.inspect(name)\nIO.inspect(city)\n',
              solution: 'user = %{name: "小红", age: 20, city: "上海"}\n%{name: name, city: city} = user\nIO.inspect(name)\nIO.inspect(city)\n',
              checks: [
                { label: 'name 是 "小红"', code: 'name == "小红"' },
                { label: 'city 是 "上海"', code: 'city == "上海"' }
              ],
              hints: ['<code>%{name: name, city: city} = user</code>', '右边的键比左边多也没关系']
            }
          ]
        },

        {
          id: 's2l3',
          title: '第 3 课 · 通配符 <code>_</code> 与 钉子 <code>^</code>',
          minutes: 10,
          blocks: [
            { t: 'p', text: '两个小符号，超好用。一节课搞定。' },
            { t: 'analogy', text: '<b>🎭 今日登场</b><br>阿波举一反三："<code>{:ok, x} = {:ok, 42}</code> 我明白，但有时候我<b>只关心第一个字段</b>，第二个字段懒得看 —— 我可以把它扔掉吗？"<br>可以。Elixir 给你一个下划线 <code>_</code>，专门用来"扔"。' },
            { t: 'p', text: '<b>1. 通配符 <code>_</code></b>：这块地我不关心，随便啥都行，而且<b>不绑定变量</b>。' },
            { t: 'code', title: '我不在乎', code: '{status, _} = {:ok, "一大堆数据"}\nIO.inspect(status)   # :ok\n# _ 没有绑定任何东西，写 IO.puts(_) 反而会报错' },
            { t: 'p', text: '<b>2. 钉子 <code>^</code>（pin 运算符）</b>：我要用<b>已有的值</b>去匹配，而不是重新绑定。' },
            { t: 'analogy', text: '<b>📌 为什么需要钉子？</b><br>模式匹配默认看到左边是变量名（比如 <code>x</code>）就当"新绑定"。但有时我们想<b>用 x 现在已经绑定的那个值</b>去匹配，而不是新生成一份。<br>这时候在变量前加一个 <code>^</code>，它就变成"钉死"的"原值"，只能拿来对答案，不能重新贴标签。' },
            { t: 'code', title: '钉住它（第 3 行会报错，故意的）', xfail: 'MatchError', code: 'x = 1\nx = 2        # 允许：重新贴标签\n^x = 1       # 匹配：用 x 现在的值(2)去匹配 1 → 失败！\n\n# 正确用法：\ny = 5\n^y = 5       # 成功' },
            { t: 'analogy', text: '<b>🙈 两个符号的速记</b><br>• <code>_</code> 是"<b>懒得看</b>" —— 占个位，不关心是什么<br>• <code>^</code> 是"<b>把标签钉死</b>" —— 不许换，只能用它对答案<br>两个都短，就一个字符，但能省很多行代码。' },
            { t: 'p', text: '<b>本章小结</b>：<code>_</code> 通配符用来"忽略某一项"，<code>^</code> pin 运算符用来"用已绑定的值去匹配"。' },
            { t: 'p', text: '<b>下一步</b>：现在你拆包裹、忽略、钉值都会了。我们来看 Elixir 里一种极常见的"<b>返回值带标签</b>"的写法 —— 它是模式匹配大显身手的主战场。' }
          ],
          exercises: [
            {
              id: 's2l3e1',
              title: '练习：只关心结果',
              prompt: '服务器返回 <code>{:ok, 200, "一大串 HTML"}</code>。你只想要中间的状态码，用 <code>_</code> 忽略其它。',
              starter: 'resp = {:ok, 200, "一大串 HTML"}\n\n# TODO: 用 _ 忽略不关心的部分，取出 code\n\nIO.inspect(code)\n',
              solution: 'resp = {:ok, 200, "一大串 HTML"}\n{_, code, _} = resp\nIO.inspect(code)\n',
              checks: [
                { label: 'code 是 200', code: 'code == 200' }
              ],
              hints: ['<code>{_, code, _} = resp</code>', '<code>_</code> 可以出现多次，每次都表示"我不关心"']
            },
            {
              id: 's2l3e2',
              title: '练习：钉住检查',
              prompt: '已知 <code>expected = 100</code>。写代码判断 <code>actual</code> 是否等于它：用 <code>^expected = actual</code> 的写法（把 <code>actual</code> 设成 100 让它通过）。',
              starter: 'expected = 100\nactual = 100   # 试着改成 99 看看会发生什么\n\n# TODO: 用 ^expected 去匹配 actual\n\nIO.puts("检查通过")\n',
              solution: 'expected = 100\nactual = 100\n^expected = actual\nIO.puts("检查通过")\n',
              checks: [
                { label: '没有报错', code: 'true' },
                { label: '打印了 检查通过', code: 'String.contains?(out, "检查通过")' }
              ],
              hints: ['写法：<code>^expected = actual</code>', '<code>^</code> 表示"用原来的值去对答案"，对不上就报错']
            }
          ]
        },

        {
          id: 's2l4',
          title: '第 4 课 · 实战：读懂 {:ok, ...}',
          minutes: 12,
          blocks: [
            { t: 'p', text: '上一节的 <code>_</code> 和 <code>^</code> 是模式匹配的"小工具"。这一节我们要看的，是模式匹配真正发威的场合 ——<b>处理函数返回值</b>。' },
            { t: 'analogy', text: '<b>🎭 今日登场</b><br>阿波紧张地举手："我以前遇到错误，要嘛崩、要嘛返回 -1 之类的『魔数』。Elixir 呢？"<br>不抛异常，不返魔数。Elixir 的<b>地道做法</b>是：<b>让返回值自己说『我是成功了还是失败了』</b>。' },
            { t: 'p', text: 'Elixir 有一个<b>约定俗成</b>：函数要么返回 <code>{:ok, 结果}</code>，要么返回 <code>{:error, 原因}</code>。错误不是异常，是普通数据。' },
            { t: 'code', title: '典型返回值', code: 'result = {:ok, 42}\n\ncase result do\n  {:ok, value} -> IO.puts("成功，拿到 #{value}")\n  {:error, reason} -> IO.puts("失败：#{reason}")\nend' },
            { t: 'p', text: '<code>case</code> 就是"拿一个值去匹配好几个图案，谁先对上就走谁"。现在先<b>感受一下</b>这种风格，细节我们到第 5 阶段再细讲。' },
            { t: 'code', title: '再试一个失败的', code: 'result = {:error, "网络断了"}\n\ncase result do\n  {:ok, value} -> IO.puts("成功：#{value}")\n  {:error, reason} -> IO.puts("失败：#{reason}")\nend' },
            { t: 'analogy', text: '<b>🏷️ 为什么"贴标签"这么好？</b><br>把错误也变成普通<b>数据</b>（带 <code>:error</code> 标签的元组），你可以像处理任何数据一样处理它：传给函数、放进列表、做模式匹配。<br>抛异常就像"一声尖叫让所有人听见"；返 <code>{:error, _}</code> 就像"<b>礼貌地把原因递过去</b>"。Elixir 总是选礼貌的那个。' },
            { t: 'tip', text: '这种"用元组贴标签"的风格叫<b>带标签的返回值</b>（tagged tuple）。从今天起，你写的每一个返回"成功 / 失败"的函数，最好都长这样。' },
            { t: 'p', text: '<b>本章小结</b>：Elixir 的地道错误处理是 <code>{:ok, 结果}</code> / <code>{:error, 原因}</code> —— 错误是普通数据，配合 <code>case</code> 干净得要命。' },
            { t: 'p', text: '<b>下一步</b>：第二瓶魔药的全部内容 —— 拼图机、拆包裹、<code>_</code>/<code>^</code>、<code>{:ok, x}</code> —— 都讲完了。下一瓶，我们认识 Elixir 里几种看上去长得像、脾气完全不同的"<b>容器</b>"：列表、元组、映射，以及一位更严格的"亲戚" —— 结构体。' }
          ],
          exercises: [
            {
              id: 's2l4e1',
              title: '练习：处理成功与失败',
              prompt: '写一个模块 <code>Result</code>，里面有函数 <code>handle/1</code>：<ul><li>收到 <code>{:ok, v}</code> 返回 <code>"成功: "</code> 加上 v 的字符串</li><li>收到 <code>{:error, r}</code> 返回 <code>"失败: "</code> 加上 r</li></ul>',
              starter: 'defmodule Result do\n  def handle({:ok, v}) do\n    # TODO: 返回 "成功: " <> to_string(v)\n  end\n\n  def handle({:error, r}) do\n    # TODO: 返回 "失败: " <> r\n  end\nend\n',
              solution: 'defmodule Result do\n  def handle({:ok, v}) do\n    "成功: " <> to_string(v)\n  end\n\n  def handle({:error, r}) do\n    "失败: " <> r\n  end\nend\n',
              checks: [
                { label: 'handle({:ok, 42}) 正确', code: 'Result.handle({:ok, 42}) == "成功: 42"' },
                { label: 'handle({:error, "崩了"}) 正确', code: 'Result.handle({:error, "崩了"}) == "失败: 崩了"' }
              ],
              hints: ['两个 <code>def handle</code> 的参数<b>直接写模式</b>，不用 if', '拼接字符串用 <code>&lt;&gt;</code>，数字转字符串用 <code>to_string(v)</code>']
            },
            {
              id: 's2l4e2',
              title: '练习：case 分支',
              prompt: '用 <code>case</code> 判断 <code>status</code>：<code>200</code> 打印 "OK"，<code>404</code> 打印 "没找到"，其它打印 "未知状态"。',
              starter: 'status = 404\n\n# TODO: 用 case 分三种情况\ncase status do\n  \nend\n',
              solution: 'status = 404\ncase status do\n  200 -> IO.puts("OK")\n  404 -> IO.puts("没找到")\n  _ -> IO.puts("未知状态")\nend\n',
              checks: [
                { label: '打印了 没找到', code: 'String.contains?(out, "没找到")' }
              ],
              hints: ['分支写法：<code>200 -&gt; IO.puts("OK")</code>', '兜底分支用 <code>_ -&gt;</code>']
            }
          ]
        }
      ],
      quiz: [
        { q: '<code>[head | tail] = [1, 2, 3]</code> 之后，tail 是？', options: ['1', '[2, 3]', '3'], answer: 1, explain: '竖线左边拿第一个元素，右边拿到剩下的列表。' },
        { q: '<code>%{a: a} = %{a: 1, b: 2}</code> 会怎样？', options: ['报错，因为键的数量不一样', '成功，a 被绑定为 1', 'a 被绑定为整个映射'], answer: 1, explain: '映射匹配只要求左边的键存在，右边多余的键不管。' },
        { q: '<code>^x = 1</code> 中的 <code>^</code> 是什么意思？', options: ['乘方', '用 x 当前的值去匹配，不重新绑定', '注释'], answer: 1, explain: 'pin 运算符：把变量钉住，用它<b>已有的值</b>对答案。' },
        { q: 'Elixir 里函数处理错误最常见的做法是？', options: ['抛异常', '返回 {:error, 原因} 元组', '返回 nil'], answer: 1, explain: '返回带标签的元组是 idiomatic Elixir，错误变成普通数据，交给模式匹配。' },
        { q: '<code>_</code> 通配符的作用是？', options: ['匹配任意值并绑定变量', '匹配任意值但不绑定', '匹配空值'], answer: 1, explain: '<code>_</code> 表示"这里有个东西，但我不关心"，不会创建变量。' }
      ]
    },

    // ===================== 阶段 3 =====================
    {
      id: 's3',
      title: '第三瓶魔药：不可变的数据世界',
      subtitle: '列表、元组、映射、结构体，以及"修改"的真相',
      icon: '🧱',
      color: '#3FB98C',
      lessons: [
        {
          id: 's3l1',
          title: '第 1 课 · 列表 vs 元组 vs 关键字列表',
          minutes: 12,
          blocks: [
            { t: 'p', text: '瓶子喝到这里你已经有"材料"了。Elixir 里三种最常用的容器：<b>列表</b>、<b>元组</b>、<b>关键字列表</b>。它们三个长得像，脾气完全不同 —— 用错了你会吃苦头。' },
            { t: 'analogy', text: '<b>🎭 今日登场</b><br>阿波拿着三种容器端详："它们长得也差太多了吧 —— 哪个是哪个？"<br>我：等下你看一张图，就不会再搞混。' },
            { t: 'list', items: [
              '<b>列表 list</b> <code>[1, 2, 3]</code>：一串同类型的东西，长度不定，适合"<b>很多个</b>"',
              '<b>元组 tuple</b> <code>{:ok, 42}</code>：固定几个位置，每个位置有固定含义，适合"<b>打包一组相关值</b>"',
              '<b>关键字列表 keyword</b> <code>[name: "小明", age: 18]</code>：本质是"二元组的列表"，可以有<b>重复键</b>、<b>保持顺序</b>，常见于函数选项'
            ] },
            { t: 'code', title: '三者对比', code: 'list = [1, 2, 3]\ntuple = {:ok, "成功"}\nopts = [name: "小明", age: 18]\n\nIO.inspect(list)\nIO.inspect(tuple)\nIO.inspect(opts)\nIO.inspect(opts[:name])   # 用 [] 取值' },
            { t: 'p', text: '性能上也有差异：列表的头尾操作超快（<code>[h | t]</code>），但按下标取第 n 个要"走过去"，比较慢。元组按位置取（<code>elem(t, 0)</code>）是瞬间完成。' },
            { t: 'analogy', text: '<b>🚃🍱📇 三个比喻</b><br>• 列表像<b>火车车厢</b>🚃 —— 可以随便加挂，要第 n 节得从车头数起<br>• 元组像<b>便当盒</b>🍱 —— 几格是固定的，每格装什么心里有数<br>• 关键字列表像<b>名片夹</b>📇 —— 每张卡片是"<b>标签 + 值</b>"，顺序不变<br>记这三个比喻，你一辈子不会搞混。' },
            { t: 'tip', text: '经验法则：<b>2~4 个固定含义的值</b>用元组；<b>一堆同类数据</b>用列表；<b>函数选项 / 配置项</b>用关键字列表。' },
            { t: 'p', text: '<b>本章小结</b>：三种容器各有脾气 —— 列表重头尾、元组重定位、关键字列表重顺序与同名键。' },
            { t: 'p', text: '<b>下一步</b>：列表讲过了，元组讲过了。下一节我们介绍更"自由"的容器 ——<b>映射</b>，它能按"名字"找东西。' }
          ],
          exercises: [
            {
              id: 's3l1e1',
              title: '练习：便当盒',
              prompt: '造一个元组表示"一门课"：<code>{课程名, 学分, 是否必修}</code>，然后分别取出三个值并打印。',
              starter: 'course = {"Elixir 魔法", 3, true}\n\n# TODO: 用模式匹配拆出 name, credit, required\n\nIO.inspect(name)\nIO.inspect(credit)\nIO.inspect(required)\n',
              solution: 'course = {"Elixir 魔法", 3, true}\n{name, credit, required} = course\nIO.inspect(name)\nIO.inspect(credit)\nIO.inspect(required)\n',
              checks: [
                { label: 'name 正确', code: 'name == "Elixir 魔法"' },
                { label: 'credit 是 3', code: 'credit == 3' },
                { label: 'required 是 true', code: 'required == true' }
              ],
              hints: ['<code>{name, credit, required} = course</code>', '个数要对得上，否则匹配失败']
            },
            {
              id: 's3l1e2',
              title: '练习：函数选项',
              prompt: '定义一个函数 <code>greet(name, opts)</code>，从 opts 里读 <code>:loud</code>：如果为 true 就返回大写问候，否则返回普通问候。用 <code>Keyword.get/3</code>。',
              starter: 'defmodule Greeter do\n  def greet(name, opts \\\\ []) do\n    loud = Keyword.get(opts, :loud, false)\n    # TODO: loud 为 true 时返回 "HELLO, 小明"，否则 "hello, 小明"\n  end\nend\n',
              solution: 'defmodule Greeter do\n  def greet(name, opts \\\\ []) do\n    loud = Keyword.get(opts, :loud, false)\n    if loud do\n      "HELLO, " <> name\n    else\n      "hello, " <> name\n    end\n  end\nend\n',
              checks: [
                { label: '默认普通问候', code: 'Greeter.greet("小明") == "hello, 小明"' },
                { label: 'loud: true 时大写', code: 'Greeter.greet("小明", loud: true) == "HELLO, 小明"' }
              ],
              hints: ['<code>if loud do ... else ... end</code>', '字符串转大写：<code>String.upcase(...)</code> 也行']
            }
          ]
        },

        {
          id: 's3l2',
          title: '第 2 课 · 映射 Map：键值对之王',
          minutes: 12,
          blocks: [
            { t: 'p', text: '需要"按名字查东西"时，用<b>映射</b> <code>%{}</code>。键可以是原子，也可以是任何类型。' },
            { t: 'analogy', text: '<b>🎭 今日登场</b><br>阿波："为什么要有列表又有映射？"<br>列表靠<b>位置</b>，映射靠<b>名字</b>。如果你的数据是"<b>第几项代表什么</b>"，用列表；如果你的数据是"<b>这个键对应那个值</b>"，用映射。' },
            { t: 'code', title: '增删改查（其实都是"造新的"）', code: 'user = %{name: "小明", age: 18}\n\nIO.inspect(user.name)                 # 取：:name 键用点语法（键不存在会报错）\nIO.inspect(Map.get(user, :city, "未知")) # 取：带默认值，安全\n\nuser2 = Map.put(user, :city, "北京")    # 加键 → 新映射\nuser3 = %{user2 | age: 19}              # 改已存在的键\nuser4 = Map.delete(user3, :city)        # 删键\n\nIO.inspect(user)\nIO.inspect(user2)' },
            { t: 'p', text: '注意两种"改"的区别：' },
            { t: 'list', items: [
              '<code>Map.put</code>：键不存在也能加，<b>宽松</b>',
              '<code>%{m | age: 19}</code>：只能改<b>已经存在</b>的键，拼错键名会<b>立刻报错</b>（更严格、更安全）'
            ] },
            { t: 'code', title: '常用函数', code: 'm = %{a: 1, b: 2}\nIO.inspect(Map.keys(m))        # [:a, :b]\nIO.inspect(Map.values(m))      # [1, 2]\nIO.inspect(Map.has_key?(m, :a)) # true\nIO.inspect(Map.merge(m, %{c: 3}))' },
            { t: 'tip', text: '键是<b>原子</b>时用 <code>user.name</code> 最省事；键是<b>字符串</b>或<b>动态值</b>时用 <code>Map.get</code> / <code>user["key"]</code>。' },
            { t: 'p', text: '<b>本章小结</b>：映射是"按名字查东西"的容器。增加 / 删除 / 查询都用 <code>Map.xxx</code>；原地"更新已存在的键"用 <code>%{m | k: v}</code> 语法。' },
            { t: 'p', text: '<b>下一步</b>：映射很自由，但有时候"自由"也是问题 —— 拼错键名也不报错。Elixir 给你一个<b>更严格的亲戚</b>：结构体。' }
          ],
          exercises: [
            {
              id: 's3l2e1',
              title: '练习：通讯录',
              prompt: '建一个映射 <code>contact</code>，含 <code>name</code> 和 <code>phone</code>。然后：用 <code>Map.put</code> 加上 <code>email</code>（结果存 <code>c2</code>），再用 <code>%{}</code> 更新语法把 <code>phone</code> 改掉（存 <code>c3</code>）。',
              starter: 'contact = %{name: "小明", phone: "1380000"}\n\n# TODO: c2 = 加上 email: "a@b.com"\nc2 = contact\n\n# TODO: c3 = 把 c2 的 phone 改成 "1390000"\nc3 = c2\n\nIO.inspect(c3)\n',
              solution: 'contact = %{name: "小明", phone: "1380000"}\nc2 = Map.put(contact, :email, "a@b.com")\nc3 = %{c2 | phone: "1390000"}\nIO.inspect(c3)\n',
              checks: [
                { label: 'c3 有 email', code: 'Map.get(c3, :email) == "a@b.com"' },
                { label: 'c3 的 phone 是新的', code: 'Map.get(c3, :phone) == "1390000"' },
                { label: 'contact 没被改动', code: 'Map.get(contact, :phone) == "1380000" and not Map.has_key?(contact, :email)' }
              ],
              hints: ['<code>Map.put(contact, :email, "a@b.com")</code>', '更新已存在的键：<code>%{c2 | phone: "1390000"}</code>']
            },
            {
              id: 's3l2e2',
              title: '练习：统计单词',
              prompt: '给一句空格分隔的话，统计<b>每个单词出现了几次</b>，返回一个映射。提示：<code>String.split/1</code> + <code>Enum.frequencies/1</code>。',
              starter: 'sentence = "elixir is fun and elixir is cool"\n\n# TODO: 拆成单词列表，再统计词频\nwords = String.split(sentence)\nfreq = %{}\n\nIO.inspect(freq)\n',
              solution: 'sentence = "elixir is fun and elixir is cool"\nwords = String.split(sentence)\nfreq = Enum.frequencies(words)\nIO.inspect(freq)\n',
              checks: [
                { label: 'elixir 出现 2 次', code: 'Map.get(freq, "elixir") == 2' },
                { label: 'fun 出现 1 次', code: 'Map.get(freq, "fun") == 1' }
              ],
              hints: ['<code>String.split(sentence)</code> 默认按空格切', '<code>Enum.frequencies(list)</code> 直接给出词频映射']
            }
          ]
        },

        {
          id: 's3l3',
          title: '第 3 课 · 结构体 Struct：带图纸的映射',
          minutes: 10,
          blocks: [
            { t: 'p', text: '映射太自由了，拼错键名也不报错。想要"<b>必须有这几个字段</b>"？用<b>结构体</b>。' },
            { t: 'analogy', text: '<b>🎭 今日登场</b><br>阿波皱眉："我的 <code>User</code> 资料，今天有 <code>:name</code>，明天有人加了 <code>:nmae</code>，程序也不知道，照样能跑 —— 这不危险吗？"<br>这就是结构体要解决的问题。' },
            { t: 'code', title: '定义与使用', code: 'defmodule User do\n  defstruct name: "匿名", age: 0\nend\n\nu = %User{name: "小明"}\nIO.inspect(u)          # %User{age: 0, name: "小明"}\nIO.inspect(u.name)     # 小明\n\nu2 = %{u | age: 20}    # 更新，还是 User\nIO.inspect(u2)' },
            { t: 'p', text: '结构体其实就是"<b>有固定字段表和名字的映射</b>"。带来的好处：' },
            { t: 'list', items: [
              '写错字段名会<b>立刻报错</b>（<code>%User{nmae: "x"}</code> 会炸，救你一命）',
              '打印时能看到类型名 <code>%User{...}</code>，调试超方便',
              '可以给一组数据起名字，代码读起来像文章'
            ] },
            { t: 'code', title: '当心这个坑', code: 'u = %User{name: "小明"}\n# Map.put(u, :nickname, "x")  ← 会报错！结构体不能随便加键\n# 只能更新 defstruct 里声明过的字段' },
            { t: 'analogy', text: '<b>📦 → 📋</b><br>• 映射是"<b>随便贴标签的纸箱</b>"📦，什么都能塞<br>• 结构体是"<b>印好格子的表单</b>"📋，格子外的东西塞不进去<br>想自由用映射，想要安全用结构体。' },
            { t: 'p', text: '<b>本章小结</b>：结构体 = 字段表固定的映射。错字段名立刻报错，类型名也参与打印，是数据建模的<b>主力</b>。' },
            { t: 'p', text: '<b>下一步</b>：第三瓶魔药的最后一节。我们把"不可变"这件事<b>贯彻到底</b>，顺便学一招让你写 Elixir 代码<b>优雅 10 倍</b>的语法 —— 管道操作符。' }
          ],
          exercises: [
            {
              id: 's3l3e1',
              title: '练习：造一张表单',
              prompt: '定义模块 <code>Product</code>，结构体字段为 <code>name</code>（默认 "未命名"）和 <code>price</code>（默认 0）。然后造一个 <code>%Product{name: "魔药", price: 99}</code>。',
              starter: 'defmodule Product do\n  # TODO: defstruct name: "未命名", price: 0\nend\n\np = %Product{name: "魔药", price: 99}\nIO.inspect(p)\n',
              solution: 'defmodule Product do\n  defstruct name: "未命名", price: 0\nend\n\np = %Product{name: "魔药", price: 99}\nIO.inspect(p)\n',
              checks: [
                { label: 'p.name 是 "魔药"', code: 'p.name == "魔药"' },
                { label: 'p.price 是 99', code: 'p.price == 99' }
              ],
              hints: ['在模块里写 <code>defstruct name: "未命名", price: 0</code>', '使用时：<code>%Product{name: "魔药", price: 99}</code>']
            },
            {
              id: 's3l3e2',
              title: '练习：涨价了',
              prompt: '给 <code>Product</code> 加一个函数 <code>raise_price/2</code>，接收产品和涨幅，返回<b>一个新的</b>结构体（价格加上涨幅）。',
              starter: 'defmodule Product do\n  defstruct name: "未命名", price: 0\n\n  # TODO: 定义 raise_price(p, amount)，返回涨价后的新结构体\nend\n\np = %Product{name: "魔药", price: 100}\np2 = Product.raise_price(p, 50)\nIO.inspect(p2)\n',
              solution: 'defmodule Product do\n  defstruct name: "未命名", price: 0\n\n  def raise_price(p, amount) do\n    %{p | price: p.price + amount}\n  end\nend\n\np = %Product{name: "魔药", price: 100}\np2 = Product.raise_price(p, 50)\nIO.inspect(p2)\n',
              checks: [
                { label: 'p2.price 是 150', code: 'p2.price == 150' },
                { label: '原来的 p 没变', code: 'p.price == 100' }
              ],
              hints: ['<code>%{p | price: p.price + amount}</code>', '记住：永远返回<b>新的</b>，不要想着改原来的']
            }
          ]
        },

        {
          id: 's3l4',
          title: '第 4 课 · "修改"的真相：造一个新的',
          minutes: 12,
          blocks: [
            { t: 'p', text: '到这里你应该明白了：Elixir 里<b>没有任何函数会改动你的数据</b>。所有"修改"函数都返回新值。' },
            { t: 'analogy', text: '<b>🎭 今日登场</b><br>阿波："那性能怎么办？每次都全量复制一份，不是很慢？"<br>这个问题问得好。请看下面这张图。' },
            { t: 'code', title: '对比一下', code: 'nums = [3, 1, 2]\n\nsorted = Enum.sort(nums)\nIO.inspect(nums)     # [3, 1, 2]  ← 没变\nIO.inspect(sorted)   # [1, 2, 3]  ← 新的\n\nadded = [0 | nums]      # 在头部加元素，超快\nIO.inspect(added)    # [0, 3, 1, 2]' },
            { t: 'analogy', text: '<b>🧬 结构共享</b><br>不会全量复制。Elixir 用的是<b>结构共享</b>：新列表只造"<b>变化的那点新格子</b>"，剩下的部分<b>直接指向老数据</b>🧬。<br>因为老数据永远不会变，所以共享是绝对安全的。<br>这意味着 <code>[0 | nums]</code> 这种"加一个头"的操作是 O(1)，极快。' },
            { t: 'code', title: '写代码的正确姿势', code: '# ❌ 别的语言的思路（Elixir 里没用）\n# list = List.append(list, x)  然后以为 list 变了\n\n# ✅ Elixir 的思路：把结果接到下一个操作\nresult =\n  [3, 1, 2]\n  |> Enum.sort()\n  |> Enum.map(fn x -> x * 10 end)\n\nIO.inspect(result)   # [10, 20, 30]' },
            { t: 'analogy', text: '<b>🚿 看到 <code>|&gt;</code> 没？</b><br>它是<b>管道操作符</b>：把左边的结果<b>塞</b>进右边的第一个参数。<code>[3, 1, 2] |&gt; Enum.sort()</code> 等价于 <code>Enum.sort([3, 1, 2])</code>。<br>管道让我们能从上到下、从小到大一路串下去读。这就是<b>Elixir 代码读起来像一篇文章</b>的秘密。' },
            { t: 'tip', text: '因为每次都返回新值，所以 Elixir 特别爱用<b>管道 <code>|&gt;</code></b> 把一串操作串起来。下一阶段的主角，全靠它。' },
            { t: 'p', text: '<b>本章小结</b>：Elixir 用"<b>结构共享</b>"让"每次造新值"也不会慢；用<b>管道 <code>|&gt;</code></b>把"每次造新值"写得优雅。两件事一起把 Elixir 的"函数式"哲学彻底落地。' },
            { t: 'p', text: '<b>下一步</b>：三瓶魔药 —— 入门、模式匹配、不可变数据 —— 都讲完了。下一瓶起，我们正式进入<b>函数式的快乐</b>：匿名函数、模块、管道，以及 Enum 高阶函数的正确打开方式。' }
          ],
          exercises: [
            {
              id: 's3l4e1',
              title: '练习：一串操作',
              prompt: '把 <code>[5, 2, 8, 1]</code> 排序、只保留偶数、每个翻倍，最终结果存到 <code>result</code> 并打印。用管道写。',
              starter: 'result =\n  [5, 2, 8, 1]\n  |> Enum.sort()\n  # TODO: 加一步 filter 保留偶数\n  # TODO: 加一步 map 翻倍\n\nIO.inspect(result)\n',
              solution: 'result =\n  [5, 2, 8, 1]\n  |> Enum.sort()\n  |> Enum.filter(fn x -> rem(x, 2) == 0 end)\n  |> Enum.map(fn x -> x * 2 end)\n\nIO.inspect(result)\n',
              checks: [
                { label: 'result 是 [4, 16]', code: 'result == [4, 16]' }
              ],
              hints: ['偶数判断：<code>rem(x, 2) == 0</code>', '管道写法：<code>|&gt; Enum.filter(fn x -&gt; ... end)</code>']
            },
            {
              id: 's3l4e2',
              title: '练习：证明不可变',
              prompt: '给 <code>scores = [60, 70, 80]</code>。用 <code>List.replace_at</code> 改第 2 项为 100 存到 <code>new_scores</code>。然后打印两个列表，证明原来的没变。',
              starter: 'scores = [60, 70, 80]\n\n# TODO: new_scores = 把下标 2 换成 100\nnew_scores = scores\n\nIO.inspect(scores)\nIO.inspect(new_scores)\n',
              solution: 'scores = [60, 70, 80]\nnew_scores = List.replace_at(scores, 2, 100)\nIO.inspect(scores)\nIO.inspect(new_scores)\n',
              checks: [
                { label: 'scores 没变', code: 'scores == [60, 70, 80]' },
                { label: 'new_scores 是 [60, 70, 100]', code: 'new_scores == [60, 70, 100]' }
              ],
              hints: ['<code>List.replace_at(scores, 2, 100)</code>', '下标从 0 开始数']
            }
          ]
        }
      ],
      quiz: [
        { q: '想表达"操作成功并返回 42"，最地道的写法是？', options: ['返回 42', '返回 {:ok, 42}', '返回 "42"'], answer: 1, explain: '带标签的元组 <code>{:ok, 结果}</code> 是 Elixir 的通用约定。' },
        { q: '<code>%{u | age: 20}</code> 和 <code>Map.put(u, :age, 20)</code> 的区别？', options: ['没区别', '%{} 要求键必须已存在，否则报错', 'Map.put 更快'], answer: 1, explain: '<code>%{}</code> 更新语法更严格，能帮你抓住拼错的键名。' },
        { q: '结构体（struct）相比普通映射的最大好处是？', options: ['更快', '字段固定、写错字段名会报错', '能用中文键'], answer: 1, explain: 'struct 有"图纸"，字段集合固定，还带类型名，可读性安全性都更好。' },
        { q: '不可变数据为什么不会导致性能爆炸？', options: ['因为电脑很快', '因为新数据会结构共享，复用没变的部分', '因为 Elixir 会偷偷改原数据'], answer: 1, explain: '结构共享：只复制变化的部分，其余指向同一块内存——安全又省。' },
        { q: '<code>Keyword.get(opts, :loud, false)</code> 的作用是？', options: ['设置默认值', '取 :loud 的值，没有就用 false', '删除 :loud'], answer: 1, explain: '第三个参数是"取不到时的默认值"，处理可选参数非常方便。' }
      ]
    }
  ];

})(typeof window !== 'undefined' ? window : globalThis);
