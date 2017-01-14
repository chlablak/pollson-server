'use strict';

const globalHooks = require('../../../hooks');
const hooks = require('feathers-hooks');
const ObjectId = require('mongodb').ObjectID;
const jwt = require('jsonwebtoken');
const errors = require('feathers-errors');
const feathers = require('feathers');
const configuration = require('feathers-configuration');
const app = feathers().configure(configuration(__dirname));

function hasAnswered(answered, id) {
  for (let i = 0; i < answered.length; ++i) {
    if (answered[i] == id) {
      return true;
    }
  }
  return false;
}

const validateAnswer = function (options) {
  return function (hook) {
    let config = app.get('auth');
    let token = jwt.verify(hook.params.token, config.token.secret);

    return globalHooks.connection.then(db => {
      const roomCollection = db.collection('rooms');

      // find the document
      return new Promise((resolve, reject) => {
        let objId = new ObjectId(hook.data.answer);
        roomCollection.findOne({ "questions.options._id": objId }, function (err, doc) {
          if (err) {
            return reject(err);
          }

          if (doc === undefined || doc === null) {
            return reject(new errors.BadRequest('There is no answer with this id', { answer: hook.data.answer }));
          }

          let questionIndex, answerIndex;

          // for each question
          for (let i = 0; i < doc.questions.length; ++i) {
            // for each option
            for (let j = 0; j < doc.questions[i].options.length; ++j) {
              if (doc.questions[i].options[j]._id == hook.data.answer) {
                questionIndex = i;
                answerIndex = j;
                if (hasAnswered(doc.questions[i].answered, token._id)) {
                  return reject(new errors.BadRequest('This user has already answered this question'));
                }
              }
            }
          }

          // check if question is still open to answers
          if (!doc.questions[questionIndex].open) {
            return reject(new errors.BadRequest('This question is closed', { question: doc.question[questionIndex].text}))
          }

          // update the document
          return new Promise((resolve1, reject1) => {
            let incPath = 'questions.' + questionIndex + '.options.' + answerIndex + '.count';
            let incQuery = {};
            incQuery[incPath] = 1;

            let addPath = 'questions.' + questionIndex + '.answered';
            let addQuery = {};
            addQuery[addPath] = token._id;

            roomCollection.findOneAndUpdate({ "questions.options._id": objId }, { $inc: incQuery, $addToSet: addQuery }, function (err1, doc1) {
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
    globalHooks.verifyGuestToken('body'),
    validateAnswer()
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
