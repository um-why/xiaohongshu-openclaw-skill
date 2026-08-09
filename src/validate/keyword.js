const utils = require("../utils/utils");

/**
 * 检查搜索关键词是否符合要求
 */
function isKeywordValid(keyword) {
  if (typeof keyword !== "string" || keyword.trim() === "") {
    utils.printError(`搜索关键词不能为空`);
    return false;
  }
  keyword = keyword.trim();
  if (keyword.length < 2) {
    utils.printError(`搜索关键词长度不能小于 2 个字符`);
    return false;
  }
  if (keyword.length > 50) {
    utils.printError(`搜索关键词长度不能超过 50 个字符`);
    return false;
  }
  if (/[<>\"'&]/g.test(keyword)) {
    utils.printError(`搜索关键词包含特殊字符, 请输入普通关键词, 例如: 新媒体`);
    return false;
  }
  if (keyword.includes("http")) {
    utils.printError(
      `搜索关键词包含 http 链接, 请输入普通关键词, 例如: 新媒体`,
    );
    return false;
  }
  return true;
}

/**
 * 清洗搜索关键词
 */
function cleanKeyword(keyword) {
  if (typeof keyword !== "string" || keyword.trim() === "") return "";
  keyword = keyword.trim();
  keyword = keyword.replace(/[^\u4e00-\u9fa5a-zA-Z0-9\s.,!?# ，。！？]/g, "");
  keyword = keyword.trim();
  if (keyword.length === 0) return "";
  return keyword;
}

/**
 * 格式化搜索选项, 并检查是否有效
 */
function optionFormat(type, sort, time, limit) {
  type = type || 0;
  sort = sort || 0;
  time = time || 0;
  limit = limit || 10;
  if (type !== 0 && type !== 1 && type !== 2) {
    utils.printError(`内容类型 ${type} 无效, 请使用 0, 1, 2。 默认值为 0`);
    type = 0;
  }
  if (sort !== 0 && sort !== 1 && sort !== 2 && sort !== 3 && sort !== 4) {
    utils.printError(
      `排序规则 ${sort} 无效, 请使用 0, 1, 2, 3, 4。 默认值为 0`,
    );
    sort = 0;
  }
  if (time !== 0 && time !== 1 && time !== 2 && time !== 3) {
    utils.printError(`发布时间 ${time} 无效, 请使用 0, 1, 2, 3。 默认值为 0`);
    time = 0;
  }
  if (limit <= 0 || limit > 10000) {
    utils.printError(`搜索数量 ${limit} 无效, 请使用 1-10000。 默认值为 10`);
    limit = 10;
  }
  return [type, sort, time, limit];
}

module.exports = {
  cleanKeyword,
  isKeywordValid,
  optionFormat,
};
