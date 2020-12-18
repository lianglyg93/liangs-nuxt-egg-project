'use strict';
// 定制规范
const { Controller } = require('egg');
class BaseController extends Controller {
  success(data) {
    this.ctx.body = {
      commonRes: {
        isOk: true,
        code: 0,
        message: '',
      },
      info: data,
    };
  }
  message(text) {
    this.ctx.body = {
      commonRes: {
        isOk: true,
        code: 0,
        message: text,
      },
    };
  }
  error(message, code = -1) {
    this.ctx.body = {
      commonRes: {
        isOk: false,
        code,
        message,
      },
    };
  }
}
module.exports = BaseController;
