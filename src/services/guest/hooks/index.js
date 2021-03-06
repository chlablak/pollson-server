'use strict';

const globalHooks = require('../../../hooks');
const ObjectId = require('mongodb').ObjectID;
const errors = require('feathers-errors');
const jwt = require('jsonwebtoken');
const feathers = require('feathers');
const configuration = require('feathers-configuration');

const config = feathers().configure(configuration(__dirname)).get('auth');

/**
 * Check room id/password before generating guest token
 */
const checkRoomCredentials = function () {
  return function (hook) {
    return globalHooks.connection.then((db) => {
      const roomCollection = db.collection('rooms');
      hook.data.room = Number.parseInt(hook.data.room, 10);

      return roomCollection.count({ id: hook.data.room }).then((res) => {
        if (res === 0) {
          throw new errors.BadRequest('There is no room with this id', { room: hook.data.room });
        }
        return new Promise((resolve, reject) => {
          roomCollection.findOne({ id: hook.data.room }, (err, doc) => {
            if (err) {
              return reject(err);
            }

            if (doc.password !== undefined && hook.data.password === undefined) {
              return reject(new errors.BadRequest('This room requires a password'));
            }

            if (hook.data.password !== undefined) {
              hook.data.password = Number.parseInt(hook.data.password, 10);
            }

            if (doc.password !== undefined && doc.password.toString() !== hook.data.password.toString()) {
              return reject(new errors.BadRequest('Wrong password', { password: hook.data.password }));
            }

            if (!doc.open) {
              return reject(new errors.BadRequest('This room is closed!'));
            }

            // add the long room id
            hook.data.roomId = doc._id;

            hook.data._id = new ObjectId();

            return resolve(hook);
          });
        });
      });
    });
  };
};

/**
 * Add the room to user subscriptions so he gets updates via socket.io
 */
const subscribeUser = function (app) {
  return (hook, next) => {
    // user,not guest
    if (hook.params.token !== undefined) {
      app.service('users').patch(jwt.verify(hook.params.token, config.token.secret)._id, { op: 'add', path: '/subscriptions', value: hook.data.roomId }, hook.params)
        .then(() => next())
        .catch((err) => {
          console.log(err);
          next();
        });
    } else {
      next();
    }
  };
};

exports.before = function (app) {
  return {
    all: [],
    find: [],
    get: [],
    create: [checkRoomCredentials()],
    update: [],
    patch: [],
    remove: [],
  };
};

exports.after = function (app) {
  return {
    all: [],
    find: [],
    get: [],
    create: [subscribeUser(app)],
    update: [],
    patch: [],
    remove: [],
  };
};
