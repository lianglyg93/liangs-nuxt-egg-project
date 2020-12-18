'use strict';

const BaseController = require('./base');
const svgCaptcha = require('svg-captcha');
const fse = require('fs-extra');

class utilController extends BaseController {
  async captcha() {
    const captcha = svgCaptcha.create({
      size: 4,
      noise: 3,
      fontSize: 50,
      width: 100,
      height: 40,
    });
    this.ctx.session.captcha = captcha.text;
    this.ctx.response.type = 'image/svg+xml';
    this.ctx.body = captcha.data;
    console.log('验证码：' + captcha.text);
  }
  async sendcode() {
    const { ctx } = this;
    const email = ctx.query.email;
    const code = Math.random().toString().slice(2, 6);
    ctx.session.emailCode = code;
    const subject = 'liangs message test';
    const text = 'Plaintext version of the message';
    const html = `<p>邮箱验证码为：${code}</p>`;
    console.log(html);
    const hasSend = await this.service.tools.sendMail(
      email,
      subject,
      text,
      html
    );
    if (hasSend) {
      this.message('发送成功');
    } else {
      this.error('发送失败');
    }
  }
  async uploadfile() {
    const { ctx } = this;
    const file = ctx.request.files[0];

    fse.move(file.filepath, this.config.UPLOAD_DIR + '/' + file.filename);
    this.success({
      file: file.filename,
    });
  }
}

module.exports = utilController;
