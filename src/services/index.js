'use strict';
const answer = require('./answer');
const guest = require('./guest');
const room = require('./room');
const authentication = require('./authentication');
const user = require('./user');
const mongoose = require('mongoose');

module.exports = function () {
  const app = this;

  mongoose.connect(app.get('mongodb'));
  mongoose.Promise = global.Promise;

  app.configure(authentication);
  app.configure(user);
  app.configure(room);
  app.configure(guest);
  app.configure(answer);
};
