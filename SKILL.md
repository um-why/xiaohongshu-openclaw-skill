---
name: xiaohongshu-tool
description: 小红书运营全链路数据工具｜支持关键词搜索/笔记详情查询/爆款挖掘/竞品分析/KOL筛选/趋势洞察，基于Node.js开发，可获取小红书图文/视频笔记的点赞/评论/收藏数据，用数据驱动小红书流量增长，告别盲目创作
license: MIT
metadata:
  openclaw:
    type: command
    runtime: "nodejs@16.14.0+"
    entrypoint:
      search: "src/xiaohongshu/search-cli.js"
      detail: "src/xiaohongshu/detail-cli.js"
    version: "1.0.2"
    timeout: 300
    requires:
      bins: ["node"]
      env: ["GUAIKEI_API_TOKEN"]
    env_desc:
      GUAIKEI_API_TOKEN: "小红书数据API访问令牌（必填）；默认值仅用于体验，私有TOKEN需联系开发者申请，否则可能触发频率限制/功能降级"
    category: "数据分析/内容创作"
    tags: ["小红书", "数据工具", "运营", "Node.js", "API"]
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
        "小红书关键词搜索",
        "小红书笔记详情查询",
        "小红书数据爬虫",
        "小红书运营工具",
        "小红书爆款挖掘",
        "小红书评论分析",
        "小红书图文/视频筛选",
        "小红书互动数据统计",
        "小红书API工具",
        "Node.js小红书工具",
        "品牌小红书营销",
        "小红书内容创作选题",
        "小红书竞品监控",
        "小红书热度分析",
        "小红书短链接解析",
      ]
    examples:
      - "搜索'露营装备'的热门小红书笔记: node src/xiaohongshu/search-cli.js 露营装备 --type 1 --sort 2 --limit 10"
      - "分析这篇笔记的评论区情绪: node src/xiaohongshu/detail-cli.js 'https://www.xiaohongshu.com/explore/xxx?xsec_token=yyy'"
      - "监控'早春穿搭'关键词(最新排序+图文类型): node src/xiaohongshu/search-cli.js --keyword '早春穿搭' --type 2 --sort 1"
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

## 1.3 核心使用场景

| 场景         | 具体价值                                                        |
| ------------ | --------------------------------------------------------------- |
| 内容创作选题 | 输入关键词，筛选「最多点赞」笔记，快速找到爆款选题方向          |
| 品牌竞品监控 | 输入竞品账号/笔记链接，分析其互动数据、内容风格，制定差异化策略 |
| KOL投放筛选  | 解析KOL笔记的真实互动率（点赞/评论/收藏），避免数据造假的博主   |
| 市场趋势分析 | 定时监控关键词「最新排序」，捕捉小红书热点风向，提前布局内容    |
| 数据报表生成 | 输出Markdown格式结果，直接嵌入运营周报，减少手动整理成本        |

## 2. 快速使用指南

### 2.1 前置条件

- 安装Node.js 16.14.0+环境
- 配置环境变量 `GUAIKEI_API_TOKEN`（默认TOKEN仅用于体验，私有TOKEN需申请）

### 2.2 基础语法

#### 2.2.1 小红书关键词搜索

```bash
# 基础语法
node src/xiaohongshu/search-cli.js <关键词> [选项]

# 完整选项说明
--keyword -k <关键词>: 搜索关键词（必填，2-50个汉字，避免特殊符号）
--type -t <0/1/2>: 内容类型，0-全部（默认），1-视频，2-图文
--sort -s <0-4>: 排序规则，0-综合（默认），1-最新，2-最多点赞，3-最多评论，4-最多收藏
--limit -l <1-60>: 搜索数量，1-60（默认10）
--output -o <json/markdown>: 输出格式（默认json）
--help -h: 显示帮助信息

# 示例
node src/xiaohongshu/search-cli.js "露营装备" --sort 2 --limit 20
node src/xiaohongshu/search-cli.js --keyword "早春穿搭" --type 2 --output markdown
```

#### 2.2.2 小红书笔记详情查询

```bash
# 基础语法
node src/xiaohongshu/detail-cli.js <笔记链接> [选项]

# 选项说明
--url -u <笔记链接>: 笔记链接（支持https://www.xiaohongshu.com/explore/xxx 或 http://xhslink.com/m/xxx）
--help -h: 显示帮助信息

# 链接格式要求
1. 完整链接：必须包含 xsec_token 参数（如 https://www.xiaohongshu.com/explore/xxx?xsec_token=yyy）
2. 短链接：https://xhslink.com/m/xxx（自动兼容，无需手动解析）
❌ 错误：链接含空格、无xsec_token的完整链接会直接报错

# 示例
node src/xiaohongshu/detail-cli.js "https://www.xiaohongshu.com/explore/xxx?xsec_token=yyy"
node src/xiaohongshu/detail-cli.js --url "http://xhslink.com/m/xxx"
```

