#!/usr/bin/env node

const constants = require("../config/constants");
const key = require("../utils/key");
const log = require("../utils/log");
const post = require("../api/post");
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
      desc: "小红书博主链接",
    },
    "--limit": {
      alias: "-l",
      key: "limit",
      type: "number",
      default: 10,
      transform: (v) => Number(v),
      desc: "主页笔记数量, 0-10000",
    },
  },
  positionalKey: "url",
};
function printHelp() {
  console.error(
    buildHelp(
      SCHEMA,
      "node src/xiaohongshu/post-cli.js <小红书博主链接> [选项]",
      [
        'node src/xiaohongshu/post-cli.js --url "https://www.xiaohongshu.com/user/profile/xxx?xsec_token=yyy"',
      ],
    ) +
      "\n\n注意:\n" +
      "  - 小红书博主链接是小红书可公开访问的博主主页链接\n" +
      "  - 请确保环境变量 GUAIKEI_API_TOKEN 已配置\n" +
      "  - 主页笔记数量限制: 0-10000, 默认10\n" +
      "  - 主页笔记数量为0时, 则获取博主的互动数据: 粉丝量、点赞量、收藏量等\n",
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
  utils.printInfo(`小红书博主链接: ${url}`);
  const isRight = validator.isProfileUrl(url);
  if (!isRight) {
    utils.printError(
      `小红书博主链接格式无效, 支持: https://www.xiaohongshu.com/user/profile/xxx?xsec_token=yyy, http://xhslink.com/m/xxx`,
    );
    process.exit(1);
  }
  url = validator.normalizeUrl(url);
  if (!Number.isFinite(limit) || limit < 0 || limit > 10000) {
    limit = 10;
  }
  utils.printInfo(`主页笔记数量限制: ${limit}`);

  const token = key.skillKey(process.env.GUAIKEI_API_TOKEN);
  if (token === "") process.exit(1);
  let postTask = null;
  try {
    await post.createPostTask(token, url, limit);
    utils.printSuccess(`主页笔记任务创建成功, 正在获取中...`);

    postTask = await post.getPostTask(token, url, limit);
  } catch (error) {
    const errorOutput = {
      status: "error",
      error_code: error.code || "UNKNOWN",
      message: error.message,
      timestamp: new Date().toISOString(),
      request: {
        command: "post",
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
  if (!postTask) {
    utils.printError(`主页笔记任务没有返回结果, 请稍后重试或联系开发者`);
    const emptyOutput = {
      status: "empty",
      error_code: "NOT_FOUND",
      message: "没有找到匹配的博主笔记",
      timestamp: new Date().toISOString(),
      request: {
        command: "post",
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
  // 输出博主笔记结果
  const finalOutput = {
    status: "success",
    error_code: "OK",
    message: "博主笔记任务完成",
    timestamp: new Date().toISOString(),
    request: {
      command: "post",
      url: url,
      limit: limit,
    },
    skill_metadata: {
      skill_version: constants.VERSION,
      runtime_version: process.versions.node,
      execution_time: Date.now() - startTime,
    },
    results: postTask,
  };
  console.log(JSON.stringify(finalOutput, null, 2));
  utils.printSuccess(`博主笔记任务完成, 已返回结果`);

  await log.taskWrite(
    `${startTime}_${validator.url2Name(url)}_post.json`,
    JSON.stringify(finalOutput, null, 2),
  );
}

main().catch((error) => {
  utils.printError(error.message);
  process.exit(1);
});
