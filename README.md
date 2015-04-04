# Traversal
By Ryan Sandor Richards

## Installation
`npm install traversal`

## Introduction

The [tree traversal](http://en.wikipedia.org/wiki/Tree_traversal) is a fundamental problem in computer science and it occurs in many contexts (e.g. compilers). This library aims to make them easier to write and read in JavaScript.

## Usage

Traversal works by holding the computational state of a tree traversal in the form of an JavaScript class. The library exposes a single factory method, `traversal()`, that creates a new instance and allows you to override its default behaviors.

Here's an example of how it might be used:

```js
// 1. Require the library
var traversal = require('traversal');

// 2. Format a tree using nest objects
var myTree = {
  name: 'root',
  left: {
    name: 'left child'

  },
  right: {
    name: 'right child'
  }
};

// 3. Build a traversal that prints out node names and
//    recursively follows the `left` and `right` properties.
var logger = traversal()
  .visit(function(node) { console.log(node); })
  .preorder('left', 'right');

// 4. Execute the traversal by calling `walk`
logger.walk(myTree);
```

This particular traversal would output the following:

```
root
left child
right child
```

## Documentation

### traversal( [ helpers ] )

Instantiates a new tree traversal object.

#### Parameters

* *Array* `helpers` (optional) - List of node properties for which to make helper
  methods.

#### Example
```js
var myTraversal = traversal(['type'])
  .type('root', function (node) {
    console.log('The root node!');
  })
  .visit(function (node) {
    console.log('Just another node...');
  });
```

### .visit(fn)

Define the default visit function, which performs some operation on a node when
it is visited during the traversal.

#### Parameters

* *function* `fn(node, recur, depth)` - Function to apply when visiting a node
  during a traversal. `node` is the node being visited, `recur` is a method that
  can be called to recur on child nodes, and `depth` is the depth in the tree
  at the given node.

#### Examples
```js
// Traverse a binary tree and sum the value of each node
var sum = traversal()
  .visit(function (node, recur) {
    var value = node.value;
    if (node.left) {
      value += recur(node.left);
    }
    if (node.right) {
      value += recur(node.right);
    }
    return value;
  })
  .walk(someBinaryTree);
```

```js
// Traverse a tree and log each node using whitespace to denote depth
traversal()
  .visit(function (node, recur, depth) {
    var indent = '';
    for (var i = 0; i < depth; i++) {
      indent += '  ';
    }
    console.log(indent + node.type);
    if (node.children) {
      // Recur over each of the children of this node
      recur.each(node.children);
    }
  });
```

## License
MIT
