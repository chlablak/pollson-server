'use strict';

const app = require('./app');
const port = app.get('port');
const server = app.listen(process.env.port);

server.on('listening', () =>
  console.log(`Feathers application started on ${app.get('host')}:${process.env.port}`)
);
