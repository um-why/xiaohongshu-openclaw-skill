# 退出码与错误码 → Agent 应对

> **何时读**：遇到非常见错误、或要核对完整应对表时再读。日常以 `SKILL.md` 错误摘要为准。

| error_code | 退出码 | 含义 | Agent 必须做什么 |
| --- | --- | --- | --- |
| `AUTH_REQUIRED` / `AUTH_ERROR` | 3 | TOKEN 未配置 / 无效 / **停用（业务 errcode 410 Gone）** / **未开通该接口（405）** / 过期 | **禁止重试**。引导到 [官网](https://www.guaikei.com) 检查、开通或续期 `GUAIKEI_API_TOKEN`。**不要**把 410/Gone 说成「接口下线」或「任务已过期」 |
| `PLAN_LIMIT` | 1 | 套餐单次条数超限（常见于包月；搜索/作品多为后端 14，评论多为 16） | **禁止同参重试**。转述 `message`；可建议降 `--limit`（搜索≤40，作品≤30，评论≤20）或升级按量；**须用户同意后再跑** |
| `INSUFFICIENT_BALANCE` | 1 | 余额不足（搜/作品多为 15，评论多为 17；详情接口的 14 也是余额，不是套餐超限） | **禁止同参重试**。引导官网充值 |
| `RATE_LIMITED` | 1 | 短时间提交过多（常为后端 2） | **禁止立即重试**。告知稍后；经用户同意后再跑 |
| `DAILY_LIMIT` | 1 | 今日消费已达每日上限（后端 18） | **禁止同参重试**。明日再试或到官网调整限额 |
| `INVALID_KEYWORD` | 1 | 关键词不合法（长度/是链接/特殊符号；纯 emoji 洗空也属此类） | 转述 `message`，请用户换词；**禁止自动改词重试** |
| `INVALID_URL` | 1 | 链接或 id 无法识别，或命令与链接类型不一致 | 请用户给对类型的链接（见 [routing.md](routing.md)） |
| `INVALID_ARGS` | 2 | 参数解析失败，或枚举/范围/`expired_at` 不合法 | 按 `--help` 或 [options.md](options.md) 改一次；**禁止改成默认值后自动再跑** |
| `NO_MATCH`（status=empty） | 0 | 无结果，**不是失败** | 如实告知；可建议放宽条件，**经用户同意后**再试 |
| `TIMEOUT` / `NETWORK_ERROR` | 1 | 任务仍在处理，或网络/单次请求超时 | 告知后同参最多再试 1 次。搜索/作品/评论约 20 分钟、详情约 19 分钟内会复用；宿主提前杀进程后不要立刻连打 |
| `HTTP_429` | 1 | HTTP 频率限制 | 降低频率、减小 `--limit`，稍后重试，不要立刻连打 |
| `HTTP_404` / `HTTP_410` | 1 | 传输层路径不存在或 HTTP Gone | 如实报告；与业务码 410（TOKEN 停用→`AUTH_ERROR`）不同。不反复重试 |
| `HTTP_5xx` / `HTTP_*` | 1 | 服务端或其它 HTTP 失败 | 等 1–2 分钟再试一次；持续失败带上 `metadata.execution_time` 与 `request` |
| `API_ERROR` | 1 | 上游返回了未单独映射的业务码 | 转述 `message`（含 `errcode=`）；**禁止**把裸数字码当成任务过期；不反复重试 |

信封与 `results` 形态见 [contract.md](contract.md)。环境/落盘 FAQ 见 [faq.md](faq.md)。
