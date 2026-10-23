const utils = require("../utils/utils");

/**
 * 检查搜索关键词。长度 1-50，不能是链接，不含 < > " '。
 * @param {string} keyword
 * @returns {boolean}
 */
function isKeywordValid(keyword) {
  if (typeof keyword !== "string" || keyword.trim() === "") {
    utils.printError("搜索关键词不能为空");
    return false;
  }
  keyword = keyword.trim();
  if (keyword.length < 1 || keyword.length > 50) {
    utils.printError("搜索关键词长度须为 1-50 个字符");
    return false;
  }
  if (/[<>"']/.test(keyword)) {
    utils.printError("搜索关键词包含特殊字符, 请输入普通关键词, 例如: 新媒体");
    return false;
  }
  if (/https?:\/\//i.test(keyword) || /www\./i.test(keyword)) {
    utils.printError("搜索关键词不能是链接, 请输入普通关键词, 例如: 新媒体");
    return false;
  }
  return true;
}

/**
 * 去掉控制字符、零宽字符和 emoji，连续空白收敛为一个空格。
 * @param {string} keyword
 * @returns {string}
 */
function normalizeKeyword(keyword) {
  if (typeof keyword !== "string") return "";
  return keyword
    .replace(/[\u0000-\u001f\u007f\u200b-\u200f\ufeff]/g, "")
    .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

function assertChoice(value, allowed, label) {
  const n = Number(value);
  if (!allowed.includes(n)) {
    throw new Error(`${label} ${value} 无效, 允许值: ${allowed.join(", ")}`);
  }
  return n;
}

function assertIntegerRange(value, min, max, label) {
  const n = Number(value);
  if (!Number.isInteger(n) || n < min || n > max) {
    throw new Error(`${label} ${value} 无效, 允许 ${min}-${max} 的整数`);
  }
  return n;
}

/**
 * 校验搜索选项。非法值直接失败，不改写成默认值。
 * @returns {[number, number, number, number]}
 */
function assertSearchOptions(type, sort, time, limit) {
  type = assertChoice(type, [0, 1, 2], "内容类型 type");
  sort = assertChoice(sort, [0, 1, 2, 3, 4], "排序规则 sort");
  time = assertChoice(time, [0, 1, 2, 3], "发布时间 time");
  limit = assertIntegerRange(limit, 1, 10000, "搜索数量 limit");
  return [type, sort, time, limit];
}

module.exports = {
  normalizeKeyword,
  isKeywordValid,
  assertSearchOptions,
  assertIntegerRange,
};
