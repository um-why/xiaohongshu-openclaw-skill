#!/usr/bin/env node

const comment = require("../api/comment");
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
      desc: "笔记链接或笔记 id",
    },
    "--expired_at": {
      alias: "-e",
      key: "expired_at",
      type: "string",
      desc: "近 N 天, 或 YYYY-MM-DD HH:mm:ss 之后; 不传则按近 6 年换算",
    },
    "--expire": {
      key: "expired_at",
      type: "string",
      desc: "同 --expired_at",
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

const AUTH_MESSAGE =
  "GUAIKEI_API_TOKEN 未配置或格式无效。须为 16-256 位字母、数字、下划线或连字符; 可通过 https://www.guaikei.com 自助开通";

const URL_MESSAGE =
  "无法识别笔记链接。支持: https://www.xiaohongshu.com/explore/{id}、https://www.xiaohongshu.com/discovery/item/{id}、https://xhslink.com/o/*、https://xhslink.cn/o/*、https://xhslink.com/m/*、https://xhslink.cn/m/*，或 24 位笔记 id";

function printHelp() {
  process.stderr.write(
    buildHelp(SCHEMA, "node src/xiaohongshu/comment-cli.js <笔记链接> [选项]", [
      'node src/xiaohongshu/comment-cli.js --url "https://www.xiaohongshu.com/explore/xxx" --limit 100',
      'node src/xiaohongshu/comment-cli.js --url "https://www.xiaohongshu.com/explore/xxx" --expired_at 30',
      'node src/xiaohongshu/comment-cli.js --url "https://www.xiaohongshu.com/explore/xxx" --expired_at "2026-10-01 12:00:00"',
    ]) +
      "\n\n注意:\n" +
      "  - 这是笔记链接，不是博主主页链接\n" +
      "  - --expired_at 不传时，按北京时间近 6 年换算成一个时间点，创建和查询共用\n" +
      "  - 天数和数量若不合法，命令会直接失败，不会改成默认值后继续请求\n",
  );
}

function commentRequest(urlRaw, url, expiredAt, limit) {
  const request = { command: "comment", url_raw: urlRaw, url, limit };
  if (expiredAt !== undefined) request.expired_at = expiredAt;
  return request;
}

async function main() {
  const startTime = Date.now();
  const args = process.argv.slice(2);
  if (args.length === 0) {
    printHelp();
    emitError("comment", "INVALID_ARGS", "缺少命令参数", 2, startTime);
    return;
  }

  let parsed;
  try {
    parsed = parseArgs(args, SCHEMA);
  } catch (error) {
    utils.printError(`参数解析失败: ${error.message}`);
    printHelp();
    emitError(
      "comment",
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

  let { url, expired_at: expiredAt, limit } = parsed;
  const urlRaw = url;

  utils.printBanner();
  utils.printInfo(`原始链接: ${urlRaw}`);
  if (!validator.isCommentUrl(url)) {
    utils.printError(URL_MESSAGE);
    emitError("comment", "INVALID_URL", URL_MESSAGE, 1, startTime, {
      command: "comment",
      url_raw: urlRaw,
    });
    return;
  }
  url = validator.normalizeUrl(url);
  utils.printInfo(`规范后的链接: ${url}`);

  try {
    expiredAt = validator.assertExpiredAt(expiredAt);
    if (expiredAt === undefined) expiredAt = validator.defaultExpiredAt();
    limit = assertIntegerRange(limit, 1, 10000, "评论数量 limit");
  } catch (error) {
    utils.printError(error.message);
    emitError("comment", "INVALID_ARGS", error.message, 2, startTime, {
      command: "comment",
      url_raw: urlRaw,
      url,
      expired_at: expiredAt,
      limit,
    });
    return;
  }
  utils.printInfo(`评论时间过滤: ${expiredAt}`);
  utils.printInfo(`评论数量限制: ${limit}`);

  const token = key.skillKey(process.env.GUAIKEI_API_TOKEN);
  if (token === "") {
    emitError(
      "comment",
      "AUTH_REQUIRED",
      AUTH_MESSAGE,
      3,
      startTime,
      commentRequest(urlRaw, url, expiredAt, limit),
    );
    return;
  }

  const request = commentRequest(urlRaw, url, expiredAt, limit);
  let commentTask = null;
  try {
    await comment.createCommentTask(token, url, expiredAt, limit);
    utils.printSuccess("评论任务创建成功, 正在获取中...");
    commentTask = await comment.getCommentTask(token, url, expiredAt, limit);
  } catch (error) {
    utils.printError(`获取评论失败: ${error.message}`);
    emitError(
      "comment",
      error.code || "UNKNOWN",
      error.message,
      error.name === "AuthError" ? 3 : 1,
      startTime,
      request,
    );
    return;
  }

  if (!Array.isArray(commentTask) || commentTask.length === 0) {
    utils.printInfo("没有找到匹配的评论");
    emitEmpty("没有找到匹配的评论", startTime, request);
    return;
  }

  const { payload: finalOutput, text } = printSuccessEnvelope(
    "评论任务完成",
    startTime,
    request,
    commentTask,
  );
  utils.printSuccess(
    `评论任务完成, 共返回 ${finalOutput.results.length} 条结果`,
  );

  await log.taskWrite(
    `${startTime}_${validator.url2Name(url)}_comment.json`,
    text,
  );
}

main().catch((error) => {
  utils.printError(error.message || String(error));
  emitUncaught("comment", error);
});
