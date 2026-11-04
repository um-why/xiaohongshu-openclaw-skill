# 小红书 OpenClaw Skill — 问题清单与优化方向

> 审查日期：2026-11-03  
> 范围：本仓库 `xiaohongshu-openclaw-skill`（JS Skill v1.2.1）+ 依赖后端 `D:\Git\guaikei`（XHS REST / MCP / 任务队列）  
> 目标读者：产品 / 后端 / Skill 维护者；面向 Cursor、Codex、WorkBuddy、OpenClaw、Claude Code 等 Agent，以及 GLM / DeepSeek / Kimi / GPT / Claude / Gemini / Grok 等多模型宿主  
> 用法：逐条处理后将 `[ ]` 改为 `[x]`，可在「备注」补充 PR / 提交。建议顺序：**P0 → P1 → P2 → P3**。

---

## 0. 现状一句话

本 Skill 是**零依赖 Node CLI 薄层**：四个命令（搜索 / 详情 / 评论 / 作品）→ `TOKEN` 头调用 guaikei 异步任务 API → 统一 JSON 信封输出。文档偏厚、参数偏「数字枚举」、与后端 MCP 能力不完全对齐；对强模型可用，对弱模型与「普罗大众 Agent」摩擦偏大。

```text
用户自然语言
    → Agent 读 SKILL.md / 选命令 / 拼参数
    → node src/xiaohongshu/*-cli.js
    → HTTPS www.guaikei.com  POST create → GET poll(errcode=1 处理中)
    → stdout JSON 信封 → Agent 摘要给用户
```

---

## 1. 问题清单（按优先级）

### P0 — Critical（正确性 / 安全 / 计费与可用性）

- [x] **P0-0 包月 Token 上限与文档冲突**（对照 douyin-search-claw P0-1）  
  - 位置：guaikei `app/xiaohongshu/note.go`（搜索 >40 → 14）、`post.go`（作品 >30 → 14）、`comment.go`（评论 >20 → **16**）；Skill 文档写 1–10000  
  - 影响：Agent 按文档设 `--limit 50/200` 对包月用户必失败；用户觉得「技能坏了」  
  - 方向：映射 14/16 → `PLAN_LIMIT`；SKILL/readme/options 写明双上限；示例压在套餐内  
  - 备注：2026-11-04 已按 A+B 落地（`backendCodes.js`；版本 1.2.1）。能力探测 API 仍属后续

- [ ] **P0-1 成功日志默认落盘含敏感字段**  
  - 位置：`src/utils/log.js`、`*-cli.js` 成功路径  
  - 问题：默认把整份 stdout JSON 写到 `%TEMP%/xiaohongshu-guaikei/logs/...`，含 `xsec_token`、昵称、正文、评论等  
  - 影响：共享机 / 多用户环境可被同机读取；临时目录清理不可控  
  - 方向：默认脱敏（去掉 token 类字段）或默认关闭落盘；仅 `XHS_GUAIKEI_ENABLE_LOG=1` 时全量；日志权限收紧

- [ ] **P0-2 stderr 打印原始关键词 / URL**  
  - 位置：各 `*-cli.js`  
  - 问题：查询参数明文打到 stderr；宿主可能把 stderr 收录进对话/遥测  
  - 影响：隐私与合规风险  
  - 方向：默认打截断/哈希；调试模式再全量

- [ ] **P0-3 创建任务仍消耗开放计划日额度（含去重命中）**  
  - 位置：后端 `FrequencyCheck` + `OpenLimitPath`（create POST）；Skill 侧 create 重试最多 3 次  
  - 问题：同一参数 20 分钟内 dedup 仍可能走 create 计数；网络抖动重试会加倍消耗  
  - 影响：用户「重跑同一查询」莫名触达日限 `errcode 17`  
  - 方向：后端：dedup 命中不计次；Skill：对可幂等失败区分「勿再 create」；文档写清

- [ ] **P0-4 轮询窗 vs Worker 拉取窗 vs Dedup 窗不一致导致「假超时」**  
  - 位置：后端 Worker 取任务约 **10 min**；客户端轮询最长约 **15 min**；Dedup 19–20 min；GET 结果窗 26–30 min  
  - 问题：积压时任务未在 10 分钟内被 worker 取走可能卡住；客户端 TIMEOUT 后同参重试可能打到旧任务或空档  
  - 影响：Agent 报 TIMEOUT，用户以为服务挂了  
  - 方向：对齐窗口；LoadAll/补偿入队；Skill TIMEOUT 文案引导「同参续等」而非立刻换参

