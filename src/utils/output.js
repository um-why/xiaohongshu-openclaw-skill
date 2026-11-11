/**
 * stdout 信封。成功/错误/空结果均 write + drain 后再结束。
 * 成功路径：先落盘（可选）→ 刷 stdout → stderr 提示 → exit(0)。
 */
const constants = require("../config/constants");
const log = require("./log");
const utils = require("./utils");
const { formatBeijingTime } = require("./time");

/**
 * @param {object} payload
 * @returns {Promise<void>}
 */
function writeJson(payload) {
  const text = JSON.stringify(payload, null, 2) + "\n";
  return new Promise((resolve) => {
    const done = (err) => {
      if (err && err.code !== "EPIPE") {
        try {
          process.stderr.write(`stdout 写入失败: ${err.message}\n`);
        } catch (_) {
          /* ignore */
        }
      }
      resolve();
    };
    process.stdout.once("error", done);
    process.stdout.write(text, done);
  });
}

/**
 * @param {object} payload
 * @param {number} exitCode
 */
function writeJsonAndExit(payload, exitCode) {
  writeJson(payload).then(() => {
    process.exit(exitCode);
  });
}

function buildEnvelope({
  status,
  errorCode,
  message,
  request,
  startTime,
  results = null,
}) {
  return {
    status,
    error_code: errorCode,
    message,
    timestamp: formatBeijingTime(new Date()),
    request,
    metadata: {
      skill_version: constants.VERSION,
      runtime_version: process.versions.node,
      execution_time: startTime == null ? 0 : Date.now() - startTime,
    },
    results,
  };
}

function buildSuccessEnvelope(message, startTime, request, results) {
  return buildEnvelope({
    status: "success",
    errorCode: "OK",
    message,
    request,
    startTime,
    results,
  });
}

/**
 * @param {object} payload
 * @param {{ logFilename?: string, stderrMessage?: string }} [opts]
 */
async function finishSuccess(payload, opts = {}) {
  const { logFilename, stderrMessage } = opts;
  if (logFilename) {
    await log.taskWrite(logFilename, JSON.stringify(payload, null, 2));
  }
  await writeJson(payload);
  if (stderrMessage) {
    utils.printSuccess(stderrMessage);
  }
  process.exit(0);
}

function emitError(command, code, message, exitCode, startTime, request) {
  writeJsonAndExit(
    buildEnvelope({
      status: "error",
      errorCode: code,
      message,
      request: request || { command },
      startTime,
    }),
    exitCode,
  );
}

function emitEmpty(message, startTime, request) {
  writeJsonAndExit(
    buildEnvelope({
      status: "empty",
      errorCode: "NO_MATCH",
      message,
      request,
      startTime,
    }),
    0,
  );
}

function emitUncaught(command, error) {
  writeJsonAndExit(
    buildEnvelope({
      status: "error",
      errorCode: error.code || "UNKNOWN",
      message: error.message || "未知错误",
      request: { command },
    }),
    error.name === "AuthError" ? 3 : 1,
  );
}

module.exports = {
  writeJson,
  writeJsonAndExit,
  buildSuccessEnvelope,
  finishSuccess,
  emitError,
  emitEmpty,
  emitUncaught,
};
