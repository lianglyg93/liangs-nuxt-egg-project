'use strict';

const BaseController = require('./base');
const svgCaptcha = require('svg-captcha');
const fse = require('fs-extra');
const path = require('path');
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
    if (Math.random() > 0.7) {
      this.ctx.state = 500;
    }
    const { ctx } = this;
    const { name, hash } = ctx.request.body;
    const file = ctx.request.files[0];
    console.log(name, hash);

    const chunkPath = path.resolve(this.config.UPLOAD_DIR, hash);
    if (!fse.existsSync(chunkPath)) {
      await fse.mkdir(chunkPath);
    }
    await fse.move(file.filepath, `${chunkPath}/${name}`);
    this.message('切片上传成功！');
    // this.success({
    //   file: file.filename,
    // });
  }
  async mergefile() {
    const { ext, size, hash } = this.ctx.request.body;
    const filePath = path.resolve(this.config.UPLOAD_DIR, `${hash}.${ext}`);
    await this.ctx.service.tools.mergeFile(filePath, hash, size);
    this.success({
      url: `/public/${hash}.${ext}`,
    });
  }
  async checkfile() {
    const { ext, hash } = this.ctx.request.body;
    const filePath = path.resolve(this.config.UPLOAD_DIR, `${hash}.${ext}`);
    let uploaded = false;
    let uploadedList = [];
    if (fse.existsSync(filePath)) {
      uploaded = true;
    } else {
      uploadedList = await this.getUploadedList(path.resolve(this.config.UPLOAD_DIR, hash));
    }
    this.success({ uploaded, uploadedList });

  }
  async getUploadedList(dirPath) {
    // .filter(name => name[0] !== '.')
    return fse.existsSync(dirPath) ? await fse.readdir(dirPath) : [];
  }
}

module.exports = utilController;
