/**
 * stdout 信封。错误和空结果刷出后再退出；成功只打印，方便随后写日志。
 */
const constants = require("../config/constants");
const { formatBeijingTime } = require("./time");

/**
 * 把 JSON 写到 stdout，刷出后再按退出码结束。
 * 避免管道场景下进程先退出、调用方读到空输出。
 * @param {object} payload
 * @param {number} exitCode
 */
function writeJsonAndExit(payload, exitCode) {
  const text = JSON.stringify(payload, null, 2) + "\n";
  let exited = false;
  const done = () => {
    if (exited) return;
    exited = true;
    process.exit(exitCode);
  };
  process.stdout.once("error", done);
  process.stdout.write(text, done);
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

function printSuccessEnvelope(message, startTime, request, results) {
  const payload = buildEnvelope({
    status: "success",
    errorCode: "OK",
    message,
    request,
    startTime,
    results,
  });
  const text = JSON.stringify(payload, null, 2);
  process.stdout.write(text + "\n");
  return { payload, text };
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
  writeJsonAndExit,
  emitError,
  emitEmpty,
  printSuccessEnvelope,
  emitUncaught,
};
