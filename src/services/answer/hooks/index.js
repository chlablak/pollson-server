'use strict';

const globalHooks = require('../../../hooks');
const ObjectId = require('mongodb').ObjectID;
const jwt = require('jsonwebtoken');
const errors = require('feathers-errors');
const feathers = require('feathers');
const configuration = require('feathers-configuration');
const app = feathers().configure(configuration(__dirname));
const config = app.get('auth');


/**
 * Check if this user has already answered
 */
function hasAnswered (answered, id) {
  for (let i = 0; i < answered.length; ++i) {
    if (answered[i] === id) {
      return true;
    }
  }
  return false;
}

/**
 * Check that the answer given is valid
 */
const validateAnswer = function (app) {
  return function (hook) {
    if (hook.params.provider === 'rest') {
      const token = jwt.verify(hook.params.token, config.token.secret);

      return globalHooks.connection.then(db => {
        const roomCollection = db.collection('rooms');

        // find the document
        return new Promise((resolve, reject) => {
          let objId = new ObjectId(hook.data.answer);
          roomCollection.findOne({ 'questions.options._id': objId }, function (err, doc) {
            if (err) {
              return reject(err);
            }

            if (doc === undefined || doc === null) {
              return reject(new errors.BadRequest('There is no answer with this id', { answer: hook.data.answer }));
            }

            if (!doc.open) {
              return reject(new errors.BadRequest('This room is closed!'));
            }

            if (token.roomId !== undefined && doc._id.toString() !== token.roomId.toString()) {
              return reject(new errors.BadRequest('You can not access this room with this token'));
            }

            let questionIndex;
            let answerIndex;

            // for each question
            for (let i = 0; i < doc.questions.length; ++i) {
              // for each option
              for (let j = 0; j < doc.questions[i].options.length; ++j) {
                if (doc.questions[i].options[j]._id.toString() === hook.data.answer) {
                  questionIndex = i;
                  answerIndex = j;
                }
                if (hasAnswered(doc.questions[i].options[j].answered, token._id)) {
                  return reject(new errors.BadRequest('This user has already answered this question'));
                }
              }
            }

            // check if question is still open to answers
            if (!doc.questions[questionIndex].open) {
              return reject(new errors.BadRequest('This question is closed', { question: doc.question[questionIndex].text }))
            }

            // update the document
            return new Promise((resolve1, reject1) => {
              let incPath = 'questions.' + questionIndex + '.options.' + answerIndex + '.answered';
              let incQuery = {};
              incQuery[incPath] = token._id;

              /*let addPath = 'questions.' + questionIndex + '.answered';
              let addQuery = {};
              addQuery[addPath] = token._id;*/

              //console.log('here  ' + JSON.stringify(incQuery, null, 2));

              roomCollection.findOneAndUpdate({ 'questions.options._id': objId }, { $addToSet: incQuery }, function (err1, doc1) {
                if (err1) {
                  return reject(err1);
                }
                //console.log('inside: \n' + JSON.stringify(doc1, null, 2));

                let patchParams = Object.assign({}, hook.params);
                patchParams.provider = 'internal';

                app.service('rooms').patch(doc1.value._id, {}, patchParams);

                resolve(hook);
              })
            });
          });
        });
      });
    };
  };
};


exports.before = function (app) {
  return {
    all: [],
    find: [],
    get: [],
    create: [
      validateAnswer(app),
    ],
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
    create: [],
    update: [],
    patch: [],
    remove: []
  };
};
