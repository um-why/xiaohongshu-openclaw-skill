/**
 * 小红书笔记详情和评论模块
 */
const https = require("https");
const querystring = require("querystring");
const BASE_URL = "www.guaikei.com";
const utils = require("./utils");

/**
 * 检查笔记链接是否符合要求
 */
function notIdealFormat(url) {
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

async function createWithRetry(token, url) {
  let lastError = null;
  const retryIntervals = [1000, 2000, 3000];
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error(`创建任务超时 (${attempt + 1}/3)`)),
          10000,
        ),
      );
      const task = await Promise.race([
        createDetailTask(token, url),
        timeoutPromise,
      ]);
      if (task.errcode === 0) return task;
      throw new Error(`创建任务失败, 错误信息: ${JSON.stringify(task.errmsg)}`);
    } catch (error) {
      lastError = error;
      utils.printInfo(
        `【创建任务重试】 ${attempt + 1}/3 次 - ${error.message}`,
      );
      if (attempt < 2) {
        await new Promise((resolve) =>
          setTimeout(resolve, retryIntervals[attempt]),
        );
      }
    }
  }
  throw lastError || new Error("创建搜索任务失败, 3次重试均失败");
}

/**
 * 创建小红书笔记详情及评论任务
 * @param {string} token - API令牌
 * @param {string} note - 笔记链接
 * @returns {Promise<Object>} 详情任务状态
 * @throws {Error} API调用失败时抛出错误
 */
async function createDetailTask(token, note) {
  return new Promise((resolve, reject) => {
    const url = "/api/xiaohongshu/detail/url";
    const params = { _: Date.now(), token: token };
    const data = JSON.stringify({ url: note });
    const options = {
      hostname: BASE_URL,
      path: url + "?" + querystring.stringify(params),
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(data),
      },
      timeout: 20000,
    };
    const req = https.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => {
        body += chunk;
      });
      res.on("end", () => {
        if (res.statusCode === 200) {
          try {
            const json = JSON.parse(body);
            if (json.errcode === 0) {
              resolve(json);
            } else {
              reject(new Error(`请求错误信息: ${json.errmsg}`));
              return;
            }
          } catch (error) {
            reject(new Error(`解析响应失败: ${error.message}`));
            return;
          }
        } else if (
          res.statusCode === 401 ||
          res.statusCode === 407 ||
          res.statusCode === 403 ||
          res.statusCode === 410 ||
          res.statusCode === 408
        ) {
          reject(new Error(`GUAIKEI_API_TOKEN 无效, 请检查环境变量`));
        } else {
          reject(new Error(`请求失败, 状态码: ${res.statusCode}`));
        }
      });
    });
    req.on("error", (err) => {
      reject(err);
    });
    req.write(data);
    req.end();
  });
}

async function detailWithRetry(token, url) {
  let lastError = null;
  const maxAttempts = 60;
  const retryInterval = 2000;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error(`查询结果超时 (${attempt + 1}/${maxAttempts})`));
        }, 5000);
      });
      const data = await Promise.race([
        getDetailTask(token, url),
        timeoutPromise,
      ]);
      if (data.id) return data;
      throw new Error(`第 ${attempt + 1} 次查询无结果`);
    } catch (error) {
      lastError = error;
      utils.printInfo(
        `【查询结果重试】尝试 ${attempt + 1} / ${maxAttempts} - ${error.message}`,
      );
      await new Promise((resolve) => setTimeout(resolve, retryInterval));
    }
  }
  throw lastError || new Error(`查询详情结果失败, ${maxAttempts}次重试均失败`);
}

/**
 * 获取小红书笔记详情及评论任务结果
 * @param {string} token - API令牌
 * @param {string} note - 笔记链接
 * @returns {Promise<Array>} 详情结果数组
 * @throws {Error} API调用失败时抛出错误
 */
async function getDetailTask(token, note) {
  return new Promise((resolve, reject) => {
    const url = "/api/xiaohongshu/detail/info";
    const params = {
      _: Date.now(),
      token: token,
      url: note,
    };
    const options = {
      hostname: BASE_URL,
      path: url + "?" + querystring.stringify(params),
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      timeout: 20000,
    };
    const req = https.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => {
        body += chunk;
      });
      res.on("end", () => {
        if (res.statusCode === 200) {
          try {
            const json = JSON.parse(body);
            if (json.errcode === 0) {
              if (json.data.id && json.data.xsec_token) {
                json.data.url =
                  "https://www.xiaohongshu.com/explore/" +
                  json.data.id +
                  "?xsec_token=" +
                  json.data.xsec_token;
              }
              if (
                json.data.user &&
                json.data.user.user_id &&
                json.data.user.xsec_token
              ) {
                json.data.user.url =
                  "https://www.xiaohongshu.com/user/profile/" +
                  json.data.user.user_id +
                  "?xsec_token=" +
                  json.data.user.xsec_token;
              }
              resolve(json.data);
            } else {
              reject(new Error(`请求错误信息: ${json.errmsg}`));
              return;
            }
          } catch (error) {
            reject(new Error(`解析响应失败: ${error.message}`));
            return;
          }
        } else if (
          res.statusCode === 401 ||
          res.statusCode === 407 ||
          res.statusCode === 403 ||
          res.statusCode === 410 ||
          res.statusCode === 408
        ) {
          reject(new Error(`GUAIKEI_API_TOKEN 无效, 请检查环境变量`));
        } else {
          reject(new Error(`请求失败, 状态码: ${res.statusCode}`));
        }
      });
    });
    req.on("error", (err) => {
      reject(err);
    });
    req.end();
  });
}

module.exports = {
  notIdealFormat,
  createWithRetry,
  detailWithRetry,
};
