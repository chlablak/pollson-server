'use strict';

const errors = require('feathers-errors');
const jwt = require('jsonwebtoken');

exports.verifyToken = function (options) {
  return function (hook) {
    try {
      let token = jwt.verify(hook.params.token, 'myPrivateKey')
    } catch (err) {
      throw new errors.BadRequest('Invalid token', { token: hook.params.token });
    }
  };
};
