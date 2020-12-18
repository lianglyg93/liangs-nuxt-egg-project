'use strict';
const jwt = require('jsonwebtoken');
module.exports = ({ app }) => {
  return async function verify(ctx, next) {
    if (!ctx.request.header.authorization) {
      ctx.body = {
        commonRes: {
          isOk: false,
          code: -222,
          message: '用户未登录',
        },
      };
      return;
    }

    const token = ctx.request.header.authorization.replace('Bearer ', '');
    try {
      const ret = await jwt.verify(token, app.config.jwt.secret);
      ctx.state.email = ret.email;
      ctx.state.userid = ret._id;
      await next();
    } catch (err) {
      console.log(err);
      if (err.name === 'TokenExpiredError') {
        ctx.body = {
          commonRes: {
            isOk: false,
            code: -666,
            message: '登录过期',
          },
        };
      } else {
        ctx.body = {
          commonRes: {
            isOk: false,
            code: -1,
            message: '用户信息出错',
          },
        };
      }
    }
  };
};
