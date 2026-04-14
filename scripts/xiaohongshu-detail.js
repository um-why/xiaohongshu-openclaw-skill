#!/usr/bin/env node

const utils = require("../lib/utils");
const key = require("../lib/key");
const detail = require("../lib/detail-comment");
const fs = require("fs");
const path = require("path");

/**
 * 打印帮助信息
 */
function printHelp() {
  console.log(`
用法: node scripts/xiaohongshu-detail.js <笔记链接>

示例: node scripts/xiaohongshu-detail.js "https://www.xiaohongshu.com/explore/xxx?xsec_token=yyy"

注意: 
  - 笔记链接是小红书可公开访问的笔记链接
  - 即使用 "node scripts/xiaohongshu-search.js <关键词>" 获取到的出参 url 值所代表的笔记链接
  - 请确保环境变量 GUAIKEI_API_TOKEN 已配置
`);
}

process.on("SIGTERM", () => {
  utils.printWarn("OpenClaw 终止任务， 清理临时文件...");
  const outputPath = path.join(__dirname, "last-detail.json");
  if (fs.existsSync(outputPath)) {
    fs.unlinkSync(outputPath);
  }
  process.exit(0);
});

async function main() {
  const startTime = Date.now();
  const args = process.argv.slice(2);
  if (args.length === 0) {
    printHelp();
    return;
  }

  let url = "";
  args.forEach((arg, index) => {
    if (arg === "--url") {
      url = args[index + 1] || "";
    } else if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    } else if (arg.startsWith("--") === false && url === "") {
      url = arg;
    }
  });
  if (url === "") {
    utils.printError(`未提供笔记链接`);
    printHelp();
    return;
  }

  utils.printBanner();
  utils.printInfo(`笔记链接: ${url}`);
  let isRight = detail.notIdealFormat(url);
  if (!isRight) {
    utils.printError(
      `笔记链接格式无效, 支持: https://www.xiaohongshu.com/explore/xxx?xsec_token=yyy, http://xhslink.com/m/xxx`,
    );
    return;
  }

  const token = key.apiKey(process.env.GUAIKEI_API_TOKEN);
  let detailTask = null;
  try {
    const status = await detail.createWithRetry(token, url);
    if (status.errcode !== 0) {
      throw new Error(
        `详情任务创建失败时, 遇到未知错误, 请反馈给开发者 ${status} - ${Date.now()}`,
      );
    }
    utils.printSuccess(`详情任务创建成功, 正在搜索中...`);

    detailTask = await detail.detailWithRetry(token, url);
  } catch (error) {
    const errorOutput = {
      status: "error",
      url: url,
      message: error.message,
      error_code: error.code || "UNKNOWN",
      timestamp: new Date().toLocaleString(),
      results: [],
    };
    console.log(JSON.stringify(errorOutput, null, 2));
    return;
  }
  if (!detailTask) {
    utils.printError(`详情任务没有返回结果, 请稍后重试或联系开发者`);
    const emptyOutput = {
      status: "empty",
      url: url,
      message: "没有找到匹配的笔记内容",
      error_code: "NOT_FOUND",
      timestamp: new Date().toLocaleString(),
      results: [],
    };
    console.log(JSON.stringify(emptyOutput, null, 2));
    return;
  }

  // 输出搜索结果
  const finalOutput = {
    status: "success",
    url: url,
    message: "详情任务完成",
    timestamp: new Date().toLocaleString(),
    openclaw_metadata: {
      skill_version: "1.0.1",
      runtime_version: process.versions.node,
      execution_time: Date.now() - startTime,
    },
    results: detailTask,
  };
  console.log(JSON.stringify(finalOutput, null, 2));
  utils.printSuccess(`详情任务完成, 已返回结果`);

  // 保存详情结果到文件
  const outputPath = path.join(__dirname, "last-detail.json");
  fs.writeFileSync(outputPath, JSON.stringify(finalOutput, null, 2));
  utils.printSuccess(`  → 已保存到 ${outputPath}`);
}

main().catch((error) => {
  utils.printError(error);
  process.exit(1);
});
