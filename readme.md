# 📕 小红书洞察与竞品分析助手

> 把「刷一小时小红书、再手工记点赞」换成「说一句话，拿回结构化数据」。关键词、笔记链接、博主主页都能查。AI 接着就能做选题、盯竞品、筛 KOL、读评论区。

**只读公开数据 · 不登录你的小红书账号 · 单次最多 1 万条 · 装进 Agent 就能用人话说**

[开通小红书数据 TOKEN](https://www.guaikei.com) · 也可以加微信 `13395823479`（备注：小红书技能）

---

## 你现在大概率在做这些事

| 你要的结果 | 手工怎么做 | 用这个技能 |
| --- | --- | --- |
| 下周选题 | 翻几十条笔记，自己记点赞和收藏 | 一条搜索命令拿回标题、正文摘要和互动数 |
| 竞品这周发了什么 | 每天打开对方主页往下刷 | 博主作品列表，带发布时间和互动数 |
| 这个 KOL 值不值得合作 | 看粉丝数拍脑袋 | 粉丝、获赞、收藏一起回来，转成数字再算比值 |
| 评论区在说什么 | 一条条往下翻 | 一次拉评论，交给 AI 归纳观点 |
| 今天刚起来的话题 | 反复刷发现页 | 「最新 + 一天内」直接筛出来 |

数据回来之后，让 AI 继续做：标题公式、爆款归因、评论聚类、发文节奏、一份能发出去的报告。

---

## 四件事，各用一条命令

| 你要做的事 | 你拿到什么 |
| --- | --- |
| 🔍 关键词搜索 | 笔记列表。点赞、收藏、评论、分享都是字符串 |
| 📰 笔记详情 | 标题、正文、图片、互动、作者。不含评论 |
| 💬 评论 | 评论和评论者。可以按近 N 天，或某个时间之后 |
| 👥 博主 | 不传数量时，只要粉丝、获赞、收藏。要作品列表时写上条数 |

不登录、不发布、不点赞、不评论、不关注。私密笔记、草稿、创作者后台和投放后台都不在范围内。

---

## 三步开始

**1. 开通 TOKEN**

到[小红书竞品分析助手官网](https://www.guaikei.com)开通，或微信 `13395823479`（备注：小红书技能）。TOKEN 是 16–256 位的字符串。

**2. 配到环境变量**

```bash
# Windows (PowerShell)
$env:GUAIKEI_API_TOKEN = "你的TOKEN"

# macOS / Linux
export GUAIKEI_API_TOKEN="你的TOKEN"
```

**3. 跑第一条，或直接对 AI 说人话**

```bash
node src/xiaohongshu/search-cli.js --keyword "露营装备" --type 2 --sort 2 --time 2 --limit 20
```

装进 WorkBuddy、Openclaw、QClaw、ima、Claude Code 或 Cursor 之后，可以这样说：

- 「帮我找最近一周小红书露营装备的高赞图文，先看 20 条」
- 「这篇笔记评论区近 30 天在吐槽什么」
- 「这个博主多少粉丝，最近发了哪 30 条」

需要 Node.js 16.14.0 及以上，没有别的依赖。Windows、macOS、Linux 都可以。国内直连，不用代理。

---

## 回来的数据长这样

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
    "skill_version": "1.2.0",
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

互动数是字符串，空字符串和数字 0 有时不会出现。比较之前先转成数字。搜索不写条数时是 20 条；看博主不写条数时，只有博主信息，没有作品列表。

---

## 谁会用它

小红书创作者和运营、品牌市场、MCN 和博主经纪人、需要把公开内容喂给 Agent 的人。

它给的是公开数据，不替你做投放决策。判断还是你来。

---

## 购买前你可能想问

**要登录我的小红书账号吗？**
不用。这个技能不碰你的账号，也不做发布、点赞、评论、关注。

**数据从哪来？**
经[小红书公开数据接口](https://www.guaikei.com)返回，只覆盖小红书公开可见的内容。除了关键词和链接这类查询参数，不上传你电脑上的其他数据。结果请在个人或团队内部分析时使用。

**一定要 TOKEN 吗？**
要。接口按 TOKEN 调用。开通入口在[小红书洞察与竞品分析助手官网](https://www.guaikei.com)，也可以微信 `13395823479`。

**查一条要等多久？**
小批量通常一轮查询就能回来。条数大、或者任务还在处理时，命令会继续等，屏幕上的「处理中」不是失败。等命令结束再看结果。

**AI 会不会查错平台？**
技能说明里写明了：只处理小红书。抖音、快手、B 站、微博、公众号不会走这里。

**我在国内，要代理吗？**
不用。

---

## 边界

- 公开笔记、评论、博主信息。私密、草稿、仅粉丝可见、创作者后台、商业化后台都不支持
- 不做写操作
- 单次最多 1 万条。用户没说要多少时，搜索默认 20，评论默认 10，博主默认只看资料

---

## 再跑几条

```bash
# 一天内最新
node src/xiaohongshu/search-cli.js --keyword "多巴胺穿搭" --sort 1 --time 1 --limit 50

# 近 30 天评论
node src/xiaohongshu/comment-cli.js --url "https://www.xiaohongshu.com/explore/xxx" --expired_at 30 --limit 200

# 博主近 30 条作品
node src/xiaohongshu/post-cli.js --url "https://www.xiaohongshu.com/user/profile/xxx" --limit 30

# 只看粉丝、获赞、收藏
node src/xiaohongshu/post-cli.js --url "https://www.xiaohongshu.com/user/profile/xxx" --limit 0
```

参数表：[references/options.md](references/options.md) · 排查：[references/troubleshooting.md](references/troubleshooting.md) · 更新：[references/changelog.md](references/changelog.md)

成功结果会记在系统临时目录的 `xiaohongshu-guaikei/logs/当天日期/`，不写进技能目录。

---

## 现在就可以开通

去[小红书洞察分析助手官网开通 TOKEN](https://www.guaikei.com)

微信 `13395823479`（备注：小红书技能）· 问题反馈 [GitHub Issues](https://github.com/um-why/xiaohongshu-openclaw-skill/issues)