### 2.3 进阶使用示例

```
# 爆款挖掘（最多点赞+图文）
node src/xiaohongshu/search-cli.js "春日穿搭" --type 2 --sort 2

# 趋势监控（定时执行最新排序，对比不同时段数据）
node src/xiaohongshu/search-cli.js "露营装备" --sort 1
```

## 2.4 快速上手（复制即用）

### 步骤1：环境准备

```bash
# 安装Node.js 16.14.0+
node -v # 验证版本

# 配置环境变量（Linux/Mac）
export GUAIKEI_API_TOKEN="你的令牌"
# 配置环境变量（Windows）
set GUAIKEI_API_TOKEN="你的令牌"
```

### 步骤2：一键运行示例

```bash
# 爆款笔记挖掘（图文+最多点赞）
node src/xiaohongshu/search-cli.js "露营装备" --type 2 --sort 2 --limit 30 --output markdown

# 竞品笔记详情分析
node src/xiaohongshu/detail-cli.js "https://xhslink.com/m/xxx"
```

## 3. 数据合规说明

✅ 仅抓取小红书**公开可见**内容，无隐私数据泄露风险
✅ 数据仅用于商业分析参考，需遵守小红书平台使用条款
✅ 所有输出数据均做脱敏处理，不涉及用户个人信息
✅ 本工具依赖第三方 API 进行数据获取。数据仅供参考，第三方服务可能存在不稳定或接口变更的情况。请勿用于高频爬虫或侵犯用户隐私的场景
⚠️ 高频调用（如1分钟>10次）可能触发API频率限制，私有TOKEN可提升限额

## 4. 技术说明（OpenClaw 适配）

- 运行环境：Node.js 16.14.0+，需提前配置 `GUAIKEI_API_TOKEN` 环境变量
- 数据输出格式：支持JSON/Markdown（按需返回）
- 触发方式：支持自然语言指令直接触发，无需固定语法，容错率高
- 异常处理：所有请求均有重试机制

## 4.1 运行环境兼容说明

- 系统兼容：Windows/Linux/MacOS（无需额外依赖，仅需Node.js）
- Node.js版本：推荐16.14.0+
- 网络要求：需能正常访问网络，国内服务器无需代理
- 权限要求：无需管理员权限，普通用户即可运行

### 4.1 重试机制

- 创建任务（search/detail）：最多重试3次，间隔2秒，失败提示【创建任务重试】；
- 查询任务结果：最多重试60次（约2分钟），间隔2秒，失败提示【查询任务重试】；
- 所有重试均为自动触发，无需手动干预，超时未返回则抛出错误。

### 4.2 日志说明

- 运行时会输出彩色日志：INFO(蓝色)、SUCCESS(绿色)、WARN(黄色)、ERROR(红色)；
- 启动时会打印工具Banner，方便确认是否正确执行；
- 所有任务结果会自动保存到 `logs/` 目录（按时间+关键词/链接命名）。

## 5. 版本更新日志

### v1.0.2

- 重大重构：代码库结构全面优化，原 lib/ 和 scripts/ 目录统一整合至 src/ 目录
- 新增模块：新增工具类与校验模块（日志、重试、网络请求、密钥、通用工具等），大幅提升代码模块化与可维护性
- 入口优化：CLI 执行入口更新为 src/xiaohongshu/search-cli.js 和 src/xiaohongshu/detail-cli.js，使用更清晰直观
- 文档升级：完善 SKILL.md 文档，丰富功能说明、补充完整使用示例、扩展环境配置与输出格式说明
- 命令行增强：优化命令行参数，新增参数简写形式，明确必填字段，强化笔记链接合法性校验规则
- 环境升级：Node.js 最低支持版本提升至 16.14.0 及以上

### v1.0.1

- 新增小红书笔记详情与评论情绪分析功能，支持通过笔记链接获取详细数据。
- 增强关键词搜索脚本，支持更丰富的查询选项与数据输出格式。
- 技能名称由“xiaohongshu-search”升级为“xiaohongshu-tool”，能力范围拓展。
- 入口脚本区分搜索与详情，CLI用法更加清晰。
- 技能文档全面更新，补充更多用例与参数说明。

### v1.0.0

- 首发上线：实现小红书关键词搜索与数据洞察自动化工具。
- 支持热门笔记挖掘、竞品分析、KOL筛选和趋势监控等核心商业分析功能。
- 增加多选项参数（类型、排序、输出格式、搜索数量）灵活定制搜索。
- 支持JSON与Markdown两种数据输出格式。
- 提供开放式命令行用法与使用示例，适配 Node.js 16.14.0+ 环境。
- 明确数据合规说明及环境变量配置要求。

```

```
