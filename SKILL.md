---
name: xiaohongshu-tool
description: "小红书公开数据只读技能：关键词搜笔记、爆款选题、笔记详情、评论舆情、博主作品、粉丝获赞与收藏，输出 JSON，不登录不发布。触发词：小红书、小红薯、xhs、rednote、笔记链接、博主主页、竞品监控、KOL筛选、评论分析。用户要查小红书笔记、评论、选题、竞品或舆情时使用；抖音、快手、B站、微博、公众号不要用本技能。"
license: MIT
version: 1.2.2
category: 数据分析
homepage: https://www.guaikei.com
metadata:
  openclaw:
    emoji: "📕"
    primaryEnv: GUAIKEI_API_TOKEN
    requires:
      bins:
        - node
      env:
        - GUAIKEI_API_TOKEN
  enabled: true
  type: command
  runtime: "nodejs@16.14.0+"
  requires:
    bins: ["node"]
    env: ["GUAIKEI_API_TOKEN"]
  env_desc:
    GUAIKEI_API_TOKEN: "小红书数据 API 访问令牌。未配置时无法调用接口；可通过 https://www.guaikei.com 开通。"
  keywords:
    - "小红书"
    - "小红薯"
    - "xhs"
    - "rednote"
    - "小红书搜索"
    - "小红书笔记"
    - "小红书评论"
    - "小红书博主"
    - "爆款选题"
    - "竞品分析"
    - "KOL筛选"
    - "评论舆情"
    - "xiaohongshu"
  category:
    - "Integrations"
    - "Research"
    - "Creative"
    - "内容创作"
    - "数据分析"
    - "商业运营"
  tags:
    - "小红书"
    - "小红书搜索"
    - "小红书笔记"
    - "小红书评论"
    - "小红书博主"
    - "小红书运营"
    - "小红书数据分析"
    - "爆款选题"
    - "竞品分析"
    - "KOL筛选"
    - "评论舆情分析"
    - "内容选题调研"
    - "趋势洞察"
    - "种草营销"
    - "新媒体运营"
    - "关键词搜索"
    - "评论分析"
    - "选题调研"
    - "爆款挖掘"
    - "小红书内容创作"
    - "小红书营销"
  schemas:
    - name: "输出信封"
      file: "assets/output_envelope.schema.json"
    - name: "搜索入参"
      file: "assets/search_cli_req.schema.json"
    - name: "搜索出参"
      file: "assets/search_cli_resp.schema.json"
    - name: "详情入参"
      file: "assets/detail_cli_req.schema.json"
    - name: "详情出参"
      file: "assets/detail_cli_resp.schema.json"
    - name: "评论入参"
      file: "assets/comment_cli_req.schema.json"
    - name: "评论出参"
      file: "assets/comment_cli_resp.schema.json"
    - name: "作品入参"
      file: "assets/post_cli_req.schema.json"
    - name: "作品出参"
      file: "assets/post_cli_resp.schema.json"
  examples:
    - "帮我找最近一周小红书『露营装备』的高赞图文笔记 → node src/xiaohongshu/search-cli.js --keyword '露营装备' --type 2 --sort 2 --time 2 --limit 20"
    - "这条小红书笔记评论区在吐槽什么 → node src/xiaohongshu/comment-cli.js --url 'https://www.xiaohongshu.com/explore/xxx?xsec_token=yyy' --limit 20"
    - "看这个小红书博主最近 30 条作品发什么 → node src/xiaohongshu/post-cli.js --url 'https://www.xiaohongshu.com/user/profile/xxx?xsec_token=yyy' --limit 30"
    - "分析这篇小红书爆款笔记为什么火 → node src/xiaohongshu/detail-cli.js --url 'https://www.xiaohongshu.com/explore/xxx?xsec_token=yyy'"
    - "监控『多巴胺穿搭』最新动态 → node src/xiaohongshu/search-cli.js --keyword '多巴胺穿搭' --sort 1 --time 1 --limit 40"
    - "这个小红书博主多少粉丝 → node src/xiaohongshu/post-cli.js --url 'https://www.xiaohongshu.com/user/profile/xxx' --limit 0"
    - "只要这篇笔记近 30 天的评论 → node src/xiaohongshu/comment-cli.js --url 'https://www.xiaohongshu.com/explore/xxx' --expired_at 30 --limit 20"
---

