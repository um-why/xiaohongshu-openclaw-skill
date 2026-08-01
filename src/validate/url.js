const utils = require("../utils/utils");

function normalizeUrl(url) {
  if (typeof url !== "string" || url.trim() === "") {
    utils.printError(`小红书链接不能为空`);
    return false;
  }
  url = url.trim();
  url = url.replace("http://", "https://");
  if (url.indexOf("https://") !== 0) {
    utils.printError(`小红书链接必须以 https:// 开头`);
    return false;
  }
  if (url.indexOf(" ") !== -1) {
    utils.printError(`小红书链接不能包含空格`);
    return false;
  }
  return true;
}

function isNoteUrl(url) {
  if (!normalizeUrl(url)) return false;
  if (url.indexOf("https://www.xiaohongshu.com/explore/") !== -1) {
    return true;
  } else if (url.indexOf("https://xhslink.com/m/") !== -1) {
    return true;
  } else if (url.indexOf("https://xhslink.cn/m/") !== -1) {
    return true;
  } else {
    return false;
  }
}

function isProfileUrl(url) {
  if (!normalizeUrl(url)) return false;
  if (url.indexOf("https://www.xiaohongshu.com/user/profile/") !== -1) {
    return true;
  } else if (url.indexOf("https://xhslink.com/m/") !== -1) {
    return true;
  } else if (url.indexOf("https://xhslink.cn/m/") !== -1) {
    return true;
  } else {
    return false;
  }
}

function url2Name(url) {
  if (typeof url !== "string" || url === "") return "unknown";
  const clean = url.trim();
  const qIndex = clean.indexOf("?");
  const base = qIndex >= 0 ? clean.slice(0, qIndex) : clean;
  const name = base
    .replace(/^https?:\/\//, "")
    .replace(/www\.xiaohongshu\.com\/explore\//, "note_")
    .replace(/www\.xiaohongshu\.com\/user\/profile\//, "profile_")
    .replace(/xhslink\.com\/m\//, "short_")
    .replace(/xhslink\.cn\/m\//, "short_")
    .replace(/[\/?=&-]/g, "_");
  return name || "unknown";
}

module.exports = {
  isNoteUrl,
  isProfileUrl,
  url2Name,
};
