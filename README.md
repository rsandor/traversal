# Traversal
By Ryan Sandor Richards

## Installation
`npm install traversal`

## Introduction

Traversals, being a fundamental tree algorithm, occur in many contexts. This library aims to make them easier to write and read in JavaScript.

## Usage

Let us start with an example. First, consider the following tree structure using objects in javascript:

```js
var myTree = {
  type: 'root',
  left: {
    type: 'left child',
    right: {
      type: 'left right child'
    }
  },
  right {
    type: 'lonely right child'
  }
};
```

And a recursive traversal algorithm to walk the tree and print out the node types (with some whitespace to denote the depth of each node):

```js
function treeWalk(node, depth) {
  depth = depth || 0;

  var msg = "";
  for (int i = 0; i < depth; i++) {
    msg += "    ";
  }
  console.log(msg + node.type);

  if (node.left) {
    treeWalk(node.left, depth+1);
  }
  if (node.right) {
    treeWalk(node.right, depth+1);
  }
}
```

Running `treeWalk(myTree)` give you the following result:

```
root
    left child
        left right child
    lonely right child
```

With me so far? If not you might want to [read about traversals](http://en.wikipedia.org/wiki/Tree_traversal). If you are then let's see how we might implement this using `traversal`:

```js
var traversal = require('traversal');

traversal()
  .visit(function(node, recur, depth) {
    var msg = "";
    for (int i = 0; i < depth; i++) {
      msg += "    ";
    }
    console.log(msg + node.type);
  })
  .preorder('left', 'right')
  .walk(myTree);
```

So what's the big deal? Well a couple of things:

1. The code is shorter and more readable
2. We don't have to eplicitly call our recursive method, `.preorder('left', 'right')` does this for us.

In larger more complex recursive traversals these two points can become quite the pain (leading to weird external method calls and massive switch statements). Because each piece is explicitly defined via the library it is easy to simple modularize various aspects of the traversal.

For instance, what if we wanted to use a third party logger? It might go a little something like this:

```js
var traversal = require('traversal');
var logVisit = require('./lib/log-visit.js');
traversal()
  .visit(logVisit)
  .preorder('left', 'right')
  .walk(myTree);

```

Then if we wanted to perform a different action given certain types of nodes we could further modify the traversal, like this:

```javascript
var traversal = require('traversal');
var logVisit = require('./lib/log-visit.js');
traversal()
  .visit(logVisit)
  .preorder('left', 'right')
  .property('type', 'root', function(node) {
    console.log("THIS IS ROOT WOOO");
  })
  .walk(myTree);
```

Full documentation coming soon!


## License
MIT
