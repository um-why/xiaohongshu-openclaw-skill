# 常见问题与环境配置

> **何时读**：排障、配 TOKEN、查落盘路径或计费口径时再读。日常执行不必每次打开。逐步排查问答还可对照 [troubleshooting.md](troubleshooting.md)。

## 环境

- Node.js 16.14.0+，Windows / Linux / macOS；必需环境变量 `GUAIKEI_API_TOKEN`（16–256 位字母、数字、下划线或连字符）。
- Windows cmd：`set GUAIKEI_API_TOKEN=你的TOKEN`
- Windows PowerShell：`$env:GUAIKEI_API_TOKEN="你的TOKEN"`
- Linux/macOS：`export GUAIKEI_API_TOKEN=你的TOKEN`

## 合规

- 仅处理小红书公开数据；调用会把关键词/链接发送至第三方 API（ www.guaikei.com ）。
- 不上传本地文件、不登录、无写操作。数据仅限个人/团队内部分析。
- 开通与帮助：[小红书洞察与竞品分析助手官网](https://www.guaikei.com)

## FAQ

- **没结果**：`status=empty` 退出码 0，属正常。可建议放宽 `--type` / `--time` 或换词，经用户同意后再试。
- **结果太多**：控制 `--limit`；超过约 1000 条时先告知用户数据量。
- **调用失败**：先看退出码——3 = token；2 = 参数；1 = 关键词/链接/网络/套餐/服务端。完整码表见 [errors.md](errors.md)。
- **`Cannot find module`**：先 `cd` 到本技能目录（含 `SKILL.md` 的那一层），再执行 `node src/xiaohongshu/...`。
- **博主命令没有笔记**：不传 `--limit` 默认是 0，只有 `results.user`。要作品列表请显式 `--limit N`。
- **计费与单次上限**以官网为准。技能硬上限 10000 条/次（按量）；**包月**搜索最多 40、作品最多 30、评论最多 20，超限为 `PLAN_LIMIT`，不是网络故障。
- **账号安全**：只读能力，不登录/不发布/不点赞/不评论，无封号风险。
- **落盘**：成功结果写在系统临时目录 `xiaohongshu-guaikei/logs/当天日期/`（Windows 多为 `%TEMP%`）。`XHS_GUAIKEI_DISABLE_LOG=1` 可关闭。不在技能目录里，系统清理临时文件后会消失。
- **国内要代理吗**：不用。

口语参数表：[options.md](options.md)。GitHub 默认展示见仓库根目录 [readme.md](../readme.md)。
