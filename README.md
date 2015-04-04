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

### .walk(tree)

Perform the traversal on a given tree.

#### Parameters

* *Object* tree - Root node of the tree to traverse.

#### Example
```js
// Setup the traversal
var total = 0;
var myTraversal = traversal()
  .visit(function (node, recur) {
    total += node.value;
  })
  .postorder('children');

// Perform the tree traversal, or "walk" a tree...
myTraversal.walk({
  value: 10,
  children: [
    { value: 20 },
    { value: 30 },
  ]
});

// Outputs 60
console.log(total);
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

### .preorder(propertyName, ...)

Adds node property names to the traversal that should be recursively traversed
*after* the node has been visited (read more about
[preorder traversals](http://en.wikipedia.org/wiki/Tree_traversal#Pre-order)).

#### Parameters

* *string...* propertyName - One or more property names that should be
  automatically recurred upon when performing the traversal.

#### Examples
```js
traversal()
  .visit(function (node) {
    console.log(node.value);
  })
  // Automatically traverse the left and right properties of each node.
  .preorder('left', 'right');
```

```js
traversal()
  // You can even traverse arrays!
  .preorder('children')
```

### .postorder(properName, ...)

Adds node property names to the traversal that should be recursively traversed
*before* the node has been visited (read more about
[postorder traversals](http://en.wikipedia.org/wiki/Tree_traversal#Post-order)).

#### Parameters

* *string...* propertyName - One or more property names that should be
  automatically recurred upon when performing the traversal.

#### Examples

```js
traversal()
  .visit(function (node) {
    console.log(node.value);
  })
  // Postorder visit the left and right properties of each node
  .postorder('left', 'right');
```

```js
traversal()
  // Postorder traverse an array of nodes
  .preorder('children')
```

### .property(propertyName, propertyValue, fn)

Defines a new visitor that only applies to nodes that have a given property set
to the given value. If `node` is the node currently being visited in the
traversal, then this will only apply if `node[propertyName] === propertyValue`.

#### Parameters

* *String* `propertyName` - Name of the property for which to define the custom
   visitor function.
* *mixed* `properyValue` - Value of the propery for which to apply the custom
  visitor function.
* *function* fn - The visitor function to apply when
  `node[propertyName] === propertyValue`

#### Example
```js
// Traversal that treats node.type === 'root' as a special case
traversal()
  .property('type', 'root', function (root, recur) {
    console.log("Root node!");
    recur.each(root.children);
  })
  .visit(function (node) {
    console.log("Regular, non-root node.");
    if (node.children) {
      recur.each(node.children);
    }
  });
```

### .addPropertyHelper(propertyName)

Adds a new method to the traversal that makes it easier to define specific
property visitors (as you would with `.property`).

#### Parameters

* *String* `propertyName` - Name of the property for which to make the helper.
  Cannot be a reserved or already taken name on the traversal (e.g. `visit`).

#### Example
```js
traversal()
  // Create a type property helper for a traversal
  .addPropertyHelper('type')
  // Use it to create special visit functions
  .type('root', function (node) {
    console.log('Node type is root!')
  })
  .type('number', function (node) {
    console.log('Node type is number!');
  });
```

## License
MIT
