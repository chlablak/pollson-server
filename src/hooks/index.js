'use strict';

const errors = require('feathers-errors');
const jwt = require('jsonwebtoken');
const feathers = require('feathers');
const configuration = require('feathers-configuration');
const app = feathers().configure(configuration(__dirname));

exports.verifyToken = function (options) {
  return function (hook) {
    try {
      let config = app.get('auth');

      // throws err if no token is present
      let token = jwt.verify(hook.params.token, config.token.secret);

      let reqId;

      if (options == 'path') {
        let splitPath = hook.params.path.split('/');
        reqId = splitPath[2];
        //try reqId = hook.id;
      } else if (options == 'body') {
        reqId = hook.data.roomId;
      }

      // throw err if the token is not valid for THIS room
      if (token.roomId != reqId) {
        throw new Error;
      }
    } catch (err) {
      throw new errors.BadRequest('Invalid token for this path', { token: hook.params.token });
    }
  };
};
