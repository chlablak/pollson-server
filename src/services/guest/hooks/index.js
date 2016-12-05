'use strict';

const globalHooks = require('../../../hooks');
const hooks = require('feathers-hooks');
const mongoose = require('mongoose');
const MongoClient = require('mongodb').MongoClient
const ObjectId = require('mongodb').ObjectID;
const errors = require('feathers-errors');
const feathers = require('feathers')
const configuration = require('feathers-configuration')
const app = feathers().configure(configuration(__dirname))


const connection = new Promise((resolve, reject) => {
  MongoClient.connect(app.get('mongodb'), function (err, db) {
    if (err) {
      return reject(err);
    }
    resolve(db);
  });
});

const checkRoomExists = function (hook) {
  return connection.then(db => {
    const roomCollection = db.collection('rooms');
    return roomCollection.count({ id: hook.data.room }).then(res => {
      if (res == 0) {
        throw new errors.BadRequest('There is no room with this id', { _id: hook.data.room });
      }
    });
  });
};

const addRoomId = function (hook) {
  return connection.then(db => {
    const roomCollection = db.collection('rooms');
    return new Promise((resolve, reject) => {
      roomCollection.find({ id: hook.data.room }).limit(1).toArray(function (err, docs){
      if(err){
        return reject(err);
      }
      hook.result._id = docs[0]._id;
      resolve(hook)
    });
    });
  });
}

exports.before = {
  all: [],
  find: [],
  get: [],
  create: [checkRoomExists],
  update: [],
  patch: [],
  remove: []
};

exports.after = {
  all: [],
  find: [],
  get: [],
  create: [addRoomId],
  update: [],
  patch: [],
  remove: []
};
