'use strict';

const globalHooks = require('../../../hooks');
const ObjectId = require('mongodb').ObjectID;
const errors = require('feathers-errors');

/**
 * Check room id/password before generating guest token
 */
const checkRoomCredentials = function (options) {
  return function (hook) {
    return globalHooks.connection.then(db => {
      const roomCollection = db.collection('rooms');
      return roomCollection.count({ id: hook.data.room }).then(res => {
        if (res === 0) {
          throw new errors.BadRequest('There is no room with this id', { room: hook.data.room });
        }
        return new Promise((resolve, reject) => {
          roomCollection.findOne({ id: hook.data.room }, function (err, doc) {
            if (err) {
              return reject(err);
            }

            if (doc.password != undefined && hook.data.password == undefined) {
              return reject(new errors.BadRequest('This room requires a password'));
            }

            if (doc.password != hook.data.password) {
              return reject(new errors.BadRequest('Wrong password', { password: hook.data.password }));
            }

            if (!doc.open) {
              return reject(new errors.BadRequest('This room is closed!'))
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
 * Add the short room id
 */
const addRoomId = function (options) {
  return function (hook) {
    return globalHooks.connection.then(db => {
      const roomCollection = db.collection('rooms');
      return new Promise((resolve, reject) => {
        roomCollection.find({ id: hook.data.room }).limit(1).toArray(function (err, docs) {
          if (err) {
            return reject(err);
          }
          hook.result._id = docs[0]._id;
          return resolve(hook)
        });
      });
    });
  };
};

exports.before = {
  all: [],
  find: [],
  get: [],
  create: [checkRoomCredentials()],
  update: [],
  patch: [],
  remove: []
};

exports.after = {
  all: [],
  find: [],
  get: [],
  create: [addRoomId()],
  update: [],
  patch: [],
  remove: []
};
