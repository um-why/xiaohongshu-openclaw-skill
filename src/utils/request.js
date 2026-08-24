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
                let err;
                if (jsonBody?.errcode <= 16) {
                  err = new Error(jsonBody?.errmsg || "请求失败");
                } else {
                  err = new Error(jsonBody?.errmsg || "请求失败");
                  err.nonRetryable = true;
                }
                err.code = "ERRCODE_" + (jsonBody?.errcode || "UNKNOWN");
                reject(err);
              }
            } catch (error) {
              reject(new Error(`响应解析失败: ${error.message}`));
            }
          } else if (res.statusCode === 401 || res.statusCode === 403) {
            const err = new Error(
              `GUAIKEI_API_TOKEN 无效, 请检查环境变量 或 通过 www.guaikei.com 获取解决方案`,
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
      },
    );
    req.on("error", (err) => {
      if (timedOut) return;
      const wrapped = new Error(`网络错误: ${err.message}`);
      wrapped.code = err.code || "NETWORK_ERROR";
      wrapped.nonRetryable = false;
      reject(wrapped);
    });
    req.on("timeout", () => {
      timedOut = true;
      req.destroy();
      const err = new Error("请求超时");
      err.code = "TIMEOUT";
      reject(err);
    });
    if (data) req.write(data);
    req.end();
  });
}

async function postJson(path, params, data, token) {
  if (!path || typeof path !== "string") {
    throw new Error("path 必须是非空字符串");
  }
  if (!params || typeof params !== "object") {
    throw new Error("params 必须是对象");
  }
  if (!data || typeof data !== "object") {
    throw new Error("data 必须是对象");
  }
  if (!token || typeof token !== "string") {
    throw new Error("token 必须是非空字符串");
  }
  params.skill_name = skillName();
  const fullPath = `${path}?${querystring.stringify(params)}`;
  const jsonData = JSON.stringify(data);
  const options = {
    host: constants.BASE_URL,
    path: fullPath,
    method: "POST",
    headers: {
      TOKEN: token,
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(jsonData),
    },
  };
  return await request(options, jsonData);
}

async function getJson(path, params, token) {
  if (!path || typeof path !== "string") {
    throw new Error("path 必须是非空字符串");
  }
  if (!params || typeof params !== "object") {
    throw new Error("params 必须是对象");
  }
  if (!token || typeof token !== "string") {
    throw new Error("token 必须是非空字符串");
  }
  params._ = Date.now();

  const fullPath = `${path}?${querystring.stringify(params)}`;
  const options = {
    host: constants.BASE_URL,
    path: fullPath,
    method: "GET",
    headers: {
      TOKEN: token,
      "Content-Type": "application/json",
    },
  };
  return await request(options);
}

module.exports = { getJson, postJson };
