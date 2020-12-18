/* eslint valid-jsdoc: "off" */

'use strict';
const path = require('path');

/**
 * @param {Egg.EggAppInfo} appInfo app info
 */
module.exports = appInfo => {
  /**
   * built-in config
   * @type {Egg.EggAppConfig}
   **/
  const config = (exports = {});

  // use for cookie sign key, should change to your own and keep security
  config.keys = appInfo.name + '_1606811384204_6899';

  // add your middleware config here
  config.middleware = [];
  // 启用文件上传
  config.multipart = {
    mode: 'file',
    whitelist: () => true,
    // fileSize: '50mb',
    // fileExtensions: [ '.txt' ], // 增加对 txt 扩展名的文件支持
  };
  config.UPLOAD_DIR = path.resolve(__dirname, '..', 'app/public');

  // add your user config here
  const userConfig = {
    // myAppName: 'egg',
  };

  return {
    ...config,
    ...userConfig,
    security: {
      csrf: {
        enable: false,
      },
    },
    mongoose: {
      client: {
        url: 'mongodb://127.0.0.1:27017/liangs',
        options: {},
      },
    },
    jwt: {
      secret: 'liangs1234@33123',
    },
  };
};