- [ ] **P0-5 HTTP 429 / 业务限流在 poll 路径不可恢复**  
  - 位置：`src/utils/request.js` `classifyPollError` — 凡 `ApiError` 即 fail  
  - 问题：瞬时 429 / 5xx 在长轮询中途直接失败  
  - 影响：大 limit / 高峰时成功率下降  
  - 方向：对 `HTTP_429` / `HTTP_5xx` / 部分可恢复业务码在 poll 内有限重试 + Retry-After

---

### P1 — High（Agent 易错 / 契约漂移 / 体验）

- [ ] **P1-1 SKILL.md 过重且重复，挤占上下文**  
  - 位置：`SKILL.md` ~350 行；口语映射、参数表、示例多处重复  
  - 问题：Cursor create-skill 原则是「concise + progressive disclosure」；弱模型更易漏读后半段  
  - 影响：路由错命令、错传 `-t`/`-i`、默认 limit 搞反  
  - 方向：主文件压到「触发 + 路由 + 4 条最小命令 + 错误处理」；细则只链 `references/`；schema 作权威

- [ ] **P1-2 数字枚举对模型不友好（中美模型通病，弱模型更严重）**  
  - 位置：`--type` 0/1/2、`--sort` 0–4、`--time` 0–3；文档反复强调「2≠2天」  
  - 问题：GLM / DeepSeek / Kimi / 部分 Gemini 更易把「一周」映射成 `--time 7` 或 `--sort 2`  
  - 影响：静默得到「综合+全部时间」或直接 `INVALID_ARGS`  
  - 方向：接受字符串别名：`--sort likes|latest|comments|collects|comprehensive`、`--time day|week|half_year|all`、`--type video|note|all`；数字保留兼容；帮助与 schema 同步

- [ ] **P1-3 `--limit` 默认语义相反（搜索 20 vs 作品 0）**  
  - 位置：`search-cli.js` vs `post-cli.js`；`SKILL.md` 已警告但仍高频踩坑  
  - 问题：Agent 复制搜索习惯省略 limit → 只拿到粉丝数  
  - 影响：「最近作品」空结果类体验  
  - 方向：作品在「用户明确要作品」场景要求显式 limit（已有）；或增加 `--posts N` / 子命令 `profile` vs `posts`；SKILL 顶部用一句话死磕

- [ ] **P1-4 24 位 id / 短链歧义依赖「先问」**  
  - 位置：`src/validate/url.js`；`SKILL.md` §2  
  - 问题：弱模型常直接两个命令都试，浪费额度并触发限流  
  - 影响：配额与延迟  
  - 方向：CLI 增加 `--kind note|user`；歧义时 `AMBIGUOUS_URL`（专用错误码）强制追问；禁止双试写进 SKILL 更醒目位置

- [ ] **P1-5 详情 URL 保留 query，作品/评论服务端剥 query — 缓存键不一致心智**  
  - 位置：Skill `normalizeUrl` 保留 query；后端 `post`/`comment` strip `?…`，`detail` 不 strip  
  - 问题：同一笔记带/不带 `xsec_token` 可能打成不同 detail 任务  
  - 影响：重复计费、结果不一致  
  - 方向：前后端统一规范化规则（建议：路径+id 为键，token 仅作可选增强）；文档写清

- [ ] **P1-6 文档承诺 `url` ≤255，CLI 未校验**  
  - 位置：`assets/*_cli_req.schema.json`、`references/options.md` vs `validate/url.js`  
  - 影响：落到后端晦涩 `errcode 12/13`  
  - 方向：客户端先拦 + 统一 `INVALID_URL`/`INVALID_ARGS`

- [ ] **P1-7 无运行时 schema 校验、无测试、无 CI**  
  - 位置：全仓无 `*test*`、无 `.github`  
  - 影响：契约回归靠人肉；Agent 依赖的信封字段易 silently 漂移  
  - 方向：最小：对 `buildEnvelope` + URL/keyword 纯函数单测；golden JSON fixture；CI 跑 Node 16/18/20/22

