# 输出契约

> **何时读**：需要核对信封字段、`results` 形态，或写后处理脚本时再读。日常执行只需记住：stdout 是统一信封；向用户只摘关键字段；`empty` 不是失败。

## 统一信封

stdout 只有一份统一信封（成功 / 空结果 / 错误结构相同）：

```json
{
  "status": "success | empty | error",
  "error_code": "OK | NO_MATCH | INVALID_KEYWORD | INVALID_URL | INVALID_ARGS | AUTH_REQUIRED | AUTH_ERROR | PLAN_LIMIT | INSUFFICIENT_BALANCE | RATE_LIMITED | DAILY_LIMIT | TIMEOUT | NETWORK_ERROR | HTTP_5xx | ...",
  "message": "给人读的说明",
  "timestamp": "2026/10/22 15:16:11",
  "request": { "command": "search", "keyword": "露营装备", "limit": 20 },
  "metadata": {
    "skill_version": "1.2.2",
    "runtime_version": "22.x",
    "execution_time": 34210
  },
  "results": []
}
```

- `status=error` 或 `empty` 时 `results` 为 `null`。
- 信封字段见 `assets/output_envelope.schema.json`。
- 条目字段见 `assets/*_cli_resp.schema.json`。

## `results` 形态（勿假设永远是数组）

| 命令 | 成功时 `results` |
| --- | --- |
| 搜索 / 评论 | **数组** |
| 详情 | **一条笔记对象**（不是数组，不含评论） |
| 作品 | **对象**：`{ note: 笔记数组, user: 博主信息 }`；`user.ipLocation` 为驼峰 |

## 向用户汇报

- **只摘关键字段**（标题、作者、互动数、时间、如何打开），不要把整份 JSON 贴回对话——图片/视频地址很多，会撑爆上下文。
- 互动数（点赞、收藏、评论、分享、粉丝等）是**字符串**。比较、排序、算比值前先转成数字。空字符串和数字 0 可能不出现。
- 搜索字段常用 `desc`；详情常用 `content`——不要假设跨命令字段名相同。
- 打开笔记：`https://www.xiaohongshu.com/explore/{id}`，有 `xsec_token` 再接 query。博主主页优先 `user.share_link`。

错误应对全表见 [errors.md](errors.md)。
