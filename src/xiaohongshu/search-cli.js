#!/usr/bin/env node

const search = require("../api/search");
const log = require("../utils/log");
const key = require("../utils/key");
const utils = require("../utils/utils");
const validator = require("../validate/keyword");
const { parseArgs, buildHelp } = require("../utils/args");
const {
  emitError,
  emitEmpty,
  printSuccessEnvelope,
  emitUncaught,
} = require("../utils/output");

const SCHEMA = {
  flags: {
    "--keyword": {
      alias: "-k",
      key: "keyword",
      type: "string",
      required: true,
      desc: "搜索关键词",
    },
    "--type": {
      alias: "-t",
      key: "type",
      type: "number",
      default: 0,
      transform: (v) => Number(v),
      desc: "内容类型, 0: 全部(默认), 1: 视频, 2: 图文",
    },
    "--sort": {
      alias: "-s",
      key: "sort",
      type: "number",
      default: 0,
      transform: (v) => Number(v),
      desc: "排序规则, 0: 综合(默认), 1: 最新, 2: 最多点赞, 3: 最多评论, 4: 最多收藏",
    },
    "--time": {
      alias: "-i",
      key: "time",
      type: "number",
      default: 0,
      transform: (v) => Number(v),
      desc: "发布时间, 0: 全部(默认), 1: 一天内, 2: 一周内, 3: 半年内",
    },
    "--limit": {
      alias: "-l",
      key: "limit",
      type: "number",
      default: 20,
      transform: (v) => Number(v),
      desc: "搜索数量, 1-10000",
    },
  },
  positionalKey: "keyword",
};

const AUTH_MESSAGE =
  "GUAIKEI_API_TOKEN 未配置或格式无效。须为 16-256 位字母、数字、下划线或连字符; 可通过 https://www.guaikei.com 自助开通";

function printHelp() {
  process.stderr.write(
    buildHelp(SCHEMA, "node src/xiaohongshu/search-cli.js <关键词> [选项]", [
      'node src/xiaohongshu/search-cli.js --keyword "露营装备"',
      "node src/xiaohongshu/search-cli.js --keyword 露营装备 --type 2 --sort 2 --time 2 --limit 20",
    ]) +
      "\n\n注意:\n" +
      "  - 关键词 1-50 个字符，不能是链接，不含 < > \" '\n" +
      "  - 类型、排序、时间和数量若不在允许范围内，命令会直接失败，不会改成默认值后继续搜索\n" +
      "  - 关键词以 - 开头时写成 --keyword=-AI，或在 -- 后面写位置参数\n",
  );
}

async function main() {
  const startTime = Date.now();
  const args = process.argv.slice(2);
  if (args.length === 0) {
    printHelp();
    emitError("search", "INVALID_ARGS", "缺少命令参数", 2, startTime);
    return;
  }

  let parsed;
  try {
    parsed = parseArgs(args, SCHEMA);
  } catch (error) {
    utils.printError(`参数解析错误: ${error.message}`);
    printHelp();
    emitError(
      "search",
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

  let { keyword, type, sort, time, limit } = parsed;
  const keywordRaw = keyword;

  utils.printBanner();
  utils.printInfo(`原始关键词: ${keywordRaw}`);
  keyword = validator.normalizeKeyword(keyword);
  if (!validator.isKeywordValid(keyword)) {
    emitError(
      "search",
      "INVALID_KEYWORD",
      "关键词不合法: 需 1-50 个字符, 不能是链接, 不含 < > \" '",
      1,
      startTime,
      {
        command: "search",
        keyword_raw: keywordRaw,
        keyword,
        type,
        sort,
        time,
        limit,
      },
    );
    return;
  }
  utils.printInfo(`清洗后关键词: ${keyword}`);
  try {
    [type, sort, time, limit] = validator.assertSearchOptions(
      type,
      sort,
      time,
      limit,
    );
  } catch (error) {
    utils.printError(error.message);
    emitError("search", "INVALID_ARGS", error.message, 2, startTime, {
      command: "search",
      keyword_raw: keywordRaw,
      keyword,
      type,
      sort,
      time,
      limit,
    });
    return;
  }
  utils.printInfo(
    `内容类型: ${type}, 排序规则: ${sort}, 发布时间: ${time}, 数量: ${limit}`,
  );

  const token = key.skillKey(process.env.GUAIKEI_API_TOKEN);
  if (token === "") {
    emitError("search", "AUTH_REQUIRED", AUTH_MESSAGE, 3, startTime, {
      command: "search",
      keyword_raw: keywordRaw,
      keyword,
      type,
      sort,
      time,
      limit,
    });
    return;
  }

  const searchRequest = {
    command: "search",
    keyword_raw: keywordRaw,
    keyword,
    type,
    sort,
    time,
    limit,
  };
  let searchTask = null;
  try {
    await search.createSearchTask(token, keyword, type, sort, time, limit);
    utils.printSuccess("搜索任务创建成功, 正在搜索中...");
    searchTask = await search.getSearchTask(
      token,
      keyword,
      type,
      sort,
      time,
      limit,
    );
  } catch (error) {
    utils.printError(`搜索失败: ${error.message}`);
    emitError(
      "search",
      error.code || "UNKNOWN",
      error.message,
      error.name === "AuthError" ? 3 : 1,
      startTime,
      searchRequest,
    );
    return;
  }

  if (!Array.isArray(searchTask) || searchTask.length === 0) {
    utils.printInfo("没有找到匹配的笔记");
    emitEmpty("没有找到匹配的笔记", startTime, searchRequest);
    return;
  }

  const { payload: finalOutput, text } = printSuccessEnvelope(
    "搜索任务完成",
    startTime,
    searchRequest,
    searchTask,
  );
  utils.printSuccess(
    `搜索任务完成, 共返回 ${finalOutput.results.length} 条结果`,
  );

  await log.taskWrite(
    `${startTime}_${keyword}_${type}_${sort}_${time}_${limit}_search.json`,
    text,
  );
}

main().catch((error) => {
  utils.printError(error.message || String(error));
  emitUncaught("search", error);
});