- [ ] **P1-8 业务错误码仍是数字字符串（`"15"`/`"17"`…）**  
  - 位置：后端 errcode；Skill 原样透出；`SKILL.md` §5  
  - 问题：Agent 无法稳定分支，只能读中文 `message`  
  - 影响：重试策略混乱（有的该停、有的该等）  
  - 方向：Skill 层映射到稳定枚举：`QUOTA_EXCEEDED` / `BALANCE_LOW` / `TOO_MANY_PENDING` / `PATH_DISABLED`；保留 `upstream_code`。**`14`/`16`→`PLAN_LIMIT` 已在 P0-0 / 1.2.1 完成**

- [ ] **P1-9 产品 API 已在后端存在，Skill 未暴露**  
  - 位置：guaikei `/api/xiaohongshu/product-*` + MCP `xiaohongshu_product_*`  
  - 问题：用户问「小红书商品/带货」时 Agent 可能硬套笔记搜索或说不支持且无替代  
  - 影响：能力缺口与错误路由  
  - 方向：评估是否纳入 v1.3；或在 SKILL「不能做」里明确商品走 MCP/官网

- [ ] **P1-10 与 MCP 契约双轨：认证、校验强度、轮询时长不一致**  
  - 位置：REST=`TOKEN`+`_`；MCP=`Bearer`、无时间戳、关键词最少 2 字、poll 间隔更短  
  - 问题：同一后端两套心智；文档/客服成本高  
  - 方向：长期「一套校验库」；对外文档标明 Skill=REST、MCP=宿主原生工具；轮询策略按 limit 自适应

---

### P2 — Medium（工程质量 / 打包分发 / 可观测）

- [ ] **P2-1 无 `bin` / 全局命令，调用路径过长**  
  - 位置：`package.json` 仅 scripts；Agent 必须 `node src/xiaohongshu/search-cli.js`  
  - 影响：路径写错、工作目录错、Windows 引号地狱  
  - 方向：`bin`: `xhs-search` 等；或单一入口 `xhs <search|detail|comment|post>`

- [ ] **P2-2 `package.json` `main` 指向 search CLI 误导**  
  - 方向：改为无 main 或导出 programmatic API

- [ ] **P2-3 `BASE_URL` 写死 `www.guaikei.com`**  
  - 位置：`src/config/constants.js`  
  - 影响：预发/私有化/故障切换困难  
  - 方向：`GUAIKEI_API_HOST` 环境变量覆盖；保留默认

- [ ] **P2-4 POST create 与 GET poll 的 `_` 时间戳单位依赖后端截断**  
  - 位置：Skill 传 `Date.now()` 毫秒；后端 13 位截成 10 位  
  - 影响：隐式契约，换网关易炸  
  - 方向：客户端显式传秒级 Unix；单测锁定

- [ ] **P2-5 `skill_name` query 后端忽略**  
  - 位置：`src/utils/name.js` → 请求带 `skill_name`；server 无消费  
  - 影响：无法按 Skill 版本做用量/兼容分析  
  - 方向：后端记录 `skill_name` + `skill_version`（可放 header）；Skill 带 `User-Agent: xiaohongshu-tool/1.2.0`

- [ ] **P2-6 死代码 `_warnings`**  
  - 位置：四个 CLI 处理 `_warnings`，`args.js` 从不设置  
  - 方向：实现或删除

- [ ] **P2-7 日志目录日期用本地时区，信封时间用北京时间**  
  - 位置：`log.js` `localDateStr` vs `time.js`  
  - 影响：UTC 机器跨日对账混乱  
  - 方向：统一 Asia/Shanghai 或统一 UTC

- [ ] **P2-8 `printSuccessEnvelope` 破管（broken pipe）退出码不明确**  
  - 位置：`output.js`  
  - 方向：约定非 0 或静默成功；Agent 宿主管道场景可测

- [ ] **P2-9 create 路径对 errcode 2–9 可能无意义重试**  
  - 位置：`request.js` `errcode >= 10` 才 `noRetry`；`2`=提交过频也会重试  
  - 影响：加重限流  
  - 方向：白名单可重试码；过频/余额类立即失败

