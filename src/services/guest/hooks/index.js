'use strict';

const globalHooks = require('../../../hooks');
const MongoClient = require('mongodb').MongoClient
const ObjectId = require('mongodb').ObjectID;
const hooks = require('feathers-hooks');
const mongoose = require('mongoose');
const errors = require('feathers-errors');
const url = 'mongodb://localhost:27017/Pollson';

const connection = new Promise((resolve, reject) => {
  MongoClient.connect(url, function (err, db) {
    if (err) {
      return reject(err);
    }

    resolve(db);
  });
});

const checkRoom = function (hook) {
  return connection.then(db => {
    const roomCollection = db.collection('rooms');
    let objId = new ObjectId(hook.data.room);
    return roomCollection.count({_id: objId}).then(res => {
      if (res == 0){
        throw new errors.BadRequest('There is no room with this id', { _id: hook.data.room });
      }
    });
  });
};

exports.before = {
  all: [],
  find: [],
  get: [],
  create: [checkRoom],
  update: [],
  patch: [],
  remove: []
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
