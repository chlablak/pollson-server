'use strict';

const globalHooks = require('../../../hooks');
const hooks = require('feathers-hooks-common');
const auth = require('feathers-authentication').hooks;
const errors = require('feathers-errors');
const jwt = require('jsonwebtoken');
const feathers = require('feathers');
const configuration = require('feathers-configuration');
const app = feathers().configure(configuration(__dirname));

const addCreationData = function (options) {
  return function (hook) {
    let config = app.get('auth');

    // TODO
    // avoid collisions with same id
    hook.data.id = Math.floor(Math.random() * (10000 - 1000) + 1000);

    /*let token = jwt.verify(hook.params.token, config.token.secret);
    hook.data.creator = token._id;*/
  }
}

const checkPwdFormat = function (options) {
  return function (hook) {
    var password = parseInt(hook.data.password, 10);
    if (password < 0 || password > 9999) {
      throw new errors.BadRequest('Password should be a number between 0000 and 9999', { password: hook.data.password });
    }
  }
}

exports.before = function (app) {
  return {
    all: [],
    find: [
      auth.verifyToken(),
      auth.populateUser(),
      auth.restrictToAuthenticated()
    ],
    get: [
      globalHooks.verifyGuestToken('path')
    ],
    create: [
      auth.verifyToken(),
      auth.populateUser(),
      auth.restrictToAuthenticated(),
      checkPwdFormat(),
      addCreationData(),
      auth.associateCurrentUser({ idField: '_id', as: 'creator' })
    ],
    update: [
      auth.verifyToken(),
      auth.populateUser(),
      auth.restrictToAuthenticated(),
      globalHooks.verifyTokenForRessource(),
      hooks.setUpdatedAt('updatedAt')
    ],
    patch: [
      auth.verifyToken(),
      auth.populateUser(),
      auth.restrictToAuthenticated(),
      globalHooks.verifyTokenForRessource(),
      globalHooks.jsonPatchAdd(app, 'rooms'),
      hooks.setUpdatedAt('updatedAt')
    ],
    remove: [
      auth.verifyToken(),
      auth.populateUser(),
      auth.restrictToAuthenticated(),
      globalHooks.verifyTokenForRessource()
    ]
  };
};

exports.after = function (app) {
  return {
    all: [],
    find: [
      hooks.remove('password')
    ],
    get: [
      hooks.remove('password')
    ],
    create: [],
    update: [],
    patch: [],
    remove: []
  };
};



