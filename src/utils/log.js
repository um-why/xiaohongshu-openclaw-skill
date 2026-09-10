const fs = require("fs");
const path = require("path");
const os = require("os");
const utils = require("./utils");

function localDateStr() {
  const d = new Date();
  return (
    d.getFullYear() +
    "-" +
    String(d.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(d.getDate()).padStart(2, "0")
  );
}

async function taskWrite(filename, content) {
  if (!filename || typeof filename !== "string") {
    utils.printError("日志文件名必须是非空字符串");
    return;
  }
  if (!content || typeof content !== "string") {
    utils.printError("日志内容必须是非空字符串");
    return;
  }
  let safeFilename = filename
    .replace(/[\\/:*?"<>|]/g, "_")
    .replace(/\.\.+/g, "_")
    .replace(/^\.+|\.+$/g, "");
  if (safeFilename.length > 200) {
    safeFilename = safeFilename.substring(0, 200);
  }
  if (safeFilename === "") {
    safeFilename = `log_${Date.now()}`;
  }

  const dayDir = localDateStr();
  const outputDir = path.join(
    os.tmpdir(),
    "xiaohongshu-guaikei",
    "logs",
    dayDir,
  );
  const outputFilename = path.join(outputDir, safeFilename);

  try {
    await fs.promises.mkdir(outputDir, { recursive: true });
    await fs.promises.writeFile(outputFilename, content);
    utils.printSuccess(`  → 已保存到 ${outputFilename}`);
  } catch (error) {
    utils.printError(`日志写入失败: ${error.message}`);
  }
}

module.exports = {
  taskWrite,
};