- [ ] **P2-10 互动数字段为字符串 + 缺省省略 0**  
  - 位置：后端序列化；Skill 透传；文档已提示  
  - 问题：弱模型直接比字符串或把缺失当 null 跳过  
  - 方向：可选 `--numbers numeric` 归一化；或信封加 `results_normalized`；SKILL 给 3 行「必转 Number」示例代码

- [ ] **P2-11 字段命名不统一（跨命令）**  
  - 位置：搜索 `desc` vs 详情 `content`；作品可能 `liked_count`/`likes`；`user.ipLocation` 驼峰  
  - 影响：Agent 写分析脚本易错字段  
  - 方向：Skill 层统一别名（保留原始字段在 `_raw` 或双写过渡期）

- [ ] **P2-12 无安装/分发矩阵文档**  
  - 问题：OpenClaw / WorkBuddy / Cursor / Codex 安装路径各异；readme 偏营销  
  - 方向：`references/install-agents.md`：各宿主如何挂载 Skill、如何注入 `GUAIKEI_API_TOKEN`

- [ ] **P2-13 中英双语缺失**  
  - 位置：SKILL / references / stderr 几乎全中文  
  - 问题：英文系统提示的 Codex / Claude / GPT / Grok 宿主里，中文长文指令遵循率不稳定；反之纯中文对国产模型友好  
  - 方向：`SKILL.md` 中英关键指令并列（短）；`SKILL.zh.md` / `SKILL.en.md` 或 frontmatter `locales`；错误码 message 双语或 `message` + `message_en`

- [ ] **P2-14 无「空结果 vs 失败」评测集**  
  - 方向：固定 fixture：AUTH / INVALID_* / empty / success 最小样例，供 Agent eval 与回归

- [x] **P2-15 微信客服号写在 Skill 正文**  
  - 位置：`SKILL.md` / `readme.md`  
  - 问题：Agent 可能在不合适场景复读手机号；号码变更要发版  
  - 方向：去掉全部微信手机号；开通与支持只链官网 / GitHub Issues  
  - 备注：2026-11-04 已清理；本次不升版本号

---

### P3 — Low（打磨 / 后端联动对照）

- [ ] **P3-1 banner 文案「运营全链路」与「只读」定位冲突** — `utils.js`  
- [ ] **P3-2 homepage frontmatter 官网 vs package homepage GitHub 不一致**  
- [ ] **P3-3 detail schema `nice_count` 与 `liked_count` 语义重复** — 核实后端字段后清理 schema  
- [ ] **P3-4 帮助无参数时：stderr 帮助 + stdout INVALID_ARGS exit 2** — 部分宿主只读一侧会困惑；可改为仅 JSON 或仅帮助  
- [ ] **P3-5 大 limit（>1000）无进度百分比** — 仅「处理中 N/20」；可对用户提示预计耗时  
- [ ] **P3-6 对照 guaikei `server/TODO.md`** — 支付幂等、Token 软删仍可用、Open CORS、日志含 token 等会间接影响本 Skill 用户信任与稳定性（不在本仓修，但跟踪）

---

## 2. 宏观优化方向（专业视角）

### 2.1 产品定位：从「CLI 说明书」升级为「Agent 工具契约」

| 层级 | 现在 | 应变成 |
|------|------|--------|
| 发现 | 长 description + 大量 tags | 短 description（WHAT+WHEN+反向触发）+ 稳定 name |
| 执行 | 人读 Markdown 拼 shell | **机器可读** JSON Schema / Tool Manifest 一等公民 |
| 反馈 | 统一信封（好） | 稳定 **error_code 枚举** + 可执行的 next_action |
| 能力边界 | 散落在 §7 | 顶部「Capabilities / Non-goals」各 5 条以内 |

原则：**模型越弱，自由度应越低**（字符串枚举、子命令、禁止猜测）；**模型越强，给路由原则即可**。同一 Skill 应用「渐进披露」同时服务两者。

### 2.2 架构：三种交付形态并行（同一后端）

