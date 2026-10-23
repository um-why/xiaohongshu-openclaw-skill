# 小红书洞察与竞品分析助手 · 参数与调用说明

命令在技能目录下执行。stdout 是一份 JSON 信封，字段见 `assets/*.schema.json`。这里只说明输入和该选哪个命令。

没有关键词或链接时先问，不要空跑。短链 `xhslink.com` / `xhslink.cn` 的 `/m/*`、`/o/*` 不能从外形判断是笔记还是主页，先问用户。前缀后面没有 id，或 id 含有字母、数字、下划线、连字符以外的字符时，命令会直接判为无效链接。不带 `www` 的 `xiaohongshu.com` 会补成 `www`。协议和主机名不区分大小写。含空格的关键词要放在一对引号里，拆成多个位置参数会直接失败。

## 1. 先选命令

| 任务 | 脚本 | 最少输入 |
| --- | --- | --- |
| 按关键词搜公开笔记 | `src/xiaohongshu/search-cli.js` | `keyword` |
| 看一篇笔记的正文和互动 | `src/xiaohongshu/detail-cli.js` | 笔记 `url` 或 24 位笔记 id |
| 看一个博主的信息或笔记 | `src/xiaohongshu/post-cli.js` | 主页 `url`，或 24 / 29 位 `user_id` |
| 只拉一篇笔记的评论 | `src/xiaohongshu/comment-cli.js` | 笔记 `url` 或 24 位笔记 id |

详情不返回评论。正文和评论都要时，先跑详情，再跑评论。

## 2. 关键词搜索

```bash
node src/xiaohongshu/search-cli.js --keyword "夏季穿搭" [选项]
node src/xiaohongshu/search-cli.js 夏季穿搭 [选项]
```

| 参数 | 说明 | 取值 / 默认 |
| --- | --- | --- |
| `--keyword` `-k` | 搜索关键词，必填 | 1–50 个字符。不能是链接，不含 `< > " '`。控制字符和 emoji 会先去掉 |
| `--type` `-t` | 内容类型 | `0` 全部（默认），`1` 视频，`2` 图文 |
| `--sort` `-s` | 排序 | `0` 综合（默认），`1` 最新，`2` 最多点赞，`3` 最多评论，`4` 最多收藏 |
| `--time` `-i` | 发布时间 | `0` 全部（默认），`1` 一天内，`2` 一周内，`3` 半年内 |
| `--limit` `-l` | 返回数量 | `1–10000`，默认 `20` |
| `--help` `-h` | 帮助 | 无 |

非法枚举或越界数量会失败，不会改成默认值。`--time 2` 是一周内，不是 2 天。`--sort 2` 是最多点赞，不是最新。

```bash
node src/xiaohongshu/search-cli.js --keyword "露营装备" --sort 2 --limit 20
node src/xiaohongshu/search-cli.js --keyword "早春穿搭" --type 2 --time 2 --sort 1 --limit 20
```

`results` 是笔记数组。互动数是字符串。用 `id` 拼 `https://www.xiaohongshu.com/explore/{id}`，有 `xsec_token` 时加上 `?xsec_token=`。空字符串和数字 0 可能不返回。

## 3. 笔记详情

```bash
node src/xiaohongshu/detail-cli.js --url "https://www.xiaohongshu.com/explore/xxx?xsec_token=yyy"
node src/xiaohongshu/detail-cli.js "https://www.xiaohongshu.com/discovery/item/xxx"
```

| 参数 | 说明 | 取值 |
| --- | --- | --- |
| `--url` `-u` | 笔记链接或笔记 id，必填 | 见下方，接口长度为 string(255) |
| `--help` `-h` | 帮助 | 无 |

支持：

- `https://www.xiaohongshu.com/explore/{id}`
- `https://www.xiaohongshu.com/discovery/item/{id}`
- `https://xhslink.com/o/*`、`https://xhslink.cn/o/*`
- `https://xhslink.com/m/*`、`https://xhslink.cn/m/*`
- 24 位十六进制笔记 id

`http://` 会改成 `https://`，不带 `www` 的域名会补上 `www`。博主主页不要传给这个脚本。

`results` 是一个对象：`title`、`content`、`publish_time`、`ip_location`、`liked_count`、`collected_count`、`comment_count`、`shared_count`、`nice_count`、`image_list`、`note_statement`、`video_url`（字符串数组）、`tags`（标签名字符串数组）、`topics`（话题名字符串数组），以及 `user.user_id`、`user.nickname`、`user.red_id`。没有评论。

