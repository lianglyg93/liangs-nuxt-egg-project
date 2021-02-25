
'use strict';
const { Service } = require('egg');
const path = require('path');
const fse = require('fs-extra');
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

  async mergeFile(filepPath, filehash, size) {
    const chunkdDir = path.resolve(this.config.UPLOAD_DIR, filehash); // 切片的文件夹
    let chunks = await fse.readdir(chunkdDir);
    chunks.sort((a, b) => a.split('-')[1] - b.split('-')[1]);
    chunks = chunks.map(cp => path.resolve(chunkdDir, cp));
    await this.mergeChunks(chunks, filepPath, size);
    fse.rmdirSync(chunkdDir);
  }
  async mergeChunks(files, dest, size) {
    const pipStream = (filePath, writeStream) => new Promise(resolve => {
      const readStream = fse.createReadStream(filePath);
      readStream.on('end', () => {
        fse.unlinkSync(filePath);
        resolve();
      });
      readStream.pipe(writeStream);
    });
    await Promise.all(
      files.map((file, index) => {
        return pipStream(file, fse.createWriteStream(dest, {
          start: index * size,
          end: (index + 1) * size,
        }));
      })
    );
  }
}
module.exports = ToolService;
