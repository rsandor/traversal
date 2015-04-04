'use strict';

/**
 * @module traversal
 * @author Ryan Sandor Richards
 */

module.exports = Recur;

/**
 * Recursive traversal callback for a given node at a given depth.
 * @class
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

Recur.prototype.getOption = function (name) {
  return this._options[name];
};

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
  }, recur._options.reduceInitial);
};
