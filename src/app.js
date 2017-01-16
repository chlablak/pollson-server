'use strict';

const path = require('path');
const serveStatic = require('feathers').static;
const favicon = require('serve-favicon');
const compress = require('compression');
const cors = require('cors');
const feathers = require('feathers');
const configuration = require('feathers-configuration');
const hooks = require('feathers-hooks');
const rest = require('feathers-rest');
const bodyParser = require('body-parser');
const socketio = require('feathers-socketio');
const middleware = require('./middleware');
const services = require('./services');
const querystring = require('query-string');

const app = feathers();

app.configure(configuration(path.join(__dirname, '..')));

app.use(compress())
  .options('*', cors())
  .use(cors())
  .use(favicon(path.join(app.get('public'), 'favicon.ico')))
  .use('/', serveStatic(app.get('public')))
  .use(bodyParser.json())
  .use(bodyParser.urlencoded({ extended: true }))
  .configure(hooks())
  .configure(rest())
  .configure(socketio(function (io) {
    io.on('connection', function (socket) {
      /*let i;
      for (i in socket.request) {
        console.log('for :' + i + '   ' + typeof i);
      }
      console.log('connected url: ' + JSON.stringify(socket.request.url, null, 2))
      socket.emit('news', { text: 'A client connected!' });
      socket.on('my other event', function (data) {
        console.log(data)
      })*/
    })
      .use(function (socket, next) {
        socket.feathers.token = querystring.parse(socket.request.url.split('/')[2]).token;
        next();
      })
  })
  )
  .configure(services)
  .configure(middleware)

module.exports = app;
