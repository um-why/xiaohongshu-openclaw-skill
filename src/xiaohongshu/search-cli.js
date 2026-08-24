#!/usr/bin/env node

const constants = require("../config/constants");
const key = require("../utils/key");
const log = require("../utils/log");
const search = require("../api/search");
const utils = require("../utils/utils");
const validator = require("../validate/keyword");
const { parseArgs, buildHelp } = require("../utils/args");

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
      desc: "发布时间, 0: 不限(默认), 1: 一天内, 2: 一周内, 3: 半年内",
    },
    "--limit": {
      alias: "-l",
      key: "limit",
      type: "number",
      default: 10,
      transform: (v) => Number(v),
      desc: "搜索数量, 1-10000",
    },
  },
  positionalKey: "keyword",
};

function printHelp() {
  console.error(
    buildHelp(SCHEMA, "node src/xiaohongshu/search-cli.js <关键词> [选项]", [
      "node src/xiaohongshu/search-cli.js -k AI",
      'node src/xiaohongshu/search-cli.js -k "AI 模型"',
      "node src/xiaohongshu/search-cli.js --keyword AI --type 0 --sort 0 --limit 10",
      'node src/xiaohongshu/search-cli.js --keyword "AI 模型" --type 1 --sort 2 --limit 20',
    ]) +
      "\n\n注意:\n" +
      "  - 关键词建议 2-50 个汉字，避免特殊符号\n" +
      "  - 请确保环境变量 GUAIKEI_API_TOKEN 已配置\n" +
      "  - 所有参数都会自动清洗和验证\n",
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
    utils.printError(`参数解析错误: ${error.message}`);
    printHelp();
    process.exit(1);
  }
  if (parsed._help) {
    printHelp();
    process.exit(0);
  }

  let { keyword, type, sort, time, limit } = parsed;

  utils.printBanner();
  utils.printInfo(`原始关键词: ${keyword}`);
  keyword = validator.cleanKeyword(keyword);
  const isRight = validator.isKeywordValid(keyword);
  if (!isRight) {
    process.exit(1);
  }
  utils.printInfo(`清洗后关键词: ${keyword}`);
  if (keyword === "") {
    utils.printError(`关键词不能为空`);
    process.exit(1);
  }

  [type, sort, time, limit] = validator.optionFormat(type, sort, time, limit);
  utils.printInfo(
    `内容类型: ${type}, 排序规则: ${sort}, 发布时间: ${time}, 数量: ${limit}`,
  );

  const token = key.skillKey(process.env.GUAIKEI_API_TOKEN);
  if (token === "") process.exit(1);

  let searchTask = null;
  try {
    await search.createSearchTask(token, keyword, type, sort, time, limit);
    utils.printSuccess(`搜索任务创建成功, 正在搜索中...`);

    searchTask = await search.getSearchTask(
      token,
      keyword,
      type,
      sort,
      time,
      limit,
    );
  } catch (error) {
    const errorOutput = {
      status: "error",
      error_code: error.code || "UNKNOWN",
      message: error.message,
      timestamp: new Date().toISOString(),
      request: {
        command: "search",
        keyword: keyword,
        type: type,
        sort: sort,
        time: time,
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
  if (!searchTask || !Array.isArray(searchTask) || searchTask.length === 0) {
    utils.printError(`搜索任务没有返回结果, 请稍后重试或联系开发者`);
    const emptyOutput = {
      status: "empty",
      error_code: "NO_MATCH",
      message: "没有找到匹配的视频或图文内容",
      timestamp: new Date().toISOString(),
      request: {
        command: "search",
        keyword: keyword,
        type: type,
        sort: sort,
        time: time,
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
    message: "搜索任务完成",
    timestamp: new Date().toISOString(),
    request: {
      command: "search",
      keyword: keyword,
      type: type,
      sort: sort,
      time: time,
      limit: limit,
    },
    skill_metadata: {
      skill_version: constants.VERSION,
      runtime_version: process.versions.node,
      execution_time: Date.now() - startTime,
    },
    results: searchTask,
  };
  console.log(JSON.stringify(finalOutput, null, 2));
  utils.printSuccess(
    `搜索任务完成, 共返回 ${finalOutput.results.length} 条结果`,
  );

  await log.taskWrite(
    `${startTime}_${keyword}_${type}_${sort}_${limit}_search.json`,
    JSON.stringify(finalOutput, null, 2),
  );
}

main().catch((error) => {
  utils.printError(error.message);
  process.exit(1);
});
