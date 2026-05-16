#!/usr/bin/env node

const constants = require("../config/constants");
const detail = require("../api/detail");
const log = require("../utils/log");
const key = require("../utils/key");
const utils = require("../utils/utils");
const validator = require("../validate/url");

function printHelp() {
  console.log(`
用法: node src/xiaohongshu/detail-cli.js <笔记链接>

示例: node src/xiaohongshu/detail-cli.js "https://www.xiaohongshu.com/explore/xxx?xsec_token=yyy"

注意: 
  - 笔记链接是小红书可公开访问的笔记链接
  - 即使用 "node src/xiaohongshu/search-cli.js <关键词>" 获取到的出参 url 值所代表的笔记链接
  - 请确保环境变量 GUAIKEI_API_TOKEN 已配置
`);
}

async function main() {
  const startTime = Date.now();
  const args = process.argv.slice(2);
  if (args.length === 0) {
    printHelp();
    return;
  }

  let url = "";
  args.forEach((arg, index) => {
    if (arg === "--url" || arg === "-u") {
      url = args[index + 1] || "";
    } else if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    } else if (arg.startsWith("-") === false && url === "") {
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
  const isRight = validator.isXiaohongshuNoteUrl(url);
  if (!isRight) {
    utils.printError(
      `笔记链接格式无效, 支持: https://www.xiaohongshu.com/explore/xxx?xsec_token=yyy, http://xhslink.com/m/xxx`,
    );
    return;
  }

  const token = key.skillKey(process.env.GUAIKEI_API_TOKEN);
  let detailTask = null;
  try {
    const status = await detail.createDetailTask(token, url);
    if (status.errcode !== 0) {
      throw new Error(
        `详情任务创建时, 遇到未知错误, 请反馈给开发者 ${status} - ${Date.now()}`,
      );
    }
    utils.printSuccess(`详情任务创建成功, 正在搜索中...`);

    detailTask = await detail.getDetailTask(token, url);
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
      skill_version: constants.VERSION,
      runtime_version: process.versions.node,
      execution_time: Date.now() - startTime,
    },
    results: detailTask,
  };
  console.log(JSON.stringify(finalOutput, null, 2));
  utils.printSuccess(`详情任务完成, 已返回结果`);

  await log.taskWrite(
    `${startTime}_${validator.url2Name(url)}_detail.json`,
    JSON.stringify(finalOutput, null, 2),
  );
}

main().catch((error) => {
  utils.printError(error);
  process.exit(1);
});
