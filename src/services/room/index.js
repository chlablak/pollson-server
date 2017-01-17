'use strict';

const service = require('feathers-mongoose');
const room = require('./room-model');
const hooks = require('./hooks');
const globalHooks = require('../../hooks');

module.exports = function () {
  const app = this;

  const options = {
    Model: room,
    paginate: {
      default: 5,
      max: 100,
    },
  };

  // Initialize our service with any options it requires
  app.use('/rooms',
    (req, res, next) => {
      req.feathers.path = req.path;
      next();
    },
    service(options));

  // Get our initialize service to that we can bind hooks
  const roomService = app.service('/rooms');

/**
 * Send only events to people who are subscribed to this room
 */
  roomService.filter((data, connection, hook) => {
    return globalHooks.getUserInfo(connection.token)
      .then((res) => {
        if (res.type === 'user' || res.type === 'guest') {
          for (let s in res.subscriptions) {
            if (res.subscriptions[s].toString() === data._id.toString()) {
              return data;
            }
          }
        }
        return false;
      })
      .catch((err) => {
        console.log(err);
        return false;
      });
  });

  // Set up our before hooks
  roomService.before(hooks.before(app));

  // Set up our after hooks
  roomService.after(hooks.after(app));
};
