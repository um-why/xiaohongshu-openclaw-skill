const https = require("https");
const querystring = require("querystring");
const constants = require("../config/constants");
const { withRetry } = require("./retry");
const {
  SkillError,
  ApiError,
  NetworkError,
  TimeoutError,
  AuthError,
} = require("./errors");
const utils = require("./utils");
const { skillName } = require("./name");

async function request(options, data = null) {
  return new Promise((resolve, reject) => {
    let timedOut = false;
    let settled = false;
    const finish = (fn, value) => {
      if (settled || timedOut) return;
      settled = true;
      fn(value);
    };

    const req = https.request(
      { ...options, timeout: constants.REQUEST_TIMEOUT },
      (res) => {
        res.setEncoding("utf-8");
        res.on("error", (err) => {
          finish(reject, new NetworkError(`响应流错误: ${err.message}`));
        });
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => {
          if (timedOut || settled) return;
          if (res.statusCode === 200) {
            try {
              const jsonBody = JSON.parse(body);
              if (typeof jsonBody.errcode !== "number") {
                finish(
                  reject,
                  new ApiError("API_ERROR", "接口响应缺少有效的 errcode", true),
                );
              } else if (jsonBody.errcode === 0) {
                finish(resolve, jsonBody);
              } else if (
                jsonBody.errcode === 401 ||
                jsonBody.errcode === 403
              ) {
                const e = new AuthError(
                  "GUAIKEI_API_TOKEN 无效, 请检查环境变量 或 通过 www.guaikei.com 联系客服获取解决方案",
                );
                e.noRetry = true;
                finish(reject, e);
              } else {
                finish(
                  reject,
                  new ApiError(
                    jsonBody.errcode.toString(),
                    jsonBody.errmsg || "请求失败",
                    jsonBody.errcode >= 10,
                  ),
                );
              }
            } catch (parseError) {
              finish(
                reject,
                new NetworkError(`响应解析失败: ${parseError.message}`),
              );
            }
          } else if (res.statusCode === 401 || res.statusCode === 403) {
            const e = new AuthError(
              "GUAIKEI_API_TOKEN 无效, 请检查环境变量 或 通过 www.guaikei.com 联系客服获取解决方案",
            );
            e.noRetry = true;
            finish(reject, e);
          } else {
            const status = res.statusCode;
            const code =
              status >= 500 && status <= 599 ? "HTTP_5xx" : `HTTP_${status}`;
            finish(
              reject,
              new ApiError(code, `请求失败, 状态码: ${status}`, true),
            );
          }
        });
      },
    );

    req.on("error", (err) => {
      if (timedOut || settled) return;
      if (err.code === "ETIMEDOUT" || err.code === "ECONNRESET") {
        finish(reject, new TimeoutError("请求超时或连接被重置"));
      } else {
        finish(reject, new NetworkError(`网络错误: ${err.message}`));
      }
    });

    req.on("timeout", () => {
      if (settled) return;
      timedOut = true;
      settled = true;
      req.destroy();
      reject(new TimeoutError(`请求超时 (${constants.REQUEST_TIMEOUT}ms)`));
    });

    if (data) req.write(data);
    req.end();
  });
}

async function postJson(path, params, data, token) {
  if (!path || typeof path !== "string") {
    throw new SkillError("PATH_INVALID", "path 必须是非空字符串", true);
  }
  if (!params || typeof params !== "object") {
    throw new SkillError("PARAM_INVALID", "params 必须是对象", true);
  }
  if (!data || typeof data !== "object") {
    throw new SkillError("DATA_INVALID", "data 必须是对象", true);
  }
  params.skill_name = skillName();

  const fullPath = `${path}?${querystring.stringify(params)}`;
  const jsonData = JSON.stringify(data);
  const options = {
    host: constants.BASE_URL,
    path: fullPath,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept-Encoding": "identity",
      "Content-Length": Buffer.byteLength(jsonData),
      TOKEN: token,
    },
  };
  return await request(options, jsonData);
}

async function getJson(path, params, token) {
  if (!path || typeof path !== "string") {
    throw new SkillError("PATH_INVALID", "path 必须是非空字符串", true);
  }
  if (!params || typeof params !== "object") {
    throw new SkillError("PARAM_INVALID", "params 必须是对象", true);
  }
  params._ = Date.now();
  params.skill_name = skillName();

  const fullPath = `${path}?${querystring.stringify(params)}`;
  const options = {
    host: constants.BASE_URL,
    path: fullPath,
    method: "GET",
    headers: { "Accept-Encoding": "identity", TOKEN: token },
  };
  return await request(options);
}

/**
 * 创建任务等一次性请求。网络和超时会重试；业务错误码 >= 10 不重试。
 * @param {string} method
 * @param {string} path
 * @param {object} params
 * @param {object} data
 * @param {string} token
 * @param {number} maxAttempts
 * @param {string} actionName
 * @returns {Promise<object>}
 */
async function requestApi(
  method,
  path,
  params,
  data,
  token,
  maxAttempts,
  actionName,
) {
  return await withRetry(
    async () => {
      if (method === "POST") {
        return await postJson(path, params, data, token);
      }
      return await getJson(path, params, token);
    },
    maxAttempts,
    (attempt, err) => {
      utils.printError(
        `【${actionName}重试】 ${attempt + 1}/${maxAttempts} 次 - ${err.message}`,
      );
    },
  );
}

/**
 * 查询接口的轮询分类。
 * 后端在任务未完成时返回 errcode 1（处理中, 请稍后）；errcode 0 才表示已完成。
 * 其它业务错误立即失败。网络和超时错误可以继续查。
 * @param {Error} error
 * @returns {"pending"|"fail"|"retry"}
 */
function classifyPollError(error) {
  if (error && String(error.code) === "1") {
    return "pending";
  }
  if (
    error &&
    (error.noRetry || error.name === "ApiError" || error.name === "AuthError")
  ) {
    return "fail";
  }
  return "retry";
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 轮询任务结果。次数使用 QUERY_MAX_ATTEMPTS。
 * 两次查询之间的等待从 RETRY_INTERVAL 起按 2、4、8 秒翻倍，单次最长 60 秒。
 * 次数用尽仍是「处理中」时抛出 TIMEOUT，不把未完成当成空结果。
 * @param {string} path
 * @param {object} params
 * @param {string} token
 * @param {string} actionName
 * @returns {Promise<object>}
 */
async function pollTaskResult(path, params, token, actionName) {
  const maxAttempts = constants.QUERY_MAX_ATTEMPTS;
  let lastError;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await getJson(path, params, token);
    } catch (error) {
      lastError = error;
      const kind = classifyPollError(error);
      if (kind === "fail") throw error;
      if (kind === "pending") {
        utils.printInfo(
          `【${actionName}】处理中 ${attempt + 1}/${maxAttempts}`,
        );
      } else {
        utils.printError(
          `【${actionName}重试】 ${attempt + 1}/${maxAttempts} 次 - ${error.message}`,
        );
      }
      if (attempt < maxAttempts - 1) {
        const delay = Math.min(constants.RETRY_INTERVAL * 2 ** attempt, 60000);
        await sleep(delay);
      }
    }
  }
  if (classifyPollError(lastError) === "pending") {
    throw new SkillError("TIMEOUT", "任务仍在处理中, 请稍后重试", true);
  }
  throw (
    lastError || new SkillError("TIMEOUT", "任务仍在处理中, 请稍后重试", true)
  );
}

module.exports = {
  getJson,
  postJson,
  requestApi,
  pollTaskResult,
  classifyPollError,
};
