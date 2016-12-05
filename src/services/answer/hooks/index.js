'use strict';

const globalHooks = require('../../../hooks');
const hooks = require('feathers-hooks');
const MongoClient = require('mongodb').MongoClient;
const ObjectId = require('mongodb').ObjectID;
const jwt = require('jsonwebtoken');
const errors = require('feathers-errors');
const feathers = require('feathers');
const configuration = require('feathers-configuration');
const app = feathers().configure(configuration(__dirname));


const connection = new Promise((resolve, reject) => {
  MongoClient.connect(app.get('mongodb'), function (err, db) {
    if (err) {
      return reject(err);
    }
    resolve(db);
  });
});

const addAnswer = function (options) {
  return function (hook) {
    let config = app.get('auth');
    let token = jwt.verify(hook.params.token, config.token.secret);

    return connection.then(db => {
      const roomCollection = db.collection('rooms');

      // find the document
      return new Promise((resolve, reject) => {
        let objId = new ObjectId(hook.data.answer);
        roomCollection.find({ "questions.options._id": objId }).limit(1).toArray(function (err, docs) {
          if (err) {
            return reject(err);
          }

          if (docs.length == 0) {
            return reject(new errors.BadRequest('There is no answer with this id', { answer: hook.data.answer }));
          }

          let index1, index2;

          // for each question
          for (let i = 0; i < docs[0].questions.length; ++i) {
            // for each option
            for (let j = 0; j < docs[0].questions[i].options.length; ++j) {
              if (docs[0].questions[i].options[j]._id == hook.data.answer) {
                index1 = i;
                index2 = j;
              }
            }
          }

          // update the document
          return new Promise((resolve1, reject1) => {
            let incPath = 'questions.' + index1 + '.options.' + index2 + '.count';
            let incQuery = {};
            incQuery[incPath] = 1;

            let addPath = 'questions.' + index1 + '.answered';
            let addQuery = {};
            addQuery[addPath] = token._id;

            roomCollection.findOneAndUpdate({ "questions.options._id": objId }, { $inc: incQuery, $addToSet: addQuery }, function (err1, doc) {
              if (err1) {
                return reject(err1);
              }
              resolve(hook);
            })
          });
        });
      });
    });
  };
};


exports.before = {
  all: [],
  find: [],
  get: [],
  create: [
    globalHooks.verifyToken('body'),
    addAnswer()
  ],
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
