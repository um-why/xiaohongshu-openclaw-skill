/**
 * 统一错误。noRetry 为 true 时不再重试。
 */

class SkillError extends Error {
  constructor(code, message, noRetry = false) {
    super(message);
    this.code = code;
    this.name = "SkillError";
    this.noRetry = noRetry;
    Error.captureStackTrace(this, this.constructor);
  }
}

class ApiError extends SkillError {
  constructor(code, message, noRetry = false) {
    super(code, message, noRetry);
    this.name = "ApiError";
  }
}

class NetworkError extends SkillError {
  constructor(message) {
    super("NETWORK_ERROR", message);
    this.name = "NetworkError";
  }
}

class TimeoutError extends SkillError {
  constructor(message) {
    super("TIMEOUT", message);
    this.name = "TimeoutError";
  }
}

class AuthError extends SkillError {
  constructor(message) {
    super("AUTH_ERROR", message);
    this.name = "AuthError";
  }
}

module.exports = {
  SkillError,
  ApiError,
  NetworkError,
  TimeoutError,
  AuthError,
};
