---
name: xiaohongshu-tool
description: 小红书运营全链路数据工具｜关键词监控+爆款挖掘+竞品分析+KOL筛选+趋势洞察，用数据驱动小红书流量增长，告别盲目创作
license: MIT
metadata:
  openclaw:
    type: command
    runtime: "nodejs@16+"
    entrypoint:
      search: "scripts/xiaohongshu-search.js"
      detail: "scripts/xiaohongshu-detail.js"
    version: "1.0.1"
    requires:
      bins: ["node"]
      env: ["GUAIKEI_API_TOKEN"]
    env_desc:
      GUAIKEI_API_TOKEN: "小红书数据API访问令牌"
    keywords:
      [
        "小红书",
        "爆款笔记",
        "市场调研",
        "数据挖掘",
        "趋势监控",
        "竞品分析",
        "KOL营销",
        "流量增长",
        "用户画像",
      ]
    examples:
      - "搜索'露营装备'的热门小红书笔记: node scripts/xiaohongshu-search.js 露营装备 --type 1 --sort 2 --limit 10"
      - "分析这篇笔记的评论区情绪: node scripts/xiaohongshu-detail.js 'https://www.xiaohongshu.com/explore/xxx?xsec_token=yyy'"
      - "监控'早春穿搭'关键词(最新排序+图文类型): node scripts/xiaohongshu-search.js --keyword '早春穿搭' --type 2 --sort 1"
---

# 📊 小红书商业洞察与竞品分析助手

> **一句话价值主张**：告别盲目创作，用数据驱动小红书流量增长。从海量公开数据中提炼可落地的爆款逻辑、竞品策略、KOL价值，覆盖内容创作、品牌营销、市场分析全场景，让小红书运营决策有迹可循。

## 1. 技能概述

这是一款专注于**小红书商业数据挖掘**的工具。它能够穿透小红书的公开数据层，为你提供深度的**竞品监控**、**趋势预测**和**KOL 筛选**服务。无论你是内容创作者、品牌营销人员还是市场分析师，都能通过此工具获取决策支持。

### 1.1 核心能力矩阵

| 能力模块        | 核心功能                     | 解决痛点                             |
| :-------------- | :--------------------------- | :----------------------------------- |
| **🔍 爆款挖掘** | 热门笔记发现、高互动内容检索 | 找不到选题灵感，不知道什么内容火     |
| **🕵️ 竞品分析** | 对标账号监控、笔记表现追踪   | 竞品为什么涨粉快？他们的策略是什么？ |
| **👥 KOL 筛选** | 博主粉丝画像、互动率分析     | 找不到合适的投放博主，担心数据造假   |
| **📈 趋势监控** | 关键词热度追踪、话题趋势分析 | 错过热点，无法预判市场风向           |

### 1.2 适用人群

✅ 小红书内容创作者/运营 | ✅ 品牌营销/市场人员 | ✅ 数据分析师 | ✅ MCN机构/博主经纪人

## 2. 快速使用指南

### 2.1 前置条件

- 安装Node.js 16+环境
- 配置环境变量 `GUAIKEI_API_TOKEN`（默认TOKEN仅用于体验，私有TOKEN需申请）

### 2.2 基础语法

#### 2.2.1 小红书关键词搜索

```bash
# 基础语法
node scripts/xiaohongshu-search.js <关键词> [选项]

# 完整选项说明
--keyword <关键词>: 搜索关键词（必填，2-50个汉字，避免特殊符号）
--type <0/1/2>: 内容类型，0-全部（默认），1-视频，2-图文
--sort <0-4>: 排序规则，0-综合（默认），1-最新，2-最多点赞，3-最多评论，4-最多收藏
--limit <1-60>: 返回数量，1-60（默认10）
--output <json/markdown>: 输出格式（默认json）
--help/-h: 显示帮助信息

# 示例
node scripts/xiaohongshu-search.js "露营装备" --sort 2 --limit 20
node scripts/xiaohongshu-search.js --keyword "早春穿搭" --type 2 --output markdown
```

#### 2.2.2 小红书笔记详情查询

```bash
# 基础语法
node scripts/xiaohongshu-detail.js <笔记链接> [选项]

# 选项说明
--url <笔记链接>: 笔记链接（支持https://www.xiaohongshu.com/explore/xxx 或 http://xhslink.com/m/xxx）
--help/-h: 显示帮助信息

# 示例
node scripts/xiaohongshu-detail.js "https://www.xiaohongshu.com/explore/xxx?xsec_token=yyy"
node scripts/xiaohongshu-detail.js --url "http://xhslink.com/m/xxx"
```

## 3. 数据合规说明

✅ 仅抓取小红书**公开可见**内容，无隐私数据泄露风险
✅ 数据仅用于商业分析参考，需遵守小红书平台使用条款
✅ 所有输出数据均做脱敏处理，不涉及用户个人信息
✅ 本工具依赖第三方 API 进行数据获取。数据仅供参考，第三方服务可能存在不稳定或接口变更的情况。请勿用于高频爬虫或侵犯用户隐私的场景。

## 4. 技术说明（OpenClaw 适配）

- 运行环境：Node.js 16+，需提前配置 `GUAIKEI_API_TOKEN` 环境变量
- 数据输出格式：支持JSON/Markdown（按需返回）
- 触发方式：支持自然语言指令直接触发，无需固定语法，容错率高
- 异常处理：所有请求均有重试机制
