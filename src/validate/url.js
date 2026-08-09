function normalizeUrl(url) {
  if (typeof url !== "string" || url.trim() === "") {
    return false;
  }
  url = url.trim();
  url = url.replace(/^http:\/\//, "https://");
  if (!url.startsWith("https://")) {
    return false;
  }
  if (url.indexOf(" ") !== -1) {
    return false;
  }
  return url;
}

function isNoteUrl(url) {
  url = normalizeUrl(url);
  if (!url) return false;
  if (url.startsWith("https://www.xiaohongshu.com/explore/")) {
    return true;
  } else if (url.startsWith("https://xhslink.com/m/")) {
    return true;
  } else if (url.startsWith("https://xhslink.cn/m/")) {
    return true;
  } else {
    return false;
  }
}

function isProfileUrl(url) {
  url = normalizeUrl(url);
  if (!url) return false;
  if (url.startsWith("https://www.xiaohongshu.com/user/profile/")) {
    return true;
  } else if (url.startsWith("https://xhslink.com/m/")) {
    return true;
  } else if (url.startsWith("https://xhslink.cn/m/")) {
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
  normalizeUrl,
  isNoteUrl,
  isProfileUrl,
  url2Name,
};
