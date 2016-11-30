'use strict';

const assert = require('assert');
const app = require('../../../src/app');

describe('guest service', function() {
  it('registered the guests service', () => {
    assert.ok(app.service('guests'));
  });
});
