'use strict';

const BaseController = require('./base');

class ArticleController extends BaseController {

  async create() {
    this.success({ user: 11 });
  }
}
module.exports = ArticleController;
