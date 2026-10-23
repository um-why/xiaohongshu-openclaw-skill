const NOTE_ID_RE = /^[0-9a-f]{24}$/i;
const USER_ID_RE = /^(?:[0-9a-f]{24}|[0-9a-f]{29})$/i;

const SHORT_PREFIXES = [
  "https://xhslink.com/m/",
  "https://xhslink.com/o/",
  "https://xhslink.cn/m/",
  "https://xhslink.cn/o/",
];

const EXPLORE_PREFIX = "https://www.xiaohongshu.com/explore/";
const DISCOVERY_PREFIX = "https://www.xiaohongshu.com/discovery/item/";
const PROFILE_PREFIX = "https://www.xiaohongshu.com/user/profile/";

function isShortLink(url) {
  return SHORT_PREFIXES.some((prefix) => {
    const id = idAfter(url, prefix);
    return id !== null && /^[0-9A-Za-z_-]{1,128}$/.test(id);
  });
}

function isNoteId(value) {
  return NOTE_ID_RE.test(value);
}

function isUserId(value) {
  return USER_ID_RE.test(value);
}

/**
 * 取出已知路径后的 id，忽略后续的 /、?、#。
 * 不是该前缀时返回 null。
 * @param {string} url
 * @param {string} prefix
 * @returns {string|null}
 */
function idAfter(url, prefix) {
  if (!url.startsWith(prefix)) return null;
  const rest = url.slice(prefix.length);
  return rest.split(/[/?#]/)[0];
}

/**
 * 去掉首尾空白，把 http 升级为 https，并只小写协议和主机名。
 * 已知路径前缀也改为小写。笔记 id、短链 id 和 query 保持原样。
 * 裸 id 原样返回。无法识别时返回空字符串。
 * @param {string} url
 * @returns {string}
 */
function normalizeUrl(url) {
  if (typeof url !== "string") return "";
  url = url.trim();
  if (url === "") return "";
  if (isNoteId(url) || isUserId(url)) return url;
  url = url.replace(/^https?:\/\//i, "https://");
  url = url.replace(
    /^https:\/\/([^/?#]+)/i,
    (_, host) => "https://" + host.toLowerCase(),
  );
  url = url.replace(
    /^https:\/\/xiaohongshu\.com\//,
    "https://www.xiaohongshu.com/",
  );
  url = url.replace(
    /^https:\/\/www\.xiaohongshu\.com(\/(?:explore|discovery\/item|user\/profile))(?=\/)/i,
    (_, pathPrefix) =>
      "https://www.xiaohongshu.com" + pathPrefix.toLowerCase(),
  );
  url = url.replace(
    /^https:\/\/xhslink\.(com|cn)(\/(?:m|o))(?=\/)/i,
    (_, tld, pathPrefix) => "https://xhslink." + tld + pathPrefix.toLowerCase(),
  );
  if (!url.startsWith("https://") || url.includes(" ")) return "";
  return url;
}

function isDetailUrl(url) {
  url = normalizeUrl(url);
  if (!url) return false;
  if (isNoteId(url)) return true;
  const exploreId = idAfter(url, EXPLORE_PREFIX);
  if (exploreId !== null) return isNoteId(exploreId);
  const discoveryId = idAfter(url, DISCOVERY_PREFIX);
  if (discoveryId !== null) return isNoteId(discoveryId);
  return isShortLink(url);
}

function isCommentUrl(url) {
  return isDetailUrl(url);
}

function isProfileUrl(url) {
  url = normalizeUrl(url);
  if (!url) return false;
  if (isUserId(url)) return true;
  const profileId = idAfter(url, PROFILE_PREFIX);
  if (profileId !== null) return isUserId(profileId);
  return isShortLink(url);
}

/**
 * 未传入 expired_at 时，按北京时间近 6 年换算成一个时间点。
 * 同一次命令的创建和查询共用这个值，避免跨日各自计算对不上。
 * @returns {string}
 */
function defaultExpiredAt() {
  const shifted = new Date(Date.now() + 8 * 60 * 60 * 1000);
  const probe = new Date(
    Date.UTC(
      shifted.getUTCFullYear() - 6,
      shifted.getUTCMonth(),
      shifted.getUTCDate(),
    ),
  );
  const year = probe.getUTCFullYear();
  const month = String(probe.getUTCMonth() + 1).padStart(2, "0");
  const day = String(probe.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day} 00:00:00`;
}

/**
 * 评论时间过滤。不传则返回 undefined，由命令换算近 6 年的时间点。
 * 传入时只接受正整数天数，或 YYYY-MM-DD HH:mm:ss。
 * @param {string|number|undefined} value
 * @returns {number|string|undefined}
 */
function assertExpiredAt(value) {
  if (value === undefined || value === null || value === "") return undefined;
  const text = String(value).trim();
  if (/^\d+$/.test(text)) {
    const days = Number(text);
    if (!Number.isInteger(days) || days < 1) {
      throw new Error(
        `expired_at ${value} 无效, 天数须为大于 0 的整数, 或 YYYY-MM-DD HH:mm:ss`,
      );
    }
    return days;
  }
  const matched = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})$/.exec(text);
  if (!matched) {
    throw new Error(
      `expired_at ${value} 无效, 天数须为大于 0 的整数, 或 YYYY-MM-DD HH:mm:ss`,
    );
  }
  const year = Number(matched[1]);
  const month = Number(matched[2]);
  const day = Number(matched[3]);
  const hour = Number(matched[4]);
  const minute = Number(matched[5]);
  const second = Number(matched[6]);
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  if (
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > daysInMonth ||
    hour > 23 ||
    minute > 59 ||
    second > 59
  ) {
    throw new Error(`expired_at ${value} 不是有效的日期时间`);
  }
  return text;
}

function url2Name(url) {
  if (typeof url !== "string" || url === "") return "unknown";
  const clean = url.trim();
  if (isNoteId(clean) || isUserId(clean)) return clean;
  const qIndex = clean.indexOf("?");
  const base = qIndex >= 0 ? clean.slice(0, qIndex) : clean;
  const name = base
    .replace(/^https?:\/\//, "")
    .replace(/www\.xiaohongshu\.com\/explore\//, "note_")
    .replace(/www\.xiaohongshu\.com\/discovery\/item\//, "note_")
    .replace(/www\.xiaohongshu\.com\/user\/profile\//, "profile_")
    .replace(/xhslink\.com\/m\//, "short_")
    .replace(/xhslink\.com\/o\//, "short_")
    .replace(/xhslink\.cn\/m\//, "short_")
    .replace(/xhslink\.cn\/o\//, "short_")
    .replace(/[\/?=&-]/g, "_");
  return name || "unknown";
}

module.exports = {
  normalizeUrl,
  isDetailUrl,
  isCommentUrl,
  isProfileUrl,
  assertExpiredAt,
  defaultExpiredAt,
  url2Name,
};
