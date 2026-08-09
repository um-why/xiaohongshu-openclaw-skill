const https = require("https");
const querystring = require("querystring");
const constants = require("../config/constants");
const utils = require("./utils");
const { skillName } = require("./name");

async function request(options, data = null) {
  return new Promise((resolve, reject) => {
    let timedOut = false;

    const req = https.request(
      { ...options, timeout: constants.REQUEST_TIMEOUT },
      (res) => {
        res.setEncoding("utf-8");
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => {
          if (timedOut) return;
          if (res.statusCode === 200) {
            try {
              const jsonBody = JSON.parse(body);
              if (jsonBody.errcode === 0) {
                resolve(jsonBody);
              } else {
                const err = new Error(jsonBody.errmsg || "请求失败");
                err.code = "ERRCODE_" + jsonBody.errcode;
                reject(err);
                return;
              }
            } catch (error) {
              reject(new Error(`响应解析失败: ${error.message}`));
            }
          } else if (res.statusCode === 401 || res.statusCode === 403) {
            const err = new Error(
              `GUAIKEI_API_TOKEN 无效, 请检查环境变量 或 联系微信: 13395823479 获取解决方案`,
            );
            err.nonRetryable = true;
            err.statusCode = res.statusCode;
            err.code = res.statusCode;
            reject(err);
          } else {
            const err = new Error(`请求失败, 状态码: ${res.statusCode}`);
            err.nonRetryable =
              res.statusCode >= 400 &&
              res.statusCode < 500 &&
              res.statusCode !== 429;
            err.statusCode = res.statusCode;
            err.code = res.statusCode;
            reject(err);
          }
        });
        res.on("error", (err) => {
          if (timedOut) return;
          reject(new Error(`响应错误: ${err.message}`));
        });
      },
    );
    req.on("error", (err) => {
      if (timedOut) return;
      if (err.code === "ETIMEDOUT" || err.code === "ECONNRESET") {
        reject(new Error("请求超时或连接被重置"));
      } else {
        reject(new Error(`网络错误: ${err.message}`));
      }
    });
    req.on("timeout", () => {
      timedOut = true;
      req.destroy();
      reject(new Error("请求超时"));
    });
    if (data) req.write(data);
    req.end();
  });
}

async function postJson(path, params, data) {
  if (!path || typeof path !== "string") {
    throw new Error("path 必须是非空字符串");
  }
  if (!params || typeof params !== "object") {
    throw new Error("params 必须是对象");
  }
  if (!data || typeof data !== "object") {
    throw new Error("data 必须是对象");
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
      "Content-Length": Buffer.byteLength(jsonData),
    },
  };
  return await request(options, jsonData);
}

async function getJson(path, params) {
  if (!path || typeof path !== "string") {
    throw new Error("path 必须是非空字符串");
  }
  if (!params || typeof params !== "object") {
    throw new Error("params 必须是对象");
  }
  params._ = Date.now();

  const fullPath = `${path}?${querystring.stringify(params)}`;
  const options = {
    host: constants.BASE_URL,
    path: fullPath,
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  };
  return await request(options);
}

module.exports = { getJson, postJson };
