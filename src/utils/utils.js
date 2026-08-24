/**
 * 通用工具函数模块
 */

function printBanner() {
  process.stderr.write("╔════════════════════════════════════════════╗\n");
  process.stderr.write("║                                            ║\n");
  process.stderr.write("║       📕 小红书运营全链路数据工具           ║\n");
  process.stderr.write("║                                            ║\n");
  process.stderr.write("╚════════════════════════════════════════════╝\n");
  process.stderr.write("\n");
}

function printLog(level, message) {
  const colorMap = {
    INFO: "\x1b[34m",
    SUCCESS: "\x1b[32m",
    WARN: "\x1b[33m",
    ERROR: "\x1b[31m",
  };
  console.error(
    `${colorMap[level] || ""}[${new Date().toISOString()}] [${level}] ${message}\x1b[0m`,
  );
}

module.exports = {
  printBanner,
  printInfo: (msg) => printLog("INFO", msg),
  printSuccess: (msg) => printLog("SUCCESS", msg),
  printError: (msg) => printLog("ERROR", msg),
  printWarn: (msg) => printLog("WARN", msg),
};
