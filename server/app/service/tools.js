'use strict';
const { Service } = require('egg');
const nodemailer = require('nodemailer');
const userEmail = '';
const transporter = nodemailer.createTransport({
  service: 'QQ',
  secureConnection: true, // 安全连接
  auth: {
    user: userEmail,
    pass: '',
  },
});

class ToolService extends Service {
  async sendMail(email, subject, text, html) {
    const message = {
      from: userEmail,
      // cc: userEmail,
      to: email,
      subject,
      text,
      html,
    };
    try {
      await transporter.sendMail(message);
      return true;
    } catch (err) {
      console.log(err);
      return false;
    }
  }
}
module.exports = ToolService;
