'use strict';

const globalHooks = require('../../../hooks');
const hooks = require('feathers-hooks-common');
const auth = require('feathers-authentication').hooks;
const errors = require('feathers-errors');

const addData = function (options) {
  return function (hook) {

    // TODO
    // avoid collisions with same id
    hook.data.id = Math.floor(Math.random() * (10000 - 1000) + 1000);

    for(let i = 0; i < hook.data.questions.length; ++i){
      hook.data.questions[i].num = i + 1;
    }
  }
}

const checkPwdFormat = function (options) {
  return function (hook) {
    var password = parseInt(hook.data.password, 10);
    if (password < 1000 || password > 9999) {
      throw new errors.BadRequest('pwd should be a number between 1000 and 9999', { password: hook.data.password });
    }
  }
}

exports.before = {
  all: [],
  find: [globalHooks.verifyToken()],
  get: [globalHooks.verifyToken()],
  create: [
    auth.verifyToken(),
    auth.populateUser(),
    auth.restrictToAuthenticated(),
    checkPwdFormat(),
    addData()
  ],

  // TODO
  // add count ++
  update: [hooks.setUpdatedAt('updatedAt')],
  patch: [hooks.setUpdatedAt('updatedAt')],
  remove: [
    auth.verifyToken(),
    auth.populateUser(),
    auth.restrictToAuthenticated()
  ]
};

exports.after = {
  all: [],
  find: [],
  get: [],
  create: [],
  update: [],
  patch: [],
  remove: []
};



