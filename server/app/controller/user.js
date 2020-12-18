'use strict';

const md5 = require('md5');
const jwt = require('jsonwebtoken');

const BaseController = require('./base');
const HashSalt = 'lianghash@12314';
const creatRules = {
  email: 'string', // 自定义的校验规则
  passwd: 'password', // 自带的校验规则
  nickname: 'string',
  captcha: 'string',
};
class UserController extends BaseController {
  async login() {
    // 登录
    const { ctx, app } = this;
    const { captcha, email, passwd, emailCode } = ctx.request.body;
    // 检验验证码
    if (captcha.toLowerCase() !== ctx.session.captcha.toLowerCase()) {
      return this.error('验证码错误！');
    }
    if (emailCode !== ctx.session.emailCode) {
      return this.error('邮箱验证码错误！');
    }
    const user = await ctx.model.User.findOne({ email, passwd: md5(passwd + HashSalt) });
    if (!user) {
      return this.error('邮箱或密码错误！');
    }
    const token = jwt.sign({ _id: user._id, email }, app.config.jwt.secret, {
      expiresIn: '100h',
    });
    return this.success({
      token,
      email,
    });
  }
  async register() {
    const { ctx } = this;
    // 注册
    try {
      ctx.validate(creatRules);
    } catch (e) {
      return this.error('校验失败！', -1, e.errors);
    }
    const { captcha, email, nickname, passwd } = ctx.request.body;
    // 检验验证码
    if (captcha.toLowerCase() !== ctx.session.captcha.toLowerCase()) {
      return this.error('验证码错误！');
    }
    // 判断邮箱是否存在
    if (await this.checkEmail(email)) {
      return this.error('邮箱已存在！');
    }
    const results = await ctx.model.User.create({
      email,
      nickname,
      passwd: md5(passwd + HashSalt),
    });
    if (results._id) {
      this.success({ info: '2312131' });
    }
  }

  // 校验邮箱是否存在
  async checkEmail(email) {
    const info = await this.ctx.model.User.findOne({ email });
    return info;
  }
  async info() {
    // 用户信息
    const { ctx } = this;
    const { email } = ctx.state;
    const user = await this.checkEmail(email);
    this.success(user);
  }
}
module.exports = UserController;
