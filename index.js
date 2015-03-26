'use strict';

var traversal = require('./lib/traversal.js');
var exists = require('101/exists');

/* jshint ignore:start */
if (exists(window)) {
  window.traversal = traversal;
}
else if (exists(module)) {
  module.exports = traversal;
}
/* jshint ignore:end */