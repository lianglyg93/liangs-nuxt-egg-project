'use strict';

/**
 * @param {Egg.Application} app - egg application
 */
module.exports = app => {
  const { router, controller } = app;
  const jwt = app.middleware.jwt({ app });
  router.get('/', controller.home.index);
  router.get('/captcha', controller.util.captcha);
  router.get('/sendcode', controller.util.sendcode);
  router.post('/uploadfile', controller.util.uploadfile);
  router.post('/mergefile', controller.util.mergefile);
  router.post('/checkfile', controller.util.checkfile);
  router.group({ name: 'user', prefix: '/user' }, router => {
    const { login, register, info } = controller.user;
    router.post('/login', login);
    router.post('/register', register);
    // router.get('/verify', verify);
    router.get('/info', jwt, info);
  });
  router.group({ name: 'article', prefix: '/article' }, router => {
    const { create } = controller.article;
    router.post('/create', create);
  });
};
