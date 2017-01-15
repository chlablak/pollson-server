'use strict';

const errors = require('feathers-errors');
const jwt = require('jsonwebtoken');
const feathers = require('feathers');
const configuration = require('feathers-configuration');
const app = feathers().configure(configuration(__dirname));
const MongoClient = require('mongodb').MongoClient;
const ObjectId = require('mongodb').ObjectID;

exports.connection = new Promise((resolve, reject) => {
  MongoClient.connect(app.get('mongodb'), function (err, db) {
    if (err) {
      return reject(err);
    }
    return resolve(db);
  });
});

exports.verifyGuestToken = function (options) {
  return function (hook) {
    try {
      let config = app.get('auth');

      // throws err if no token is present
      let token = jwt.verify(hook.params.token, config.token.secret);

      let reqId;

      if (options === 'path') {
        reqId = hook.id;
      } else if (options === 'body') {
        reqId = hook.data.roomId;
      }

      // if this is a guest type token
      if (token.roomId !== undefined) {
        // throw err if the token is not valid for THIS room
        if (token.roomId != reqId) {
          throw new errors.BadRequest('Invalid token for this path', { token: hook.params.token });
        }
      }
    } catch (err) {
      throw err;
    }
  };
};

exports.verifyTokenForRessource = function (options) {
  return function (hook) {
    return exports.connection.then(db => {
      const roomCollection = db.collection('rooms');
      const roomId = new ObjectId(hook.id)
      return new Promise((resolve, reject) => {
        roomCollection.findOne({ _id: roomId }, function (err, doc) {
          if (err) {
            throw err
          }

          // a 404 will be generated further down
          if (doc === null) {
            return resolve();
          }

          let config = app.get('auth');
          let token = jwt.verify(hook.params.token, config.token.secret);
          if (doc.owner === token._id) {
            return resolve();
          }

          return reject(new errors.Forbidden('You do not have the rights to this room.'));
        })
      })
    })
  }
}

exports.jsonPatchAdd = function (app, serviceName) {
  return function (hook) {
    if (hook.data.path !== undefined && hook.data.op === 'add' && hook.data.value !== undefined) {
      return exports.connection.then(db => {
        let path = hook.data.path.split('/')[1];

        if (path === undefined) {
          throw new errors.BadRequest('Path must be formed like: \'/elementToAdd\'');
        }

        return app.service(serviceName).get(hook.id, hook.params)
          .then(res => {
            res.questions.push(hook.data.value);
            let data = { questions: res.questions };
            return app.service(serviceName).patch(hook.id, data, hook.params)
          })
          .then(function (res) {
          })
          .catch(function (err) {
            throw err;
          })
      })
    }
  }
}
