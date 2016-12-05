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

const checkRoomCredentials = function (hook) {
  return connection.then(db => {
    const roomCollection = db.collection('rooms');
    return roomCollection.count({ id: hook.data.room }).then(res => {
      if (res == 0) {
        throw new errors.BadRequest('There is no room with this id', { room: hook.data.room });
      }
      return new Promise((resolve, reject) => {
        roomCollection.find({ id: hook.data.room }).limit(1).toArray(function(err, docs){
          if(err){
            return reject(err);
          }

          if(docs[0].password != undefined && hook.data.password == undefined){
            return reject(new errors.BadRequest('This room requires a password'));
          }

          if(docs[0].password != hook.data.password){
            return reject(new errors.BadRequest('Wrong password', { password: hook.data.password }));
          }
          resolve(hook);
        })
      })
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
  create: [checkRoomCredentials],
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
