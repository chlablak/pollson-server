'use strict';

const globalHooks = require('../../../hooks');
const hooks = require('feathers-hooks-common');
const auth = require('feathers-authentication').hooks;
const errors = require('feathers-errors');
const jwt = require('jsonwebtoken');
const feathers = require('feathers');
const configuration = require('feathers-configuration');
const app = feathers().configure(configuration(__dirname));

/**
 * Add a short room id
 */
const addShortRoomNumber = function (options) {
  return function (hook) {
    // TODO
    // avoid collisions with same id
    hook.data.id = Math.floor(Math.random() * (10000 - 1000) + 1000);

    let config = app.get('auth');
    let token = jwt.verify(hook.params.token, config.token.secret);
    hook.data.owner = token._id;
  }
}

/**
 * Check that password is 4 digits
 */
const checkPwdFormat = function (options) {
  return function (hook) {
    hook.data.password = Number.parseInt(hook.data.password);
    let password = parseInt(hook.data.password, 10);
    if (password < 0 || password > 9999) {
      throw new errors.BadRequest('Password should be a number between 0000 and 9999', { password: hook.data.password });
    }
  }
}

/**
 * Used to include creator's email
 */
const includeSchema = {
  include: [
    {
      service: 'users',
      nameAs: 'creator',
      parentField: 'owner',
      childField: '_id',
      query: {
        $select: ['_id', 'email']
      }
    }
  ]
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
      addShortRoomNumber(),
      hooks.remove('creator')
    ],
    update: [
      auth.verifyToken(),
      auth.populateUser(),
      auth.restrictToAuthenticated(),
      globalHooks.verifyTokenForRessource(),
      hooks.remove('creator'),
      hooks.setUpdatedAt('updatedAt')
    ],
    patch: [
      auth.verifyToken(),
      auth.populateUser(),
      auth.restrictToAuthenticated(),
      globalHooks.verifyTokenForRessource(),
      hooks.remove('creator'),
      globalHooks.jsonPatchAdd(app, 'rooms'),
      globalHooks.jsonPatchRemoveReplace(app, 'rooms'),
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
      hooks.populate({ schema: includeSchema }),
      hooks.remove('password', 'owner')
    ],
    get: [
      hooks.populate({ schema: includeSchema }),
      hooks.remove('password', 'owner')
    ],
    create: [
      hooks.populate({ schema: includeSchema }),
      hooks.remove('owner')
    ],
    update: [
      hooks.populate({ schema: includeSchema }),
      hooks.remove('owner')
    ],
    patch: [
      hooks.populate({ schema: includeSchema }),
      hooks.remove('owner')
    ],
    remove: []
  };
};



