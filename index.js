'use strict';

var traversal = require('./lib/traversal.js');

/* jshint ignore:start */
if (typeof window !== 'undefined') {
  window.traversal = traversal;
}
else if (typeof module !== 'undefined') {
  module.exports = traversal;
}
/* jshint ignore:end */