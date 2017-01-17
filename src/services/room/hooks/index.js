'use strict';

const globalHooks = require('../../../hooks');
const hooks = require('feathers-hooks-common');
const auth = require('feathers-authentication').hooks;
const errors = require('feathers-errors');
const jwt = require('jsonwebtoken');
const feathers = require('feathers');
const configuration = require('feathers-configuration');

const app = feathers().configure(configuration(__dirname));
const config = app.get('auth');

/**
 * Add a short room id
 */
const addShortRoomNumber = function () {
  return (hook) => {
    hook.data.id = Math.floor((Math.random() * (10000 - 1000)) + 1000);

    const token = jwt.verify(hook.params.token, config.token.secret);
    hook.data.owner = token._id;
  };
};

/**
 * Check that password is 4 digits
 */
const checkPwdFormat = function () {
  return (hook) => {
    if (hook.data.password !== undefined) {
      hook.data.password = Number.parseInt(hook.data.password, 10);

      const password = parseInt(hook.data.password, 10);
      if (password < 0 || password > 9999) {
        throw new errors.BadRequest('Password should be a number between 0000 and 9999', { password: hook.data.password });
      }
    }
  };
};

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
      },
    },
  ],
};

/**
 * Adds a subscription to this room, so user gets updates via socket.io
 */
const subscribeToRoom = function (serviceApp) {
  return (hook) => {
    const userId = jwt.verify(hook.params.token, config.token.secret)._id;
    serviceApp.service('users').patch(userId, { op: 'add', path: '/subscriptions', value: hook.result._id }, hook.params)
      .then(() => hook)
      .catch((err) => {
        console.log(err);
        return hook;
      });
  };
};

/**
 * Checks if a service was called internally
 */
const isInternal = function () {
  return function (hook) {
    return hook.params.provider === 'internal';
  };
};

exports.before = function (serviceApp) {
  return {
    all: [],
    find: [
      auth.verifyToken(),
      auth.populateUser(),
      auth.restrictToAuthenticated(),
    ],
    get: [
      globalHooks.verifyGuestToken('path'),
    ],
    create: [
      auth.verifyToken(),
      auth.populateUser(),
      auth.restrictToAuthenticated(),
      checkPwdFormat(),
      addShortRoomNumber(),
      hooks.remove('creator'),
    ],
    update: [
      auth.verifyToken(),
      auth.populateUser(),
      auth.restrictToAuthenticated(),
      globalHooks.verifyTokenForRessource(),
      checkPwdFormat(),
      hooks.remove('creator'),
      hooks.setUpdatedAt('updatedAt'),
    ],
    patch: [
      hooks.iff(!isInternal(), auth.verifyToken()),
      hooks.iff(!isInternal(), auth.populateUser()),
      hooks.iff(!isInternal(), auth.restrictToAuthenticated()),
      hooks.iff(!isInternal(), globalHooks.verifyTokenForRessource()),
      checkPwdFormat(),
      hooks.remove('creator'),
      globalHooks.jsonPatchAdd(serviceApp, 'rooms'),
      globalHooks.jsonPatchRemoveReplace(serviceApp, 'rooms'),
      hooks.setUpdatedAt('updatedAt'),
    ],
    remove: [
      auth.verifyToken(),
      auth.populateUser(),
      auth.restrictToAuthenticated(),
      globalHooks.verifyTokenForRessource(),
    ],
  };
};

exports.after = function (serviceApp) {
  return {
    all: [],
    find: [
      hooks.populate({ schema: includeSchema }),
      hooks.remove('password', 'owner'),
    ],
    get: [
      hooks.populate({ schema: includeSchema }),
      hooks.remove('password', 'owner'),
    ],
    create: [
      hooks.populate({ schema: includeSchema }),
      subscribeToRoom(serviceApp),
      hooks.remove('owner'),
    ],
    update: [
      hooks.populate({ schema: includeSchema }),
      hooks.remove('owner'),
    ],
    patch: [
      hooks.populate({ schema: includeSchema }),
      hooks.remove('owner'),
    ],
    remove: [],
  };
};



