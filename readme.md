# 📕 小红书洞察与竞品分析助手｜关键词搜索 · 笔记详情 · 评论舆情 · 博主作品（无需登录 / 不封号）

> **💡 一句话价值**：给一个关键词或一条链接，拿回小红书公开笔记、评论和博主数据——直接输出结构化 JSON。做爆款选题、盯竞品、筛 KOL、读评论区，不用再手工刷一小时再记点赞。

**只读公开数据 · 不登录你的小红书账号 · 按量最多 1 万条；包月搜索 / 作品 / 评论分别最多 40 / 30 / 20 · 装进 Agent 就能用口语化指令获取数据**

**维护状态**：持续更新中，当前版本 `1.2.2`，[更新日志](references/changelog.md)。Agent 执行卡见 [SKILL.md](SKILL.md)。

👉 开通 [小红书数据 TOKEN](https://www.guaikei.com)

> **🔥 核心优势（适合放进 Agent）**
>
> - 🔒 **安全只读**：不登录小红书账号；无发布、点赞、评论、关注；无封号风险
> - 💪 **双上限清晰**：按量 Token 单次最多 10000 条；包月搜索 ≤40、作品 ≤30、评论 ≤20
> - 🎛️ **参数说了算**：类型、排序、时间、数量越界就失败，不会偷偷改成默认值
> - 🤖 **一份 JSON**：成功 / 无结果 / 失败同一信封，AI 可直接解析；零第三方依赖
> - 🇨🇳 **国内直连**：Windows / macOS / Linux 均可，不用代理

---

## ✅ 我能帮你解决什么（10 秒判断）

| 你是谁 | 你要做的事 | 用这个技能 |
| --- | --- | --- |
| 🎯 创作者 / 运营 | 下周选题：翻几十条笔记自己记点赞 | 一条搜索拿回标题、摘要和互动数 |
| 📊 品牌 / 投放 | 竞品这周发了什么：每天打开主页往下刷 | 博主作品列表，带发布时间与互动 |
| 🤝 MCN / 商务 | 这个 KOL 值不值得合作：看粉丝拍脑袋 | 粉丝、获赞、收藏一起回来再算比值 |
| 💬 舆情 / 客服 | 评论区在说什么：一条条往下翻 | 一次拉评论，交给 AI 归纳观点 |
| 📰 内容分析 | 这篇为什么火：只有标题猜 | 笔记详情：正文、图片、互动、作者 |
| 🔥 所有人 | 今天刚起来的话题：反复刷发现页 | 「最新 + 一天内」直接筛出来 |

**典型产出**：结构化 JSON（标题、作者、点赞 / 收藏 / 评论 / 分享、链接、时间），可导入 Excel / BI，或交给 AI 继续做：**标题公式、爆款归因、评论聚类、发文节奏、能发出去的报告**。

---

## 🎁 四件事，各用一条命令

| 你要做的事 | 命令 | 你拿到什么 |
| --- | --- | --- |
| 🔍 找选题、看高赞 | `search-cli.js` | 笔记数组。点赞、收藏、评论、分享 |
| 📰 看一篇笔记正文 | `detail-cli.js` | 一个笔记对象。不含评论 |
| 💬 看评论区 | `comment-cli.js` | 评论数组（可按近 N 天过滤） |
| 📸 看博主作品 | `post-cli.js --limit > 0` | `results.note` + 可能有的 `results.user` |
| 👥 看粉丝、获赞、收藏 | `post-cli.js --limit 0` | `results.user`：`fans` / `liked` / `collected` / `interaction` |

不登录、不发布、不点赞、不评论、不关注。私密笔记、草稿、创作者后台和投放后台都不在范围内。

---

## 🚀 3 步开始

**1. 开通 TOKEN**

到[小红书竞品分析助手官网](https://www.guaikei.com)开通。TOKEN 是 16–256 位的字符串。

**2. 配到环境变量**

```bash
# Windows (PowerShell)
$env:GUAIKEI_API_TOKEN = "你的TOKEN"

# macOS / Linux
export GUAIKEI_API_TOKEN="你的TOKEN"
```

**3. 进技能目录，跑第一条——或直接对 AI 说要求**

```bash
cd <本技能所在目录>   # 即 readme.md / SKILL.md 所在的那一层
node src/xiaohongshu/search-cli.js --keyword "露营装备" --type 2 --sort 2 --time 2 --limit 20
```

装进 WorkBuddy、Openclaw、Hermes、豆包办公、千问办公、Claude Code 或 Codex 之后，可以这样说：

- 「帮我找最近一周小红书露营装备的高赞图文，先看 20 条」
- 「这篇笔记评论区近 30 天在吐槽什么」
- 「这个博主多少粉丝，最近发了哪 30 条」
- 「分析这篇小红书爆款笔记为什么火」

> ⚠️ 需要 Node.js 16.14.0+，没有别的依赖。一次只跑一条命令，等进程自己退出。stderr「处理中」不是失败。

---

## ⚡ 最快上手（复制就能跑）

```bash
# 🔎 最近一周「露营装备」高赞图文
node src/xiaohongshu/search-cli.js --keyword "露营装备" --type 2 --sort 2 --time 2 --limit 20

# 🔥 一天内「多巴胺穿搭」最新（包月勿超 40）
node src/xiaohongshu/search-cli.js --keyword "多巴胺穿搭" --sort 1 --time 1 --limit 40

# 📰 看一篇笔记正文与互动
node src/xiaohongshu/detail-cli.js --url "https://www.xiaohongshu.com/explore/xxx?xsec_token=yyy"

# 💬 近 30 天评论（包月勿超 20）
node src/xiaohongshu/comment-cli.js --url "https://www.xiaohongshu.com/explore/xxx" --expired_at 30 --limit 20

# 📸 博主近 30 条作品
node src/xiaohongshu/post-cli.js --url "https://www.xiaohongshu.com/user/profile/xxx" --limit 30

# 👥 只要粉丝、获赞、收藏
node src/xiaohongshu/post-cli.js --url "https://www.xiaohongshu.com/user/profile/xxx" --limit 0
```

> 💡 搜索默认 20 条；评论默认 10 条；博主不写 `--limit` 时只有资料、没有作品列表。  
> 💡 `--time 2` = 一周内（不是 2 天）；`--sort 2` = 最多点赞（不是最新）。`-t` 是类型，`-i` 才是时间。

---

## 🔧 命令与参数详表

> 枚举越界会直接失败（退出码 2），不会改成默认值再请求。更细的链接规则与口语映射见 [references/options.md](references/options.md)、[references/routing.md](references/routing.md)。机器 Schema 见 `assets/`。

**套餐双上限**：技能硬上限 10000（按量）。**包月**超限返回 `PLAN_LIMIT`：搜索 ≤40，作品 ≤30，评论 ≤20；详情无此条数限制。

### 🔍 关键词搜索 `search-cli.js`

| 参数 | 缩写 | 必填 | 取值 | 默认 |
| --- | --- | --- | --- | --- |
| `--keyword` | `-k` | ✅ | 1–50 个字符，不能是链接，不含 `< > " '` | — |
| `--type` | `-t` | | `0` 全部 / `1` 视频 / `2` 图文 | `0` |
| `--sort` | `-s` | | `0` 综合 / `1` 最新 / `2` 最多点赞 / `3` 最多评论 / `4` 最多收藏 | `0` |
| `--time` | `-i` | | `0` 全部 / `1` 一天内 / `2` 一周内 / `3` 半年内 | `0` |
| `--limit` | `-l` | | 1–10000（**包月 Token 实际最多 40**） | `20` |

这些数字不是天数：`--time 2` = 一周内；`--sort 2` = 最多点赞。关键词以 `-` 开头时写成 `--keyword=-AI`，或 `node src/xiaohongshu/search-cli.js -- -AI`。

### 📰 笔记详情 `detail-cli.js`

| 参数 | 缩写 | 必填 | 取值 | 默认 |
| --- | --- | --- | --- | --- |
| `--url` | `-u` | ✅ | 笔记链接或 24 位笔记 id（最长按接口 255） | — |

支持 `explore/{id}`、`discovery/item/{id}`、`xhslink.com|cn` 的 `/m/*` `/o/*`、以及裸 24 位 id。主页链接不要传给本命令。成功时 `results` 是**一条笔记对象**，不含评论。可整段粘贴 App 分享文案，自动抽链并保留 `xsec_token`。

### 👥 博主作品 `post-cli.js`

| 参数 | 缩写 | 必填 | 取值 | 默认 |
| --- | --- | --- | --- | --- |
| `--url` | `-u` | ✅ | 主页链接，或 24 / 29 位 `user_id`（最长按接口 255） | — |
| `--limit` | `-l` | | 0–10000（**包月最多 30**；**`0` = 只要博主互动数据**） | `0` |

支持 `user/profile/{user_id}`、四类短链、24/29 位 id。不传 `--limit` 不会返回作品列表；要看最近发了什么必须写出条数。成功时 `results` 为 `{ note, user }`。可整段粘贴 App 分享文案，自动抽链。

### 💬 笔记评论 `comment-cli.js`

| 参数 | 缩写 | 必填 | 取值 | 默认 |
| --- | --- | --- | --- | --- |
| `--url` | `-u` | ✅ | 笔记链接或 24 位笔记 id（含 `explore`、`discovery/item`、短链） | — |
| `--expired_at` | `-e` | | 正整数天数，或 `YYYY-MM-DD HH:mm:ss`（`--expire` 同义） | 不传则按北京时间近 6 年换算 |
| `--limit` | `-l` | | 1–10000（**包月最多 20**） | `10` |

`expired_at` 是时间过滤，不是分页。`limit=10000` 且 `expired_at=1` 也只返回近 1 天的评论。同样支持整段粘贴 App 分享文案自动抽链。

### 🗂️ Schema 入口

- 输出信封 [output_envelope.schema.json](assets/output_envelope.schema.json)
- 关键词搜索 [入参](assets/search_cli_req.schema.json) / [出参](assets/search_cli_resp.schema.json)
- 笔记详情 [入参](assets/detail_cli_req.schema.json) / [出参](assets/detail_cli_resp.schema.json)
- 博主作品 [入参](assets/post_cli_req.schema.json) / [出参](assets/post_cli_resp.schema.json)
- 笔记评论 [入参](assets/comment_cli_req.schema.json) / [出参](assets/comment_cli_resp.schema.json)

---

## 📦 你会得到什么（真实输出结构示例）

成功、没有结果、失败，都是同一份 JSON。程序和 AI 都能直接读。

```json
{
  "status": "success",
  "error_code": "OK",
  "message": "搜索任务完成",
  "timestamp": "2026/10/22 15:16:11",
  "request": {
    "command": "search",
    "keyword": "露营装备",
    "type": 2,
    "sort": 2,
    "time": 2,
    "limit": 20
  },
  "metadata": {
    "skill_version": "1.2.2",
    "runtime_version": "22.x",
    "execution_time": 34210
  },
  "results": [
    {
      "id": "6a377d460000000000000000",
      "xsec_token": "yyy",
      "title": "深圳奇妙日花费大概多少",
      "desc": "奇妙日如果不买很多周边去互动……",
      "liked_count": "336",
      "collected_count": "128",
      "comment_count": "193",
      "shared_count": "45",
      "user": { "nickname": "xxx", "user_id": "66a8abcd0000000000000000" },
      "publish_time": "2026-09-08 20:06:00",
      "type": "normal"
    }
  ]
}
```

打开某一条笔记时，用 `https://www.xiaohongshu.com/explore/{id}`。有 `xsec_token` 再接上 `?xsec_token=`。

互动数是字符串，空字符串和数字 0 有时不会出现。比较之前先转成数字。

---

## 👥 谁会用它

小红书创作者和运营、品牌市场、MCN 和博主经纪人、需要把公开内容喂给 Agent 的人。

它给的是公开数据，不替你做投放决策。判断还是你来。

---

## ❓ 购买前你可能想问

**🔐 要登录我的小红书账号吗？**  
不用。这个技能不碰你的账号，也不做发布、点赞、评论、关注。

**📡 数据从哪来？**  
经[小红书公开数据接口](https://www.guaikei.com)返回，只覆盖小红书公开可见的内容。除了关键词和链接这类查询参数，不上传你电脑上的其他数据。结果请在个人或团队内部分析时使用。

**🔑 一定要 TOKEN 吗？**  
要。接口按 TOKEN 调用。开通入口在[小红书洞察与竞品分析助手官网](https://www.guaikei.com)。

**⏱️ 查一条要等多久？**  
小批量通常一轮查询就能回来。条数大、或者任务还在处理时，命令会继续等，屏幕上的「处理中」不是失败。等命令结束再看结果。

**🧭 AI 会不会查错平台？**  
技能说明里写明了：只处理小红书。抖音、快手、B 站、微博、公众号不会走这里。

**🌐 我在国内，要代理吗？**  
不用。

**📏 单次能拉多少条？**  
技能侧硬上限 10000 条/次（按量 Token）。**包月 Token** 搜索最多 40、作品最多 30、评论最多 20，超限返回 `PLAN_LIMIT`（退出码 1），不要当网络错误重试。具体计费口径以官网说明为准。

**⚠️ 报错 `PLAN_LIMIT` / 提示包月受限？**  
降低 `--limit` 后须用户同意再跑，或到[官网](https://www.guaikei.com)升级按量；**禁止同参重试**。

---

## 🚧 边界

- 公开笔记、评论、博主信息。私密、草稿、仅粉丝可见、创作者后台、商业化后台都不支持
- 不做写操作
- 按量最多 1 万条；包月更低（搜索 40 / 作品 30 / 评论 20）。用户没说要多少时，搜索默认 20，评论默认 10，博主默认只看资料

成功结果会记在系统临时目录的 `xiaohongshu-guaikei/logs/当天日期/`，不写进技能目录。`XHS_GUAIKEI_DISABLE_LOG=1` 可关闭落盘。

---

## 📚 文档入口

| 你想看什么 | 打开 |
| --- | --- |
| Agent 执行卡 | [SKILL.md](SKILL.md) |
| 命令参数详表 | 本文「🔧 命令与参数详表」；更细见 [references/options.md](references/options.md) |
| 口语 → 参数 | [references/routing.md](references/routing.md) |
| 错误应对 | [references/errors.md](references/errors.md) |
| 环境 / FAQ | [references/faq.md](references/faq.md) |
| 逐步排障 | [references/troubleshooting.md](references/troubleshooting.md) |
| 版本变更 | [references/changelog.md](references/changelog.md) |

---

## 🎉 现在就可以开通

去[小红书洞察分析助手官网](https://www.guaikei.com) 开通 TOKEN

问题反馈 [GitHub Issues](https://github.com/um-why/xiaohongshu-openclaw-skill/issues)