## 4. 博主笔记

```bash
node src/xiaohongshu/post-cli.js --url "https://www.xiaohongshu.com/user/profile/xxx?xsec_token=yyy" --limit 20
node src/xiaohongshu/post-cli.js 66a8aaaaaaaaaaaaaaaaaaaa
```

| 参数 | 说明 | 取值 / 默认 |
| --- | --- | --- |
| `--url` `-u` | 博主主页或 `user_id`，必填 | 见下方，接口长度为 string(255) |
| `--limit` `-l` | 笔记数量 | `0–10000`，默认 `0` |
| `--help` `-h` | 帮助 | 无 |

支持 `https://www.xiaohongshu.com/user/profile/{user_id}`、第 3 节里的四类短链，以及 24 或 29 位十六进制 `user_id`。作品 id 只有 24 位，29 位 id 不能用于详情或评论。

`limit` 为 0：只要博主信息和互动数据。大于 0：取笔记列表。不传 `--limit` 就是 0，不会返回作品。

`results` 是对象：

- `user`：`nickname`、`desc`、`ipLocation`（驼峰）、`user_id`、`red_id`、`share_link`、`follows`、`fans`、`interaction`（获赞与收藏）、`liked`（获赞）、`collected`（收藏）、`note_num_stat`（`liked` / `posted` / `collected`，文档未说明单项含义）
- `note[]`：`id`、`xsec_token`、`type`、`title`、`desc`、`create_time`、`liked_count`、`likes`、`comments`、`nice`、`collected`、`share`、`view`、`cover`、`images`、`video`、`video_url`、`video_duration`

`likes` 和 `nice` 接口有返回，文档没有进一步说明。点赞、评论、收藏做比较时，用 `liked_count`、`comments`、`collected`，并先把字符串转成数字。粉丝和获赞看 `user.fans`、`user.liked`、`user.interaction`。

## 5. 笔记评论

```bash
node src/xiaohongshu/comment-cli.js --url "https://www.xiaohongshu.com/explore/xxx?xsec_token=yyy" --limit 100
node src/xiaohongshu/comment-cli.js --url "https://www.xiaohongshu.com/explore/xxx" --expired_at 30
node src/xiaohongshu/comment-cli.js --url "https://www.xiaohongshu.com/explore/xxx" --expired_at "2026-10-01 12:00:00"
```

| 参数 | 说明 | 取值 / 默认 |
| --- | --- | --- |
| `--url` `-u` | 笔记链接或笔记 id，必填 | 见下方。含 `explore`、`discovery/item`、短链 |
| `--expired_at` `-e` | 评论时间过滤 | 正整数天数，或 `YYYY-MM-DD HH:mm:ss`。不传则按北京时间近 6 年换算成一个时间点，创建和查询共用。`--expire` 与它相同 |
| `--limit` `-l` | 评论数量 | `1–10000`，默认 `10` |
| `--help` `-h` | 帮助 | 无 |

支持 `https://www.xiaohongshu.com/explore/{id}`、`https://www.xiaohongshu.com/discovery/item/{id}`、四类短链，以及 24 位笔记 id。

`expired_at` 过滤的是时间，不是页码。`limit` 为 10000 且 `expired_at` 为 1 时，也只返回近 1 天的评论。用户传入的值会原样出现在 `request.expired_at`。未传入时，命令换算的时间点也会写进这个字段。

`results` 是评论数组：`id`、`content`、`create_time`、`ip_location`、`like_count`、`user`（`user_id`、`nickname`、`red_id`）、`sub_comments`。回复只有一层，字段与评论相同。

## 6. 执行前

1. Node.js 16.14.0+
2. 环境变量 `GUAIKEI_API_TOKEN`：16–256 位字母、数字、下划线或连字符
3. 输入是关键词、笔记链接或博主链接中的一种
4. 平台是小红书

TOKEN 未配置时命令退出码为 3，不要先跑一遍试探。

## 7. 常见组合

选题：先按关键词搜索，再用笔记 `id` 拉详情，最后看标题、正文和 `tags` / `topics`。

评论：详情拿正文，评论命令拿评论，再做归类。详情本身没有评论。

竞品或 KOL：要作品列表就显式传 `--limit`。只要粉丝和获赞就用 `--limit 0`。
