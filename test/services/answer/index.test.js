'use strict';

const assert = require('assert');
const app = require('../../../src/app');

describe('answer service', function() {
  it('registered the answers service', () => {
    assert.ok(app.service('answers'));
  });
});
