#!/usr/bin/env node

const detail = require("../api/detail");
const log = require("../utils/log");
const key = require("../utils/key");
const utils = require("../utils/utils");
const validator = require("../validate/url");
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
  },
  positionalKey: "url",
};

const AUTH_MESSAGE =
  "GUAIKEI_API_TOKEN 未配置或格式无效。须为 16-256 位字母、数字、下划线或连字符; 可通过 https://www.guaikei.com 自助开通";

const URL_MESSAGE =
  "无法识别笔记链接。支持: https://www.xiaohongshu.com/explore/{id}、https://www.xiaohongshu.com/discovery/item/{id}、https://xhslink.com/o/*、https://xhslink.cn/o/*、https://xhslink.com/m/*、https://xhslink.cn/m/*，或 24 位笔记 id";

function printHelp() {
  process.stderr.write(
    buildHelp(SCHEMA, "node src/xiaohongshu/detail-cli.js <笔记链接>", [
      'node src/xiaohongshu/detail-cli.js --url "https://www.xiaohongshu.com/explore/xxx"',
      "node src/xiaohongshu/detail-cli.js --url 6a0123456789abcdef012345",
    ]) +
      "\n\n注意:\n" +
      "  - 这是笔记链接，不是博主主页链接\n" +
      "  - 详情不返回评论；评论请使用 comment-cli.js\n",
  );
}

async function main() {
  const startTime = Date.now();
  const args = process.argv.slice(2);
  if (args.length === 0) {
    printHelp();
    emitError("detail", "INVALID_ARGS", "缺少命令参数", 2, startTime);
    return;
  }

  let parsed;
  try {
    parsed = parseArgs(args, SCHEMA);
  } catch (error) {
    utils.printError(`参数解析失败: ${error.message}`);
    printHelp();
    emitError(
      "detail",
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

  let { url } = parsed;
  const urlRaw = url;

  utils.printBanner();
  utils.printInfo(`原始链接: ${urlRaw}`);
  if (!validator.isDetailUrl(url)) {
    utils.printError(URL_MESSAGE);
    emitError("detail", "INVALID_URL", URL_MESSAGE, 1, startTime, {
      command: "detail",
      url_raw: urlRaw,
    });
    return;
  }
  url = validator.normalizeUrl(url);
  utils.printInfo(`规范后的链接: ${url}`);

  const token = key.skillKey(process.env.GUAIKEI_API_TOKEN);
  if (token === "") {
    emitError("detail", "AUTH_REQUIRED", AUTH_MESSAGE, 3, startTime, {
      command: "detail",
      url_raw: urlRaw,
      url,
    });
    return;
  }

  const detailRequest = { command: "detail", url_raw: urlRaw, url };
  let detailTask = null;
  try {
    await detail.createDetailTask(token, url);
    utils.printSuccess("详情任务创建成功, 正在获取中...");
    detailTask = await detail.getDetailTask(token, url);
  } catch (error) {
    utils.printError(`获取详情失败: ${error.message}`);
    emitError(
      "detail",
      error.code || "UNKNOWN",
      error.message,
      error.name === "AuthError" ? 3 : 1,
      startTime,
      detailRequest,
    );
    return;
  }

  if (!detailTask) {
    utils.printInfo("没有找到匹配的笔记");
    emitEmpty("没有找到匹配的笔记", startTime, detailRequest);
    return;
  }

  const { text } = printSuccessEnvelope(
    "详情任务完成",
    startTime,
    detailRequest,
    detailTask,
  );
  utils.printSuccess("详情任务完成, 已返回结果");

  await log.taskWrite(
    `${startTime}_${validator.url2Name(url)}_detail.json`,
    text,
  );
}

main().catch((error) => {
  utils.printError(error.message || String(error));
  emitUncaught("detail", error);
});
