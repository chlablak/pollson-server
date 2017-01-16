'use strict';

const service = require('feathers-mongoose');
const user = require('./user-model');
const hooks = require('./hooks');

module.exports = function () {
  const app = this;

  const options = {
    Model: user,
    paginate: {
      default: 5,
      max: 25
    }
  };

  // Initialize our service with any options it requires
  app.use('/users', service(options));

  // Get our initialize service to that we can bind hooks
  const userService = app.service('/users');

  /*userService.filter(function (data, connection, hook) {
    console.log('in user filter');
    //console.log('conn: ' + connection.user);
    //console.log('prms: ' + hook.params.user);
    return data;
  });*/

  // Set up our before hooks
  userService.before(hooks.before(app));

  // Set up our after hooks
  userService.after(hooks.after(app));
};
