'use strict';

const hooks = require('./hooks');
const jwt = require('jsonwebtoken');

class Service {
  constructor(options) {
    this.options = options || {};
  }

  find(params) {
    return Promise.resolve([]);
  }

  get(id, params) {
    return Promise.resolve({
      id, text: `A new message with ID: ${id}!`
    });
  }

  create(data, params) {
    let token = jwt.sign({
      room: data.room,
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60)
    }, 'myPrivateKey');
    return Promise.resolve({ token: token });
  }

  update(id, data, params) {
    return Promise.resolve(data);
  }

  patch(id, data, params) {
    return Promise.resolve(data);
  }

  remove(id, params) {
    return Promise.resolve({ id });
  }
}

module.exports = function () {
  const app = this;

  // Initialize our service with any options it requires
  app.use('/guests',
    new Service() /*,
        function(req, res, next) {
            req.feathers.headers = req.headers;
            next();
        }*/);

  // Get our initialize service to that we can bind hooks
  const guestService = app.service('/guests');

  // Set up our before hooks
  guestService.before(hooks.before);

  // Set up our after hooks
  guestService.after(hooks.after);
};

module.exports.Service = Service;
