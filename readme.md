# 📊 小红书洞察与竞品分析助手

> **一句话价值主张**：把「人工刷 2 小时小红书」变成「一条命令 30 秒」——输入关键词或链接，直接拿回结构化爆款数据，AI 接着就能帮你做选题、盯竞品、筛 KOL、读评论区。

**4 大能力 · 单次最多 1 万条 · 无需登录小红书 · 无需部署，Node.js 一键运行**

---

## 😫 如果你在做小红书运营，这些场景你一定熟悉

| 你的日常                    | 传统做法                                | 用本SKILL后                                      |
| --------------------------- | --------------------------------------- | ------------------------------------------------ |
| 找下周的选题方向            | 翻 50 条笔记，手动记点赞收藏，约 1 小时 | `search-cli` 一条命令返回 50 条结构化数据，30 秒 |
| 盯竞品账号动更新了什么      | 每天手动刷对方主页                      | `post-cli` 直接拉作品列表 + 发布时间 + 互动数据  |
| 判断一个 KOL 数据有没有注水 | 靠感觉、看粉丝量拍脑袋                  | 三项原始互动数值到手，评论/点赞比值一算便知      |
| 摸清用户到底在吐槽什么      | 一条条往下翻评论区                      | `comment-cli` 一次拉全量评论，AI 直接做舆情归纳  |
| 追今天刚起的热点            | 反复刷发现页碰运气                      | 「最新排序 + 一天内」精准捕获实时内容            |

---

## 🔥 为什么选它

- **🔒 安全**：不登录你的小红书账号，零封号风险——这是爬虫方案给不了的
- **💪 强大**：单次最多拉取 **1 万条**数据，出参字段全面，可见即所得
- **🎛️ 精准**：内容类型 / 排序 / 时间范围 / 数量四维筛选，直出你要的那批数据
- **🪶 轻量**：零依赖、零部署，装好 Node.js 就能跑，Windows / macOS / Linux 通吃
- **🤖 为 AI 而生**：标准 JSON 出参 + 完整 SKILL.md，WorkBuddy / Openclaw / Claude Code / Cursor 等 Agent 开箱即用
- **📁 省心**：每次执行结果自动归档本地日志，写周报、做复盘直接翻记录

## 🎯 核心能力一览

| 能力          | 输入     | 你拿到什么                                             |
| ------------- | -------- | ------------------------------------------------------ |
| 🔍 关键词搜索 | 关键词   | 笔记列表 + 作者 + 点赞/收藏/评论 + 可直接打开的链接    |
| 📰 笔记详情   | 笔记链接 | 标题、正文、图片、互动数据、作者信息                   |
| 💬 评论获取   | 笔记链接 | 评论内容 + 评论者 + 互动数据，支持按时间剔除过期评论   |
| 👥 博主监控   | 主页链接 | 公开作品列表；`--limit 0` 时返回粉丝量、点赞量、收藏量 |

## 🚀 30 秒上手

**第 1 步**：访问 [小红书实时数据获取技能官网](https://www.guaikei.com) 开通 TOKEN（数据 API 服务，开通即用）

**第 2 步**：配置环境变量

```bash
# Windows (PowerShell)
$env:GUAIKEI_API_TOKEN = "你的TOKEN"

# macOS / Linux
export GUAIKEI_API_TOKEN="你的TOKEN"
```

**第 3 步**：跑第一条命令

```bash
# 搜「露营装备」最近一周高赞图文，取 20 条
node src/xiaohongshu/search-cli.js --keyword "露营装备" --type 2 --sort 2 --time 2 --limit 20
```

更多命令示例：

```bash
# 追热点：一天内最新内容
node src/xiaohongshu/search-cli.js --keyword "多巴胺穿搭" --sort 1 --time 1 --limit 50

# 拉一篇笔记的 200 条评论做舆情分析
node src/xiaohongshu/comment-cli.js --url "https://www.xiaohongshu.com/explore/xxx?xsec_token=yyy" --limit 200

# 盯竞品：博主近 30 条作品
node src/xiaohongshu/post-cli.js --url "https://www.xiaohongshu.com/user/profile/xxx?xsec_token=yyy" --limit 30

# 查博主真实体量：粉丝量、点赞量、收藏量
node src/xiaohongshu/post-cli.js --url "https://www.xiaohongshu.com/user/profile/xxx?xsec_token=yyy" --limit 0
```

## 📦 数据长什么样

每条结果都是标准 JSON，AI 可直接消化、程序可直接解析：

```json
{
  [
    {
      "id": "6a377...d46",
      "title": "深圳奇妙日花费大概多少",
      "desc": "奇妙日如果不买很多周边去互动 花门票钱进去能看到些什么呢？ 二编 奇妙日换成在深圳的了喔 #kpl奇妙日",
      "liked_count": "336",
      "collected_count": "128",
      "comment_count": "193",
      "shared_count": "45",
      "user": { "nickname": "xxx", "user_id": "..." },
      "image_list": [
        "https://sns-na-i11.xhscdn.com/spectrum/...",
        "https://sns-na-i11.xhscdn.com/spectrum/...",
        "https://sns-na-i11.xhscdn.com/spectrum/..."
      ],
      "publish_time": "2026-09-08 20:06:00",
      "timestamp": "1788870094000",
      "type": "normal",
      "url": "https://www.xiaohongshu.com/explore/...?xsec_token=..."
    }
  ]
}
```

> 拿到数据后，让 AI 继续做：标题公式提炼 → 爆款归因 → 评论区观点聚类 → 竞品发文节奏分析 → 生成报告，一条链路到底。

## ✨ 适用人群

✅ 小红书内容创作者 / 运营 | ✅ 品牌营销 / 市场人员 | ✅ 数据分析师 | ✅ MCN 机构 / 博主经纪人 | ✅ AI Agent / 自动化工作流玩家

## 💬 购买前你可能想问

**Q：需要登录我的小红书账号吗？**
不需要。全程只读取公开数据，你的账号与工具零接触，无风控、无封号风险。

**Q：数据从哪来，合规吗？**
数据经 [小红书洞察与竞品分析助手](https://www.guaikei.com) 官方数据接口返回，仅覆盖小红书**公开可见**内容。除关键词/链接等查询参数外，不上传本机任何数据。结果限个人/团队内部分析使用。

**Q：我在国内，网络有要求吗？**
国内直连可用，无需代理。

**Q：一定要付费 TOKEN 吗？**
是。数据接口由 guaikei.com 提供，需开通 TOKEN（16-256 位字符串）后使用，成本远低于同类 SaaS 数据平台年费。

**Q：AI 工具里怎么用？**
把本技能装进 WorkBuddy / Openclaw / QClaw / ima / Claude Code / Cursor，然后直接说人话：「帮我找最近一周小红书露营装备的高赞笔记」，Agent 会自动选对脚本、传对参数。

## ⚠️ 诚实的边界说明

- 仅支持小红书**公开数据**：私密笔记、草稿、创作者后台数据（涨粉曲线、粉丝画像）、商业化数据（报价、聚光后台）均不支持，也不会支持
- 不提供任何写操作（发布/点赞/评论/关注）
- 不替你做营销决策——工具给数据，判断权在你

## 📞 帮助与支持

- TOKEN 开通 / 使用帮助：[小红书实时数据获取官网](https://www.guaikei.com)
- 问题反馈：[GitHub Issues](https://github.com/um-why/xiaohongshu-openclaw-skill/issues)
- 完整参数说明：[references/options.md](references/options.md) &nbsp;|&nbsp; 更新日志：[references/changelog.md](references/changelog.md)
