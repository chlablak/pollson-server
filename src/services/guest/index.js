'use strict';

const hooks = require('./hooks');
const jwt = require('jsonwebtoken');
const feathers = require('feathers');
const configuration = require('feathers-configuration');

const app = feathers().configure(configuration(__dirname));

class Service {
  constructor(options) {
    this.options = options || {};
  }

  find(params) {
    return Promise.resolve([]);
  }

  get(id, params) {
    return Promise.resolve({
      id, text: `A new message with ID: ${id}!`,
    });
  }

  create(data, params) {
    const config = app.get('auth');

    const token = jwt.sign({
      _id: data._id,
      roomId: data.roomId,
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60)
    }, config.token.secret);

    const ret = { roomId: data.roomId };

    // guest token
    if (params.token === undefined) {
      ret.guestId = data._id;
      ret.token = token;
    }

    return Promise.resolve(ret);
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
    new Service());

  // Get our initialize service to that we can bind hooks
  const guestService = app.service('/guests');

  guestService.filter((data, connection, hook) => false);

  // Set up our before hooks
  guestService.before(hooks.before(app));

  // Set up our after hooks
  guestService.after(hooks.after(app));
};

module.exports.Service = Service;