# 📕 小红书洞察与竞品分析助手

小红书公开数据只读：关键词搜笔记、笔记详情、评论、博主作品与粉丝数据；输出结构化 JSON。适用于选题、竞品、KOL、舆情。

## 1. ⚠️ 执行前置（每次必过）

1. **先 `cd` 到本 SKILL.md 所在目录**，再执行 `node src/xiaohongshu/*.js`。
2. **确认 `GUAIKEI_API_TOKEN` 已配置**。未配置 → 不执行，走 `AUTH_REQUIRED`（见 §7 / [errors.md](references/errors.md)），禁止先跑「试试看」。
3. **一次只跑一条命令，等进程自己结束**。查询最多约 20 次退避，只算等待大约 15 分钟。stderr「处理中」不是失败。**未退出前不要判定失败，不要并发/重复同一命令。**
4. **必填参数不齐先追问**（话术见 [ask.md](references/ask.md)），禁止猜测关键词或链接。

> 开通[小红书洞察与竞品分析助手](https://www.guaikei.com) TOKEN。配 TOKEN / 落盘 / FAQ → [faq.md](references/faq.md)。

## 2. 💎 价值与典型场景（10 秒判断该不该用）

| 你是谁 | 你要做的事 | 用哪个命令 |
| --- | --- | --- |
| 创作者 / 运营 | 找爆款选题、看高赞图文共同点 | `search-cli.js --sort 2` |
| 品牌 / 投放 | 监控已知博主发文与互动 | `post-cli.js`（要作品须显式 `--limit`） |
| 内容分析 | 看一篇笔记正文、图片、互动 | `detail-cli.js` |
| 舆情 / 客服 | 评论区在吐槽还是在夸 | `comment-cli.js` |
| MCN / 商务 | 看粉丝、获赞、收藏 | `post-cli.js --limit 0` |

**何时用**：用户提小红书/小红薯/xhs/rednote，并要搜、看、分析公开数据；或给了笔记/主页/短链/id。

**何时不用**：只写文案不查数；平台是抖音/快手/B 站/微博/公众号；要登录、私密、草稿、创作者/商业化后台。

**为什么用它**：只读、不登录；零第三方依赖；按量单次最多 1 万条；stdout 纯 JSON、日志走 stderr。

> **合规**：调用会把关键词/链接发到 `www.guaikei.com`。不上传本地文件。仅公开数据，限个人/团队内部分析。

## 3. 🎯 识别卡（选命令，命中即停）

| 用户要什么 | 命令 | 最少要有 |
| --- | --- | --- |
| 搜笔记、爆款、选题 | `node src/xiaohongshu/search-cli.js` | `--keyword` |
| 一篇笔记的正文 / 为什么火 | `node src/xiaohongshu/detail-cli.js` | 笔记链接或 24 位笔记 id |
| 一篇笔记的评论 / 舆情 | `node src/xiaohongshu/comment-cli.js` | 笔记链接或 24 位笔记 id |
| 博主作品、粉丝、获赞 | `node src/xiaohongshu/post-cli.js` | 主页链接或 24/29 位 `user_id` |

- 正文和评论都要：先 `detail-cli`，再 `comment-cli`。
- 24 位 id / 短链类型不明：先追问（[ask.md](references/ask.md)），禁止两个命令都试。
- App 分享文案可整段粘贴给 `--url`，命令会自动抽链（保留 `xsec_token`）。

## 4. 🛠️ 命令一行例（详参下沉）

> **详参 / 枚举**：需要确认取值时再读 [options.md](references/options.md) 。**不要每次都读。**  
> 注意：`-t` = 内容类型，`-i` = 发布时间。`--time 2` = 一周内；`--sort 2` = 最多点赞。

```bash
node src/xiaohongshu/search-cli.js --keyword "露营装备" --type 2 --sort 2 --time 2 --limit 20
node src/xiaohongshu/search-cli.js --keyword "多巴胺穿搭" --sort 1 --time 1 --limit 40
node src/xiaohongshu/detail-cli.js --url "https://www.xiaohongshu.com/explore/xxx?xsec_token=yyy"
node src/xiaohongshu/comment-cli.js --url "https://www.xiaohongshu.com/explore/xxx" --limit 20
node src/xiaohongshu/comment-cli.js --url "https://www.xiaohongshu.com/explore/xxx" --expired_at 30 --limit 20
node src/xiaohongshu/post-cli.js --url "https://www.xiaohongshu.com/user/profile/xxx" --limit 30
node src/xiaohongshu/post-cli.js --url "https://www.xiaohongshu.com/user/profile/xxx" --limit 0
```

**数量 / 套餐**：搜索默认 **20**；评论默认 **10**；博主不传 `--limit` 默认 **0**（只有博主信息）。不要擅自抓 10000。技能硬上限 10000（按量）。**包月**超限 → `PLAN_LIMIT`：搜索 ≤40，作品 ≤30，评论 ≤20；详情无此条数限制。

口语 → flag 对照 → [routing.md](references/routing.md)。

## 5. 🔀 意图路由（按序命中即停）

```
1. 评论/留言/舆情 + 对象是一篇笔记 → comment-cli
2. 作品/主页/账号/博主/粉丝/获赞 → post-cli
3. 一篇笔记的标题/正文/图片/互动 → detail-cli
4. 有关键词且无以上信号 → search-cli
5. 都不明确 → 先追问（ask.md）
```

消歧：`/user/profile/` → 只能 post；`/explore/` 或 `/discovery/item/` + 评论 → comment，+ 正文 → detail，都没说 → 追问。选题可先 `search --sort 2 --time 2 --limit 30`，再对挑出的笔记跑详情。竞品看作品必须显式 `--limit`。

## 6. 📜 输出（摘要）

- stdout = 统一 JSON 信封；stderr = 日志。向用户**只摘关键字段**，勿整份粘贴。
- `status=empty` + `NO_MATCH` 退出码 0，**不是失败**。
- `results`：搜/评论 = 数组；详情 = 单对象；作品 = `{note,user}`。
- 互动数是字符串；比较前先转数字。

完整信封与形态 → [contract.md](references/contract.md)。Schema 在 `assets/`。

## 7. 🚨 错误应对（摘要）

| error_code | 退出码 | Agent |
| --- | --- | --- |
| `AUTH_*` | 3 | **禁止重试**；引导官网配 TOKEN |
| `PLAN_LIMIT` | 1 | **禁止同参重试**；降 limit 须用户同意（搜≤40 / 作品≤30 / 评论≤20） |
| `INSUFFICIENT_BALANCE` / `DAILY_LIMIT` | 1 | **禁止同参重试**；充值或明日/调限额 |
| `RATE_LIMITED` | 1 | **禁止立即重试** |
| `INVALID_*` | 1/2 | 换词/换链/按 help 改一次；禁止擅自改默认再跑 |
| `NO_MATCH` | 0 | 如实无结果 |
| `TIMEOUT` / `NETWORK_ERROR` | 1 | 同参续等最多 1 次（搜/作品/评论约 20 分钟、详情约 19 分钟复用）；禁止改参「重做」 |

全表 → [errors.md](references/errors.md)。

## 8. 🛑 硬性禁止

- 不得编造数据；不得把空结果说成有结果。
- 不得未征得同意就自动改搜索条件重试；不得编造关键词或链接。
- `AUTH_*` / `PLAN_LIMIT` / `INSUFFICIENT_BALANCE` / `RATE_LIMITED` / `DAILY_LIMIT` 后不得同参或立即重试。
- 不得把 stderr 原文转述给用户；不得整份 JSON 贴回对话。
- 不得做登录态/私密获取或任何写操作。
- 不得在未 cd 到技能目录时执行 `node src/xiaohongshu/*.js`。
- 24 位 id / 短链类型不明时，不得两个命令都试。

## 9. 📚 何时读 references（入口总表）

| 时机 | 打开 |
| --- | --- |
| 确认枚举/参数取值 | [options.md](references/options.md) |
| 口语指令 → flag / 链接消歧 | [routing.md](references/routing.md) |
| 信封 / `results` 形态 | [contract.md](references/contract.md) |
| 完整错误表 | [errors.md](references/errors.md) |
| 缺参追问话术 | [ask.md](references/ask.md) |
| 环境 / FAQ | [faq.md](references/faq.md) |
| 逐步排障问答 | [troubleshooting.md](references/troubleshooting.md) |
| 版本变更 | [changelog.md](references/changelog.md) |
| 技术人员总览 | [readme.md](readme.md) |
| 机器可校验 Schema | `assets/*.schema.json` |
