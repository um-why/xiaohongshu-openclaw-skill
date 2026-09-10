# 常见问题排查（troubleshooting）

> 本文件是 SKILL.md §6 错误速查的详细版。SKILL.md 保留速查表，Agent 排查失败时按需加载本文件，节省常驻 token。

**Q1. 报错 `error_code: 401` 或 `403` 怎么办？**

> 含义：`GUAIKEI_API_TOKEN` 未配置或无效。
> 自查：①确认运行环境里确实 `export GUAIKEI_API_TOKEN=...` 了（不是只在 shell 配置里写了）；②token 长度 16-256 位，由字母、数字、下划线、短横线组成（以 guaikei.com 开通页显示为准），核对是否有多余空格或换行；③是否已过期，去 <https://www.guaikei.com> 重新开通。

**Q2. 报错 `error_code: 429` 怎么办？**

> 含义：触发了接口频率限制。
> 自查：降低调用频率、减小 `--limit`、或稍后重试，不要短时间高频轮询。

**Q3. 报错 `error_code: 500 / 502 / 503` 等服务端错误怎么办？**

> 含义：第三方 API 临时故障。
> 自查：通常是 transient，等 1-2 分钟重试；若持续出现，联系支持（见下），并附上 `skill_metadata` 里的 `execution_time` 与请求参数。

**Q4. 报错 `error_code: ERRCODE_xxx` 怎么办？**

> 含义：业务层错误（HTTP 200 但 `errcode !== 0`），常见如「笔记已删除 / 不存在 / 无权限」。
> 自查：换一条确认仍存在的笔记链接；该错误不会随重试变好，不要反复重试同一链接。

**Q5. 报错 `error_code: ETIMEDOUT` 或 `UNKNOWN` 怎么办？**

> 含义：网络超时或无法解析响应。
> 自查：检查本机网络 / 代理；确认能访问 `guaikei.com`；重试一次；仍失败再联系支持。

**Q6. 提示「小红书链接格式无效」怎么办？**

> 自查：确认链接①以 `https://` 开头；②无前后空格；③是以下之一：`www.xiaohongshu.com/explore/...`、`www.xiaohongshu.com/user/profile/...`、`xhslink.com/m/...`、`xhslink.cn/m/...`。

**Q7. 命令一启动就退出、没输出数据？**

> 自查：多半是 `GUAIKEI_API_TOKEN` 未通过校验（见 Q1）。在运行命令前先 `echo $GUAIKEI_API_TOKEN` 确认变量已注入当前进程。

**Q8. 搜索返回空、但退出码不是 0？**

> 含义：`search-cli.js` 把「无结果」视为失败（退出码 1）。
> 自查：换更宽泛的关键词、放宽 `--type` / `--time`、或确认关键词不是被清洗成空串的符号（纯 emoji / 纯符号会被清洗掉）。`detail` / `comment` 的空数组则视为成功，属正常差异。

**Q9. 设了 `--limit 10000` 却只拿到 10 条？**

> 含义：`limit` 写成了超过 `10000` 的值，被回退为默认 `10`。
> 自查：确认 `--limit` 是 1-10000 之间的整数。

**Q10. 下游程序解析 stdout 失败 / 报 `Unexpected end of JSON input`？**

> 自查：失败输出通过 `process.stdout.write(..., () => process.exit(1))` 异步写出后退出；请确保消费方**等进程退出后再读完整 stdout**，且只取最后一份 JSON（`status` 字段唯一标识这份结果）。不要把 `error` / `empty` / `success` 多份输出拼在一起解析。

## 支持信息

- 官网 / TOKEN 开通：[小红书实时数据获取官网](https://www.guaikei.com)
- 问题反馈：<https://github.com/um-why/xiaohongshu-openclaw-skill/issues>