```text
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│ A. Node Skill   │     │ B. MCP Server    │     │ C. 托管 HTTP    │
│ (本仓库，广兼容) │     │ (guaikei 已有)   │     │ (未来可选)      │
│ Cursor/Codex/   │     │ Claude/Cursor    │     │ 无本地 Node 的  │
│ WorkBuddy/...   │     │ MCP 原生宿主     │     │ 浏览器 Agent    │
└────────┬────────┘     └────────┬─────────┘     └────────┬────────┘
         │                       │                        │
         └───────────────────────┴────────────────────────┘
                                 │
                    guaikei 任务核心 app/xiaohongshu/*
```

- **短中期**：本仓继续做「零依赖、可复制目录」的最大公约数。  
- **中期**：抽取共享「URL/参数/信封」规范；MCP 与 Skill 输出对齐同一 envelope。  
- **避免**：在 Skill 里再实现一套爬虫；能力只通过 guaikei。

### 2.3 针对多模型的具体策略

| 模型族 | 特点（与本 Skill 相关） | 适配做法 |
|--------|-------------------------|----------|
| **GLM / DeepSeek / Kimi** | 中文指令强；长文档后半易丢；数字枚举易幻视；工具调用格式偶发不稳 | 中文短 SKILL；字符串枚举；把「禁止编造关键词/双试短链」放进前 40 行；错误码可机器分支；示例用复制即跑的一行命令 |
| **GPT / Claude** | 长上下文与工具遵循较好；对「严格退出码 + schema」友好 | 保持 envelope + schema；减少重复叙述；用 references 做 progressive disclosure |
| **Gemini** | 偶发忽略冷门短选项（如 `-i`） | 长选项全名优先写进示例；避免仅短选项 |
| **Grok** | 偏英文系统场景 | 提供英文 SKILL/错误 message；触发词保留 xhs/rednote |
| **所有模型** | 都会在缺 TOKEN 时盲目重试 | `AUTH_*` → next_action=`open https://www.guaikei.com`，`retry=false` 写进信封 |

**建议新增信封字段（向后兼容）：**

```json
{
  "status": "error",
  "error_code": "QUOTA_EXCEEDED",
  "upstream_code": "17",
  "retryable": false,
  "next_action": {
    "type": "ask_user|fix_args|wait_then_same_params|open_url|stop",
    "hint": "今日调用次数已用尽，请明天再试或升级套餐"
  }
}
```

Agent 读 `retryable` + `next_action.type` 比解析中文 `message` 可靠一个数量级。

### 2.4 针对各 Agent 宿主

| 宿主 | 摩擦点 | 优化 |
|------|--------|------|
| **Cursor** | Skill 目录 + env；SKILL 宜短 | 符合 create-skill：description 第三人称；主文件精简；脚本可执行 |
| **Codex / Claude Code** | 偏 shell；长路径易错 | 提供 `bin` 与 `npm scripts`；英文/双语指令 |
| **WorkBuddy / OpenClaw / QClaw** | 可能依赖 frontmatter `metadata.openclaw` | 保持 `primaryEnv`、`requires`；验证各版本解析器是否认 `schemas`/`examples` |
| **通用** | 工作目录必须是技能根 | SKILL 写绝对规则：`cd` 到含 `SKILL.md` 的目录再执行；或用相对 `__dirname` 已 OK，但 Agent 常在仓库根执行 → 文档强调 `node /path/to/skill/src/...` 或装 bin |

### 2.5 体验主路径（普罗大众）

1. **开通 TOKEN**（官网）→ 2. **一键检测** `node .../search-cli.js --self-test`（检查 Node 版本、TOKEN、到 guaikei 连通性，不扣业务量或固定探活）→ 3. **对人说话** 而非记参数。  
缺失 self-test 时，小白与弱 Agent 卡在环境问题上的比例会远高于卡在业务上。

### 2.6 后端（guaikei）需协同的优化（本 Skill 单边无法根治）

详见 `D:\Git\guaikei\server\TODO.md`，与 Skill 强相关的优先项：

1. Dedup 命中不计日限额；create 失败回滚/标失败（H1）  
2. Worker 拉取窗与客户端 poll 窗对齐；status=1 超时补偿（类 XP2-3）  
3. 统一 URL 规范化与错误码语义化  
4. 记录 `skill_name` / `User-Agent` 便于按客户端版本灰度  
5. 开放计划错误返回稳定机器码 + 英文 errmsg

---

## 3. 建议落地路线图

### Phase A — 2 周内（降错率，不改后端也能做）

