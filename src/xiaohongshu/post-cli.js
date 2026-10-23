#!/usr/bin/env node

const post = require("../api/post");
const log = require("../utils/log");
const key = require("../utils/key");
const utils = require("../utils/utils");
const validator = require("../validate/url");
const { assertIntegerRange } = require("../validate/keyword");
const { parseArgs, buildHelp } = require("../utils/args");
const {
  emitError,
  emitEmpty,
  printSuccessEnvelope,
  emitUncaught,
} = require("../utils/output");

const SCHEMA = {
  flags: {
    "--url": {
      alias: "-u",
      key: "url",
      type: "string",
      required: true,
      desc: "博主主页链接或 user_id",
    },
    "--limit": {
      alias: "-l",
      key: "limit",
      type: "number",
      default: 0,
      transform: (v) => Number(v),
      desc: "笔记数量, 0-10000; 0 表示只取博主信息和互动数据",
    },
  },
  positionalKey: "url",
};

const AUTH_MESSAGE =
  "GUAIKEI_API_TOKEN 未配置或格式无效。须为 16-256 位字母、数字、下划线或连字符; 可通过 https://www.guaikei.com 自助开通";

const URL_MESSAGE =
  "无法识别博主主页链接。支持: https://www.xiaohongshu.com/user/profile/{user_id}、https://xhslink.com/o/*、https://xhslink.cn/o/*、https://xhslink.com/m/*、https://xhslink.cn/m/*，或 24 / 29 位 user_id";

function printHelp() {
  process.stderr.write(
    buildHelp(
      SCHEMA,
      "node src/xiaohongshu/post-cli.js <博主主页链接> [选项]",
      [
        'node src/xiaohongshu/post-cli.js --url "https://www.xiaohongshu.com/user/profile/xxx"',
        'node src/xiaohongshu/post-cli.js --url "https://www.xiaohongshu.com/user/profile/xxx" --limit 20',
      ],
    ) +
      "\n\n注意:\n" +
      "  - 这是博主主页链接，不是笔记链接\n" +
      "  - 不传 --limit 时默认为 0，只返回博主信息和互动数据\n" +
      "  - 数量若不在 0-10000，命令会直接失败，不会改成默认值后继续请求\n",
  );
}

function isEmptyPost(task) {
  if (!task || typeof task !== "object") return true;
  const hasNotes = Array.isArray(task.note) && task.note.length > 0;
  const hasUser = task.user && Object.keys(task.user).length > 0;
  return !hasNotes && !hasUser;
}

async function main() {
  const startTime = Date.now();
  const args = process.argv.slice(2);
  if (args.length === 0) {
    printHelp();
    emitError("post", "INVALID_ARGS", "缺少命令参数", 2, startTime);
    return;
  }

  let parsed;
  try {
    parsed = parseArgs(args, SCHEMA);
  } catch (error) {
    utils.printError(`参数解析失败: ${error.message}`);
    printHelp();
    emitError(
      "post",
      "INVALID_ARGS",
      `参数解析错误: ${error.message}`,
      2,
      startTime,
    );
    return;
  }
  if (parsed._warnings) {
    for (const w of parsed._warnings) utils.printWarn(w);
  }
  if (parsed._help) {
    printHelp();
    return;
  }

  let { url, limit } = parsed;
  const urlRaw = url;

  utils.printBanner();
  utils.printInfo(`原始链接: ${urlRaw}`);
  if (!validator.isProfileUrl(url)) {
    utils.printError(URL_MESSAGE);
    emitError("post", "INVALID_URL", URL_MESSAGE, 1, startTime, {
      command: "post",
      url_raw: urlRaw,
    });
    return;
  }
  url = validator.normalizeUrl(url);
  utils.printInfo(`规范后的链接: ${url}`);
  try {
    limit = assertIntegerRange(limit, 0, 10000, "笔记数量 limit");
  } catch (error) {
    utils.printError(error.message);
    emitError("post", "INVALID_ARGS", error.message, 2, startTime, {
      command: "post",
      url_raw: urlRaw,
      url,
      limit,
    });
    return;
  }
  utils.printInfo(`笔记数量限制: ${limit}`);

  const token = key.skillKey(process.env.GUAIKEI_API_TOKEN);
  if (token === "") {
    emitError("post", "AUTH_REQUIRED", AUTH_MESSAGE, 3, startTime, {
      command: "post",
      url_raw: urlRaw,
      url,
      limit,
    });
    return;
  }

  const postRequest = { command: "post", url_raw: urlRaw, url, limit };
  let postTask = null;
  try {
    await post.createPostTask(token, url, limit);
    utils.printSuccess("博主笔记任务创建成功, 正在获取中...");
    postTask = await post.getPostTask(token, url, limit);
  } catch (error) {
    utils.printError(`获取博主笔记失败: ${error.message}`);
    emitError(
      "post",
      error.code || "UNKNOWN",
      error.message,
      error.name === "AuthError" ? 3 : 1,
      startTime,
      postRequest,
    );
    return;
  }

  if (isEmptyPost(postTask)) {
    utils.printInfo("没有找到匹配的博主或笔记");
    emitEmpty("没有找到匹配的博主或笔记", startTime, postRequest);
    return;
  }

  const { text } = printSuccessEnvelope(
    "博主笔记任务完成",
    startTime,
    postRequest,
    postTask,
  );
  const noteCount = Array.isArray(postTask.note) ? postTask.note.length : 0;
  const hasUser = Boolean(postTask.user && Object.keys(postTask.user).length);
  utils.printSuccess(
    `博主笔记任务完成, 笔记 ${noteCount} 条${hasUser ? ", 含博主信息" : ""}`,
  );

  await log.taskWrite(
    `${startTime}_${validator.url2Name(url)}_post.json`,
    text,
  );
}

main().catch((error) => {
  utils.printError(error.message || String(error));
  emitUncaught("post", error);
});
