'use strict';

const errors = require('feathers-errors');
const jwt = require('jsonwebtoken');

exports.verifyToken = function (options) {
  return function (hook) {
    try {
      // throws err if no token is present
      let token = jwt.verify(hook.params.token, 'myPrivateKey');

      let splitPath = hook.params.path.split('/');

      // throw err if the token is not valid for THIS room
      if (token.room != splitPath[2]) {
        throw new Error;
      }
    } catch (err) {
      throw new errors.BadRequest('Invalid token for this path', { token: hook.params.token });
    }
  };
};
