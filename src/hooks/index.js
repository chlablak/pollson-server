'use strict';

const errors = require('feathers-errors');
const jwt = require('jsonwebtoken');
const feathers = require('feathers');
const configuration = require('feathers-configuration');
const app = feathers().configure(configuration(__dirname));
const MongoClient = require('mongodb').MongoClient;
const ObjectId = require('mongodb').ObjectID;
const config = app.get('auth');


/**
 * DB connection used by many hooks to access data
 */
exports.connection = new Promise((resolve, reject) => {
  MongoClient.connect(app.get('mongodb'), function (err, db) {
    if (err) {
      return reject(err);
    }
    return resolve(db);
  });
});

/**
 * Verify the guest's token
 */
exports.verifyGuestToken = function (options) {
  return function (hook) {
    if (hook.params.provider === 'rest') {
      try {
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
          if (token.roomId !== reqId) {
            throw new errors.BadRequest('Invalid token for this path', { token: hook.params.token });
          }
        }
      } catch (err) {
        throw err;
      }
    };
  };
};

/**
 * Verify the token for this ressource
 */
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

          let token = jwt.verify(hook.params.token, config.token.secret);

          if (doc.owner.toString() === token._id) {
            return resolve();
          }

          return reject(new errors.Forbidden('You do not have the rights to this room.'));
        })
      })
    })
  }
}

/**
 * Adds jsonPatch functionnality to add elements to an array
 */
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
            res[path].push(hook.data.value);
            let data = {};
            data[path] = res[path];
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

exports.jsonPatchRemoveReplace = function (app, serviceName) {
  return function (hook) {
    if (hook.data.path !== undefined && (hook.data.op === 'remove' || hook.data.op === 'replace') && hook.data.value !== undefined) {
      return exports.connection.then(db => {
        let path = hook.data.path.split('/')[1];

        if (path === undefined) {
          throw new errors.BadRequest('Path must be formed like: \'/elementToRemove\'');
        }

        hook.params.query = { $limit: '100' };

        return app.service(serviceName).find(hook.params).then(res => {
          for (let i = 0; i < res.data.length; ++i) {
            for (let j = 0; j < res.data[i][path].length; ++j) {
              if (res.data[i][path][j]._id.toString() === hook.data.value._id) {
                return res.data[i];
              }
            }
          }
          throw new errors.BadRequest('Wrong \'value\' input');
        })
          .then(res => {
            let index = -1;
            for (let i = 0; i < res[path].length; ++i) {
              if (res[path][i]._id.toString() === hook.data.value._id) {
                index = i;
              }
            }

            if (hook.data.op === 'remove') {
              res[path].splice(index, 1);
            } else if (hook.data.op === 'replace') {
              res[path][index].open = hook.data.value.open
            }

            let data = {};
            data[path] = res[path];

            return app.service(serviceName).patch(res._id, data, hook.params)
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

exports.getUserInfo = function (app, encToken) {
  return exports.connection.then(db => {
    let token = jwt.verify(encToken, config.token.secret);
    //console.log('gUI: ' + JSON.stringify(token, null, 2));


    return exports.connection.then(db => {
      const collection = db.collection('users');
      return new Promise((resolve, reject) => {
        // if user token
        if (token.roomId === undefined) {
          let obj = { _id: ObjectId(token._id) };
          // console.log('obj: ' + JSON.stringify(obj));
          collection.findOne(obj, function (err, doc) {
            if (err) {
              throw err
            }

            if (doc === null || doc === undefined) {
              reject({ type: 'error' });
            }

            resolve({ type: 'user', subscriptions: doc.subscriptions });
          })
        } else {
          resolve({ type: 'guest', subscriptions: [token.roomId] });
        }
      })
    })
  })
}