1. 精简 `SKILL.md` + 抽出 `references/routing.md`  
2. 字符串枚举别名 + `--kind`  
3. 错误码映射表 + `retryable` / `next_action`  
4. 日志默认脱敏 / 可关闭  
5. URL 长度校验；删 `_warnings` 死代码  
6. 最小单测 + fixture  
7. `bin` 统一入口  
8. `references/install-agents.md` + 双语错误 message（至少 error 路径）

### Phase B — 1 月内（前后端契约）

1. guaikei：dedup 不计次、窗口对齐、errcode 语义化  
2. Skill：`GUAIKEI_API_HOST`、秒级时间戳、UA 版本头  
3. 字段归一化选项  
4. 评估 product API 是否进 Skill  
5. Agent eval：用同一批用户话术跑 GLM / DeepSeek / Kimi / GPT / Claude，统计「选对命令 / 选对参数 / 无妄重试」

### Phase C — 季度（生态）

1. MCP 与 Skill 共用 envelope 规范文档  
2. 官方「一键安装」包（各宿主）  
3. 可观测：按 skill_version 看 TIMEOUT/INVALID_ARGS 率  
4. 可选托管 HTTP，服务无 Node 环境

---

## 4. Agent Eval 清单（多模型回归，建议固化）

用固定话术集，人工或脚本判定 Agent 行为（不要求每次真打付费 API，可用 mock）：

| # | 用户话术 | 期望 |
|---|----------|------|
| E1 | 帮我找最近一周露营装备高赞图文 | `search` + sort=likes + time=week + type=note，limit≤40（包月安全） |
| E2 | 这个博主多少粉丝 | `post` + limit=0，不双跑 search |
| E3 | 最近发了什么 | `post` 且 **必须** 追问或带 limit>0 |
| E4 | 只给一个 24 位 hex | 追问笔记还是博主，不连打两命令 |
| E5 | 抖音热搜 | **不**调用本 Skill |
| E6 | 无 TOKEN 环境 | 不空跑；引导开通；不重试 |
| E7 | TIMEOUT 返回 | 最多同参再试 1 次；不立刻改 keyword |
| E8 | 评论区吐槽什么 | `comment` 而非 detail；归纳时转数字字段 |
| E9 | 英文：rednote blogger fans | 正确路由 post limit 0 |
| E10 | `--time 2` 心智 | 若用户说「2天」→ 应澄清或映射 day，而不是 time=2 |

通过率按模型分别记账，专攻失败 case 改 SKILL/CLI，而不是只加文档篇幅。

---

## 5. 问题统计（本仓视角）

| 优先级 | 条目约数 | 主题 |
|--------|----------|------|
| P0 | 6 | 包月双上限(已完成)、安全落盘、额度、超时窗、限流恢复 |
| P1 | 10 | Agent 契约、枚举、歧义 URL、测试、MCP 双轨 |
| P2 | 15 | 分发、可观测、双语、字段归一 |
| P3 | 6 | 文案/schema 边角 |
| **合计** | **~36** | 另跟踪 guaikei `server/TODO.md` ~46 条中间接依赖项 |

---

## 6. 进度跟踪

| 阶段 | 状态 | 备注 |
|------|------|------|
| 问题与方向文档（本文） | 已完成 | 2026-11-03 |
| P0-0 包月双上限 / PLAN_LIMIT | 已完成 | 2026-11-04 · v1.2.1 |
| Phase A | 未开始 | |
| Phase B | 未开始 | 需 guaikei 协同 |
| Phase C | 未开始 | |
| Eval 基线 | 未开始 | |

---

## 7. 相关路径速查

| 用途 | 路径 |
|------|------|
| Agent 主说明 | `SKILL.md` |
| 人类 readme | `readme.md` |
| 参数细则 | `references/options.md` |
| 排障 | `references/troubleshooting.md` |
| Schema | `assets/*.schema.json` |
| CLI | `src/xiaohongshu/*-cli.js` |
| HTTP | `src/utils/request.js` |
| 后端 XHS | `D:\Git\guaikei\server\app\xiaohongshu\` |
| 后端 MCP | `D:\Git\guaikei\server\mcp\xiaohongshu\` |
| 后端总待办 | `D:\Git\guaikei\server\TODO.md` |
