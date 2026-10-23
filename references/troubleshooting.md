# 常见问题排查

本文件对应 `SKILL.md` 的退出码。失败时读 stdout 里那一份 JSON 的 `error_code` 和 `message`。stderr 只有运行日志。

成功结果写在系统临时目录的 `xiaohongshu-guaikei/logs/当天日期/`。Windows 通常是 `%TEMP%`，macOS / Linux 是 `os.tmpdir()`。不在技能目录里，系统清理临时文件后会消失。`XHS_GUAIKEI_DISABLE_LOG=1` 可以关闭落盘。

**Q1. `error_code` 为 `AUTH_REQUIRED` 或 `AUTH_ERROR`，退出码 3？**

TOKEN 未配置、格式不对，或接口拒绝。确认为 16–256 位字母、数字、下划线或连字符，没有多余空格或换行。过期后到[小红书数据 TOKEN 开通页](https://www.guaikei.com)重新开通。不要重试。

**Q2. `error_code` 为 `HTTP_429`？**

触发频率限制。降低调用频率、减小 `--limit`，稍后再试。不要立刻连打。

**Q3. `error_code` 为 `HTTP_5xx`？**

服务端临时故障。等 1–2 分钟再试一次。持续失败时带上 `metadata.execution_time` 和 `request` 联系支持。

**Q4. `error_code` 是 `"13"`、`"14"` 这样的数字字符串？**

这是接口返回的业务错误，含义看 `message`。可能是参数不合法、额度或余额不足、笔记不存在。不要把所有这类错误都当成「笔记已删除」，也不要原样反复重试。

**Q5. `error_code` 为 `TIMEOUT` 或 `NETWORK_ERROR`？**

`TIMEOUT` 表示轮询结束时任务仍在处理，或单次请求超时。`NETWORK_ERROR` 表示网络失败。确认能访问[小红书数据接口官网](https://www.guaikei.com)。可以再试一次。stderr 里的「处理中」不是失败，等进程自己退出。任务一直处于处理中时，命令最长大约再等 15 分钟；宿主工具如果更早结束进程，不要立刻用同一组参数连打。

**Q6. `error_code` 为 `INVALID_URL`？**

链接和命令对不上，或格式不支持。

- 详情、评论：`explore/{id}`、`discovery/item/{id}`、`xhslink.com` 与 `xhslink.cn` 的 `/m/*` 和 `/o/*`、24 位笔记 id
- 作品：`user/profile/{user_id}`、同样的四类短链、24 或 29 位 `user_id`

主页不要传给详情或评论。笔记链接不要传给作品。29 位 id 只属于博主。24 位 id 两边都可能是，先确认是笔记还是博主。短链同样先确认。

**Q7. 一启动就退出，退出码 3？**

`GUAIKEI_API_TOKEN` 没进当前进程，或格式无效。PowerShell 用 `$env:GUAIKEI_API_TOKEN`，cmd 用 `set`，macOS / Linux 用 `export`。看 stdout 的 `message`，不要只看 stderr。

**Q8. `status` 为 `empty`，退出码 0？**

没有匹配内容，这是正常结果。四个命令都这样。搜索可以放宽 `--type`、`--time` 或换关键词。纯 emoji、纯符号会被洗成空关键词，那是 `INVALID_KEYWORD`，退出码 1，不是空结果。

**Q9. `--limit` 很大，却失败了？**

超出范围会直接失败，退出码 2，`INVALID_ARGS`。搜索和评论是 1–10000，作品是 0–10000。不会再退回 10 条或 20 条。

**Q10. 下游解析 stdout 失败？**

stdout 只有最后这一份信封，用 `status` 区分成功、空结果和错误。stderr 的彩色日志不是 JSON。等进程退出后再读完整 stdout。

**Q11. 博主命令没有返回笔记？**

不传 `--limit` 时默认是 0，只返回 `results.user`。要笔记列表请显式传入大于 0 的 `--limit`。

**Q12. 评论时间过滤和预期不一致？**

参数名是 `--expired_at`（`--expire` 相同）。正整数表示近 N 天，`YYYY-MM-DD HH:mm:ss` 表示该时间之后。不传时命令按北京时间近 6 年换算成一个时间点，并写进 `request.expired_at`。它不是分页。

## 支持信息

- [小红书洞察与竞品分析助手官网](https://www.guaikei.com)
- 问题反馈：[GitHub Issues](https://github.com/um-why/xiaohongshu-openclaw-skill/issues)
