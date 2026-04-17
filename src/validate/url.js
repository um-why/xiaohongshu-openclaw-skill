const utils = require("../utils/utils");

/**
 * 检查笔记链接是否符合要求
 */
function isXiaohongshuNoteUrl(url) {
  url = url.trim();
  url = url.replace("http://", "https://");
  if (url.indexOf("https://") !== 0) {
    utils.printError(`笔记链接必须以 https:// 开头`);
    return false;
  }
  if (url.indexOf(" ") !== -1) {
    utils.printError(`笔记链接不能包含空格`);
    return false;
  }
  if (url.indexOf("https://www.xiaohongshu.com/explore/") !== -1) {
    if (url.indexOf("?xsec_token=") === -1) {
      utils.printError(`笔记链接必须包含 xsec_token 参数`);
      return false;
    }
  } else if (url.indexOf("https://xhslink.com/m/") !== -1) {
  } else {
    utils.printError(`笔记链接格式无效`);
    return false;
  }
  return true;
}

function url2Name(url) {
  url = url.substring(0, url.indexOf("?"));
  return url
    .replace(/^https?:\/\//, "")
    .replace(/www\.xiaohongshu\.com\/explore\/|xhslink\.com\/m\//, "")
    .replace(/[\/?=&\-]/g, "_");
}

module.exports = {
  isXiaohongshuNoteUrl,
  url2Name,
};
