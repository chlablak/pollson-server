'use strict';

const hooks = require('./hooks');
const jwt = require('jsonwebtoken');
const feathers = require('feathers');
const configuration = require('feathers-configuration');
const app = feathers().configure(configuration(__dirname));

class Service {
  constructor (options) {
    this.options = options || {};
  }

  find (params) {
    return Promise.resolve([]);
  }

  get (id, params) {
    return Promise.resolve({
      id, text: `A new message with ID: ${id}!`
    });
  }

  create (data, params) {
    let config = app.get('auth');

    let token = jwt.sign({
      _id: data._id,
      roomId: data.roomId,
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60)
    }, config.token.secret);

    return Promise.resolve({ roomId: data.roomId, guestId: data._id, token: token });
  }

  update (id, data, params) {
    return Promise.resolve(data);
  }

  patch (id, data, params) {
    return Promise.resolve(data);
  }

  remove (id, params) {
    return Promise.resolve({ id });
  }
}

module.exports = function () {
  const app = this;

  // Initialize our service with any options it requires
  app.use('/guests',
    new Service());

  // Get our initialize service to that we can bind hooks
  const guestService = app.service('/guests');

  guestService.filter(function (data, connection, hook) {
    return false;
  });

  // Set up our before hooks
  guestService.before(hooks.before);

  // Set up our after hooks
  guestService.after(hooks.after);
};

module.exports.Service = Service;
