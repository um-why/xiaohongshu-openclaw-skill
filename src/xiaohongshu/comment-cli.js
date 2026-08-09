#!/usr/bin/env node

const constants = require("../config/constants");
const comment = require("../api/comment");
const log = require("../utils/log");
const key = require("../utils/key");
const utils = require("../utils/utils");
const validator = require("../validate/url");
const { parseArgs, buildHelp } = require("../utils/args");

const SCHEMA = {
  flags: {
    "--url": {
      alias: "-u",
      key: "url",
      type: "string",
      required: true,
      desc: "笔记链接",
    },
    "--limit": {
      alias: "-l",
      key: "limit",
      type: "number",
      default: 10,
      transform: (v) => Number(v),
      desc: "评论数量, 1-10000",
    },
  },
  positionalKey: "url",
};

function printHelp() {
  console.error(
    buildHelp(SCHEMA, "node src/xiaohongshu/comment-cli.js <笔记链接> [选项]", [
      'node src/xiaohongshu/comment-cli.js --url "https://www.xiaohongshu.com/explore/xxx?xsec_token=yyy"',
    ]) +
      "\n\n注意:\n" +
      "  - 笔记链接是小红书可公开访问的笔记链接\n" +
      "  - 即使用 'node src/xiaohongshu/search-cli.js <关键词>' 获取到的出参 url 值所代表的笔记链接\n" +
      "  - 请确保环境变量 GUAIKEI_API_TOKEN 已配置\n",
  );
}

async function main() {
  const startTime = Date.now();
  const args = process.argv.slice(2);
  if (args.length === 0) {
    printHelp();
    process.exit(0);
  }

  let parsed;
  try {
    parsed = parseArgs(args, SCHEMA);
  } catch (error) {
    utils.printError(`参数解析失败: ${error.message}`);
    printHelp();
    process.exit(1);
  }
  if (parsed._help) {
    printHelp();
    process.exit(0);
  }

  let { url, limit } = parsed;

  utils.printBanner();
  utils.printInfo(`笔记链接: ${url}`);
  const isRight = validator.isNoteUrl(url);
  if (!isRight) {
    utils.printError(
      `笔记链接格式无效, 支持: https://www.xiaohongshu.com/explore/xxx?xsec_token=yyy, http://xhslink.com/m/xxx`,
    );
    process.exit(1);
  }
  url = validator.normalizeUrl(url);
  if (!Number.isFinite(limit) || limit <= 0 || limit > 10000) {
    limit = 10;
  }
  utils.printInfo(`评论数量限制: ${limit}`);

  const token = key.skillKey(process.env.GUAIKEI_API_TOKEN);
  if (token === "") process.exit(1);
  let commentTask = null;
  try {
    await comment.createCommentTask(token, url, limit);
    utils.printSuccess(`评论任务创建成功, 正在获取中...`);

    commentTask = await comment.getCommentTask(token, url, limit);
  } catch (error) {
    const errorOutput = {
      status: "error",
      error_code: error.code || "UNKNOWN",
      message: error.message,
      timestamp: new Date().toLocaleString(),
      request: {
        command: "comment",
        url: url,
        limit: limit,
      },
      skill_metadata: {
        skill_version: constants.VERSION,
        runtime_version: process.versions.node,
        execution_time: Date.now() - startTime,
      },
      results: null,
    };
    process.stdout.write(JSON.stringify(errorOutput, null, 2) + "\n", () =>
      process.exit(1),
    );
    return;
  }
  if (!commentTask) {
    utils.printError(`评论任务没有返回结果, 请稍后重试或联系开发者`);
    const emptyOutput = {
      status: "empty",
      error_code: "NOT_FOUND",
      message: "没有找到匹配的评论内容",
      timestamp: new Date().toLocaleString(),
      request: {
        command: "comment",
        url: url,
        limit: limit,
      },
      skill_metadata: {
        skill_version: constants.VERSION,
        runtime_version: process.versions.node,
        execution_time: Date.now() - startTime,
      },
      results: null,
    };
    process.stdout.write(JSON.stringify(emptyOutput, null, 2) + "\n", () =>
      process.exit(1),
    );
    return;
  }
  // 输出搜索结果
  const finalOutput = {
    status: "success",
    error_code: "OK",
    message: "评论任务完成",
    timestamp: new Date().toLocaleString(),
    request: {
      command: "comment",
      url: url,
      limit: limit,
    },
    skill_metadata: {
      skill_version: constants.VERSION,
      runtime_version: process.versions.node,
      execution_time: Date.now() - startTime,
    },
    results: commentTask,
  };
  console.log(JSON.stringify(finalOutput, null, 2));
  utils.printSuccess(`评论任务完成, 已返回结果`);

  await log.taskWrite(
    `${startTime}_${validator.url2Name(url)}_comment.json`,
    JSON.stringify(finalOutput, null, 2),
  );
}

main().catch((error) => {
  utils.printError(error.message);
  process.exit(1);
});
