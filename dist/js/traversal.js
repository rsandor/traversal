(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';
window.traverse = require('./lib/traversal.js');

},{"./lib/traversal.js":3}],2:[function(require,module,exports){
'use strict';

/* @module traversal */

/**
 * @class Recursive traversal callback for a given node at a given depth.
 * @author Ryan Sandor Richards
 * @param {Object} parent Parent node of the recur.
 * @param {Number} depth Depth of the parent node.
 * @return {TreeTraversal~recur} The recur method for the node and depth.
 */
function Recur(traversal, parent, depth) {
  /**
   * Recurs further into the traversal given the next node.
   * @callback recur
   * @param {Object} node Node on which to continue the traversal.
   * @param {Number} [givenDepth] Traversal depth override.
   */
  var recur = function(node, givenDepth) {
    if (!givenDepth) {
      givenDepth = depth + 1;
    }
    return traversal.run(node, givenDepth);
  };

  recur._options = {
    autoTraverse: true,
    reduce: function(a, b) {
      return a + b;
    },
    reduceInitial: '',
    depth: depth,
    parent: parent
  };

  for (var name in Recur.prototype) {
    recur[name] = Recur.prototype[name];
  }

  return recur;
}

/**
 * Stop automatic traversal for names defined with `TreeTraversal.preorder`
 * and `TreeTraversal.postorder`.
 */
Recur.prototype.stop = function() {
  this._options.autoTraverse = false;
};

/**
 * Sets the reduce function for `.each`.
 * @param {Function} fn Reduce function.
 */
Recur.prototype.setReduce = function(fn) {
  this._options.reduce = fn;
};

/**
 * Sets initial value for `.each` reduce.
 * @param initial Intial value.
 */
Recur.prototype.setReduceInitial = function(initial) {
  this._options.reduceInitial = initial;
};

/**
 * Recurs further in the traversal for each node in a given array.
 * @param {Array} list Array of nodes to traverse.
 * @param {Number} [givenDepth] Traversal depth override.
 */
Recur.prototype.each = function(list, givenDepth) {
  var recur = this;
  if (!givenDepth) {
    givenDepth = this._options.depth + 1;
  }
  return list.map(function (node) {
    return recur(node, givenDepth);
  }).reduce(function (left, right) {
    return recur._options.reduce(left, right);
  }, "");
};

module.exports = Recur;


},{}],3:[function(require,module,exports){
'use strict';

/* @module traversal */

var exists = require('101/exists');
var debug = require('debug');
var Recur = require('./recur.js');

var warning = debug('traversal:warning');

/**
 * @class A tree traversal.
 * @author Ryan Sandor Richards
 */
function TreeTraversal() {
  this.visitors = {};
  this.visitor = function() {};
  this.preorderProperties = [];
  this.postorderProperties = [];
}

/**
 * Given a traversal and a node, this method find the appropriate
 * visitor for the node.
 * @private
 * @param {TreeTraversal} traversal Traversal the contains the
 *  visitor.
 * @param  {Object} node Node for which to find the visitor.
 * @return {TreeTraversal~visitorCallback} The visitor for the node
 *  or the default visitor if no, more specific, one could be found.
 */
function findVisitor(traversal, node) {
  var visitor = traversal.visitor;
  for (var propertyName in traversal.visitors) {
    if (!node.hasOwnProperty(propertyName)) {
      continue;
    }
    var value = node[propertyName];
    var propertyHandler = traversal.visitors[propertyName][value];
    if (exists(propertyHandler)) {
      visitor = propertyHandler;
      break;
    }
  }
  return visitor;
}

/**
 * Treats a given array as a set and adds a value only if
 * the value doesn't exist in the array.
 * @param {Array} set Set to modify
 * @param {*} value Value to add to the set.
 */
function addToSet(set, value) {
  if (~set.indexOf(value)) {
    return;
  }
  set.push(value);
}

/**
 * Adds all values to a set.
 * @see {@link addToSet}
 * @param {Array} set Set to modify.
 * @param {Array} values Values to add to the set.
 */
function allToSet(set, values) {
  var flat = [].concat.apply([], values);
  flat.forEach(function(value) {
    addToSet(set, value);
  });
}

// Public methods

/**
 * Defines a new visitor that only applies to nodes that have a given
 * property set to the given value. If `node` is the node currently
 * being visited in the traversal, then this will only apply if
 * `node[property] === value`.
 *
 * @example
 * // Add a visitor for all `node.type === 'number'`
 * traversal().property('type', 'number', function(node, recur) {
 *  // Do something with the `node` and possibly `recur` on its
 *  // children.
 * });
 *
 * @param {string} key Key the node must have.
 * @param {string} value Value the node must have at the given key.
 * @param {TreeTraversal~visitorCallback} visitor Visitor callback
 *  to apply when `node[key] === value`.
 * @return {TreeTraversal} This tree traversal (for chaining).
 */
TreeTraversal.prototype.property = function(key, value, visitor) {
  if (!exists(this.visitors[key])) {
    this.visitors[key] = {};
  }
  this.visitors[key][value] = visitor;
  return this;
};

/**
 * Sets the default visitor for the traversal.
 * @param  {TreeTraversal~visitorCallback} visitor Default visitor to set.
 * @return {TreeTraversal} This tree traversal (for chaining).
 */
TreeTraversal.prototype.visit = function(visitor) {
  this.visitor = visitor;
  return this;
};

/**
 * Adds a node property name helper to the traversal. Note that
 * property names that correspond to methods on the traversal
 * will be ignored.
 *
 * @example
 * // Create a couple property helpers for the traversal
 * var myTraversal = traversal()
 *  .addPropertyHelper('name')
 *  .addPropertyHelper('coolness')
 * // Use it to quickly handle special cases
 * myTraversal
 *  .name('ryan', function() { console.log('Ryan found'); })
 *  .name('ryan', function() { console.log('Airiel found'); })
 *  .name('nallely', function() { console.log('Nallely found'); })
 *  .coolness('totally', function() { console.log('Totally cool'); })
 *
 * @param {string} Property name helper to add.
 * @return {TreeTraversal} This tree traversal (for chaining).
 * @see {@link traverse} for usage via the factory method.
 */
TreeTraversal.prototype.addPropertyHelper = function(propertyName) {
  if (exists(this[propertyName])) {
    warning('Cannot create helper "' + propertyName + '", method already exists.');
    return;
  }
  this[propertyName] = function(value, visitor) {
    return this.property(propertyName, value, visitor);
  };
  return this;
};

/**
 * Adds node property names to the traversal that should
 * be recursively traversed *after* the node has been visited.
 * @param {...(string|string[])} propertyName Node property
 *  names that, if exist, should be automatically traversed.
 * @return {TreeTraversal} This tree traversal (for chaining).
 */
TreeTraversal.prototype.preorder = function() {
  var names = Array.prototype.slice.call(arguments);
  allToSet(this.preorderProperties, names);
  return this;
};

/**
 * Adds node property names to the traversal that should
 * be recursively traversed *before* the node has been visited.
 * @param {...(string|string[])} propertyName Node property
 *  names that, if exist, should be automatically traversed.
 * @return {TreeTraversal} This tree traversal (for chaining).
 */
TreeTraversal.prototype.postorder = function() {
  var names = Array.prototype.slice.call(arguments);
  allToSet(this.postorderProperties, names);
  return this;
};

/**
 * Perform the traversal on a given node.
 * @param {Object} node Root node to traverse.
 * @param {Number} [depth] Current depth of the traversal.
 */
TreeTraversal.prototype.walk = function(node, depth) {
  if (!depth) {
    depth = 0;
  }
  var visitor = findVisitor(this, node);
  var recur = new Recur(this, node, depth);

  // TODO Going to need a way to turn this off as a special case.
  this.postorderProperties.forEach(function(name) {
    if (exists(node[name])) {
      recur(node[name], depth);
    }
  });

  var result = visitor.call(this, node, recur, depth);

  if (recur.performAutoTraversal) {
    this.preorderProperties.forEach(function(name) {
      if (exists(node[name])) {
        if (Array.isArray(node[name])) {
          recur.each(node[name], depth+1);
        }
        else {
          recur(node[name], depth+1);
        }
      }
    });
  }

  return result;
};

/**
 * Alias for `walk`.
 * @see  {@link walk}
 */
TreeTraversal.prototype.traverse = TreeTraversal.prototype.walk;

/**
 * Alias for `walk`.
 * @see  {@link walk}
 */
TreeTraversal.prototype.run = TreeTraversal.prototype.walk;

/**
 * Factory method for creating new tree traversals.
 * This is the only method exposed via the exports.
 *
 * @example
 * // Basic usage
 * traversal()
 *  // Handle nodes with `.name === 'wowza'`
 *  .addHandler('name', 'wowza', function(node, recur) {})
 *
 *  // Handle nodes with `.name === 'gene'`
 *  .addHandler('name', 'gene', function(node, recur) {})
 *
 *  // Handle nodes with `.value === 42`
 *  .addHandler('value', 42, function(node, recur) {})
 *
 *  // Run the traversal on a root node
 *  .run(rootNode);
 *
 * @example
 * // Add helper method to make thing faster
 * traversal(['name', 'value'])
 *  .name('wowza', function(node, recur) {})
 *  .name('gene', function(node, recur) {})
 *  .value(42, function(node, recur) {})
 *  .run(rootNode);
 *
 * @param {Array} helper List of node properties for which
 *  to add helper methods to the tree traversal.
 * @return {TreeTraversal} a new tree traversal.
 */
function createTraversal(helpers) {
  var traversal = new TreeTraversal();
  if (exists(helpers) && Array.isArray(helpers)) {
    helpers.forEach(function(propertyName) {
      traversal.addHelper(propertyName);
    });
  }
  return traversal;
}

// Callback descriptions

/**
 * Performs operations on a given node during a tree traversal.
 * @callback TreeTraversal~visitorCallback
 * @param {Object} node Node currently being visited during the traversal.
 * @param {TreeTraversal~recur} recur Continues the traversal on a given node.
 * @param {Number} depth Current depth of the traversal.
 */

// Export the factory method.
module.exports = createTraversal;

},{"./recur.js":2,"101/exists":4,"debug":5}],4:[function(require,module,exports){
/**
 * @module {function} 101/exists
 * @type {function}
 */

/**
 * Returns false for null and undefined, true for everything else.
 * @function module:101/exists
 * @param val {*} - value to be existance checked
 * @return {boolean} whether the value exists or not
 */
module.exports = exists;

function exists (val) {
  return val !== undefined && val !== null;
}
},{}],5:[function(require,module,exports){

/**
 * This is the web browser implementation of `debug()`.
 *
 * Expose `debug()` as the module.
 */

exports = module.exports = require('./debug');
exports.log = log;
exports.formatArgs = formatArgs;
exports.save = save;
exports.load = load;
exports.useColors = useColors;

/**
 * Use chrome.storage.local if we are in an app
 */

var storage;

if (typeof chrome !== 'undefined' && typeof chrome.storage !== 'undefined')
  storage = chrome.storage.local;
else
  storage = localstorage();

/**
 * Colors.
 */

exports.colors = [
  'lightseagreen',
  'forestgreen',
  'goldenrod',
  'dodgerblue',
  'darkorchid',
  'crimson'
];

/**
 * Currently only WebKit-based Web Inspectors, Firefox >= v31,
 * and the Firebug extension (any Firefox version) are known
 * to support "%c" CSS customizations.
 *
 * TODO: add a `localStorage` variable to explicitly enable/disable colors
 */

function useColors() {
  // is webkit? http://stackoverflow.com/a/16459606/376773
  return ('WebkitAppearance' in document.documentElement.style) ||
    // is firebug? http://stackoverflow.com/a/398120/376773
    (window.console && (console.firebug || (console.exception && console.table))) ||
    // is firefox >= v31?
    // https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages
    (navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/) && parseInt(RegExp.$1, 10) >= 31);
}

/**
 * Map %j to `JSON.stringify()`, since no Web Inspectors do that by default.
 */

exports.formatters.j = function(v) {
  return JSON.stringify(v);
};


/**
 * Colorize log arguments if enabled.
 *
 * @api public
 */

function formatArgs() {
  var args = arguments;
  var useColors = this.useColors;

  args[0] = (useColors ? '%c' : '')
    + this.namespace
    + (useColors ? ' %c' : ' ')
    + args[0]
    + (useColors ? '%c ' : ' ')
    + '+' + exports.humanize(this.diff);

  if (!useColors) return args;

  var c = 'color: ' + this.color;
  args = [args[0], c, 'color: inherit'].concat(Array.prototype.slice.call(args, 1));

  // the final "%c" is somewhat tricky, because there could be other
  // arguments passed either before or after the %c, so we need to
  // figure out the correct index to insert the CSS into
  var index = 0;
  var lastC = 0;
  args[0].replace(/%[a-z%]/g, function(match) {
    if ('%%' === match) return;
    index++;
    if ('%c' === match) {
      // we only are interested in the *last* %c
      // (the user may have provided their own)
      lastC = index;
    }
  });

  args.splice(lastC, 0, c);
  return args;
}

/**
 * Invokes `console.log()` when available.
 * No-op when `console.log` is not a "function".
 *
 * @api public
 */

function log() {
  // this hackery is required for IE8/9, where
  // the `console.log` function doesn't have 'apply'
  return 'object' === typeof console
    && console.log
    && Function.prototype.apply.call(console.log, console, arguments);
}

/**
 * Save `namespaces`.
 *
 * @param {String} namespaces
 * @api private
 */

function save(namespaces) {
  try {
    if (null == namespaces) {
      storage.removeItem('debug');
    } else {
      storage.debug = namespaces;
    }
  } catch(e) {}
}

/**
 * Load `namespaces`.
 *
 * @return {String} returns the previously persisted debug modes
 * @api private
 */

function load() {
  var r;
  try {
    r = storage.debug;
  } catch(e) {}
  return r;
}

/**
 * Enable namespaces listed in `localStorage.debug` initially.
 */

exports.enable(load());

/**
 * Localstorage attempts to return the localstorage.
 *
 * This is necessary because safari throws
 * when a user disables cookies/localstorage
 * and you attempt to access it.
 *
 * @return {LocalStorage}
 * @api private
 */

function localstorage(){
  try {
    return window.localStorage;
  } catch (e) {}
}

},{"./debug":6}],6:[function(require,module,exports){

/**
 * This is the common logic for both the Node.js and web browser
 * implementations of `debug()`.
 *
 * Expose `debug()` as the module.
 */

exports = module.exports = debug;
exports.coerce = coerce;
exports.disable = disable;
exports.enable = enable;
exports.enabled = enabled;
exports.humanize = require('ms');

/**
 * The currently active debug mode names, and names to skip.
 */

exports.names = [];
exports.skips = [];

/**
 * Map of special "%n" handling functions, for the debug "format" argument.
 *
 * Valid key names are a single, lowercased letter, i.e. "n".
 */

exports.formatters = {};

/**
 * Previously assigned color.
 */

var prevColor = 0;

/**
 * Previous log timestamp.
 */

var prevTime;

/**
 * Select a color.
 *
 * @return {Number}
 * @api private
 */

function selectColor() {
  return exports.colors[prevColor++ % exports.colors.length];
}

/**
 * Create a debugger with the given `namespace`.
 *
 * @param {String} namespace
 * @return {Function}
 * @api public
 */

function debug(namespace) {

  // define the `disabled` version
  function disabled() {
  }
  disabled.enabled = false;

  // define the `enabled` version
  function enabled() {

    var self = enabled;

    // set `diff` timestamp
    var curr = +new Date();
    var ms = curr - (prevTime || curr);
    self.diff = ms;
    self.prev = prevTime;
    self.curr = curr;
    prevTime = curr;

    // add the `color` if not set
    if (null == self.useColors) self.useColors = exports.useColors();
    if (null == self.color && self.useColors) self.color = selectColor();

    var args = Array.prototype.slice.call(arguments);

    args[0] = exports.coerce(args[0]);

    if ('string' !== typeof args[0]) {
      // anything else let's inspect with %o
      args = ['%o'].concat(args);
    }

    // apply any `formatters` transformations
    var index = 0;
    args[0] = args[0].replace(/%([a-z%])/g, function(match, format) {
      // if we encounter an escaped % then don't increase the array index
      if (match === '%%') return match;
      index++;
      var formatter = exports.formatters[format];
      if ('function' === typeof formatter) {
        var val = args[index];
        match = formatter.call(self, val);

        // now we need to remove `args[index]` since it's inlined in the `format`
        args.splice(index, 1);
        index--;
      }
      return match;
    });

    if ('function' === typeof exports.formatArgs) {
      args = exports.formatArgs.apply(self, args);
    }
    var logFn = enabled.log || exports.log || console.log.bind(console);
    logFn.apply(self, args);
  }
  enabled.enabled = true;

  var fn = exports.enabled(namespace) ? enabled : disabled;

  fn.namespace = namespace;

  return fn;
}

/**
 * Enables a debug mode by namespaces. This can include modes
 * separated by a colon and wildcards.
 *
 * @param {String} namespaces
 * @api public
 */

function enable(namespaces) {
  exports.save(namespaces);

  var split = (namespaces || '').split(/[\s,]+/);
  var len = split.length;

  for (var i = 0; i < len; i++) {
    if (!split[i]) continue; // ignore empty strings
    namespaces = split[i].replace(/\*/g, '.*?');
    if (namespaces[0] === '-') {
      exports.skips.push(new RegExp('^' + namespaces.substr(1) + '$'));
    } else {
      exports.names.push(new RegExp('^' + namespaces + '$'));
    }
  }
}

/**
 * Disable debug output.
 *
 * @api public
 */

function disable() {
  exports.enable('');
}

/**
 * Returns true if the given mode name is enabled, false otherwise.
 *
 * @param {String} name
 * @return {Boolean}
 * @api public
 */

function enabled(name) {
  var i, len;
  for (i = 0, len = exports.skips.length; i < len; i++) {
    if (exports.skips[i].test(name)) {
      return false;
    }
  }
  for (i = 0, len = exports.names.length; i < len; i++) {
    if (exports.names[i].test(name)) {
      return true;
    }
  }
  return false;
}

/**
 * Coerce `val`.
 *
 * @param {Mixed} val
 * @return {Mixed}
 * @api private
 */

function coerce(val) {
  if (val instanceof Error) return val.stack || val.message;
  return val;
}

},{"ms":7}],7:[function(require,module,exports){
/**
 * Helpers.
 */

var s = 1000;
var m = s * 60;
var h = m * 60;
var d = h * 24;
var y = d * 365.25;

/**
 * Parse or format the given `val`.
 *
 * Options:
 *
 *  - `long` verbose formatting [false]
 *
 * @param {String|Number} val
 * @param {Object} options
 * @return {String|Number}
 * @api public
 */

module.exports = function(val, options){
  options = options || {};
  if ('string' == typeof val) return parse(val);
  return options.long
    ? long(val)
    : short(val);
};

/**
 * Parse the given `str` and return milliseconds.
 *
 * @param {String} str
 * @return {Number}
 * @api private
 */

function parse(str) {
  var match = /^((?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|years?|yrs?|y)?$/i.exec(str);
  if (!match) return;
  var n = parseFloat(match[1]);
  var type = (match[2] || 'ms').toLowerCase();
  switch (type) {
    case 'years':
    case 'year':
    case 'yrs':
    case 'yr':
    case 'y':
      return n * y;
    case 'days':
    case 'day':
    case 'd':
      return n * d;
    case 'hours':
    case 'hour':
    case 'hrs':
    case 'hr':
    case 'h':
      return n * h;
    case 'minutes':
    case 'minute':
    case 'mins':
    case 'min':
    case 'm':
      return n * m;
    case 'seconds':
    case 'second':
    case 'secs':
    case 'sec':
    case 's':
      return n * s;
    case 'milliseconds':
    case 'millisecond':
    case 'msecs':
    case 'msec':
    case 'ms':
      return n;
  }
}

/**
 * Short format for `ms`.
 *
 * @param {Number} ms
 * @return {String}
 * @api private
 */

function short(ms) {
  if (ms >= d) return Math.round(ms / d) + 'd';
  if (ms >= h) return Math.round(ms / h) + 'h';
  if (ms >= m) return Math.round(ms / m) + 'm';
  if (ms >= s) return Math.round(ms / s) + 's';
  return ms + 'ms';
}

/**
 * Long format for `ms`.
 *
 * @param {Number} ms
 * @return {String}
 * @api private
 */

function long(ms) {
  return plural(ms, d, 'day')
    || plural(ms, h, 'hour')
    || plural(ms, m, 'minute')
    || plural(ms, s, 'second')
    || ms + ' ms';
}

/**
 * Pluralization helper.
 */

function plural(ms, n, name) {
  if (ms < n) return;
  if (ms < n * 1.5) return Math.floor(ms / n) + ' ' + name;
  return Math.ceil(ms / n) + ' ' + name + 's';
}

},{}]},{},[1]);
