# 自然语言 → 命令 / 参数映射

> **何时读**：口语参数推导拿不准、或要把「爆款/近一周」落到具体 flag 时再读。日常选命令以 `SKILL.md` 识别卡与意图路由为准。

| 用户口语 | 命令 | 参数推导 |
| --- | --- | --- |
| 爆款、高赞、什么火 | `search-cli.js --sort 2` | 最多点赞 → sort=2（不是最新） |
| 最新、刚发的、今天 | `search-cli.js --sort 1 --time 1` | 最新 + 一天内 |
| 这周、近期 | `search-cli.js --sort 1 --time 2` | `--time 2` = 一周内，不是 2 天 |
| 收藏多、值得存 | `search-cli.js --sort 4` | |
| 评论多、讨论度高 | `search-cli.js --sort 3` | |
| 图文、文案 | `--type 2` | `-t` 是内容类型 |
| 视频 | `--type 1` | |
| 多少粉丝、获赞、收藏 | `post-cli.js --limit 0` | 不传 limit 也是 0 |
| 最近发了什么、近 N 条作品 | `post-cli.js --limit N` | **必须写条数**；没说就问 |
| 评论区、舆情 | `comment-cli.js` | 默认 10；归纳观点可加大，包月勿超 20 |
| 近 30 天的评论 | `--expired_at 30` | 时间过滤，不是分页 |
| 只要正文、为什么火 | `detail-cli.js` | 不含评论 |

## 链接消歧

| 形态 | 只能给 |
| --- | --- |
| `…/user/profile/{user_id}` | `post-cli.js` |
| `…/explore/{id}`、`…/discovery/item/{id}` | `detail-cli.js` 或 `comment-cli.js` |
| 24 位 hex | 可能是笔记或博主 → **先问**；不要两个命令都试 |
| 29 位 hex | 只是博主 → `post-cli.js` |
| `xhslink.com` / `xhslink.cn` 的 `/m/*`、`/o/*` | 三种都接受，但短链看不出类型 → **先问** |

不带 `www` 的 `xiaohongshu.com` 会补成 `www`；`http://` 改 `https://`。打开搜索/作品里的一条笔记：用 `https://www.xiaohongshu.com/explore/{id}`，有 `xsec_token` 再接 query。

完整枚举取值见 [options.md](options.md)。缺参话术见 [ask.md](ask.md)。
