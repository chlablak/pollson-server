'use strict';

const globalHooks = require('../../../hooks');
const hooks = require('feathers-hooks-common');
const auth = require('feathers-authentication').hooks;
const errors = require('feathers-errors');

const addData = function (options) {
  return function (hook) {
    hook.data.id = Math.floor(Math.random() * (10000 - 1000) + 1000);

    // TODO
    // add options number
  }
}

const checkPwdFormat = function (options) {
  return function (hook) {
    var pwd = parseInt(hook.data.pwd, 10);
    if (pwd < 1000 || pwd > 9999) {
      throw new errors.BadRequest('pwd should be a number between 1000 and 9999', { pwd: hook.data.pwd });
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



