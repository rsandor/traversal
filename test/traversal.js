var Lab = require('lab');
var lab = exports.lab = Lab.script();
var describe = lab.describe;
var it = lab.it;
var expect = require('code').expect;

var traversal = require('../lib/traversal');
var fixtures = require('./fixtures');

describe('traversal', function () {
  describe('interface', function () {
    it('should expose a traversal factory method', function (done) {
      expect(traversal).to.exist();
      expect(typeof traversal).to.equal('function');
      done();
    });
  }); // end 'interface'

  describe('traverse', function () {
    it('should correctly perform a preorder traversal', function (done) {
      var result = '';
      traversal()
        .visit(function (node, recur) {
          result += node.value;
        })
        .preorder('left', 'right')
        .walk(fixtures.binaryTree);
      expect(result).to.equal('abcdefg');
      done();
    });

    it('should not follow preorder traversals when stopped', function (done) {
      var result = traversal()
        .visit(function(node, recur) {
          recur.stop();
          return node.value;
        })
        .preorder('children')
        .walk(fixtures.tree);
      expect(result).to.equal('a');
      done();
    });

    it('should correctly perform a postorder traversal', function (done) {
      var result = '';

      traversal()
        .visit(function (node, recur) {
          result += node.value;
        })
        .postorder('children')
        .walk(fixtures.tree);
      expect(result).to.equal('cdbfgea');

      result = '';
      traversal()
        .visit(function (node, recur) {
          result += node.value;
        })
        .postorder('left', 'right')
        .walk(fixtures.binaryTree);
      expect(result).to.equal('cdbfgea');

      done();
    });

    it('should allow a special visitor for a property type', function (done) {
      var booleanType = false;
      var stringType = '';
      var numberType = 0;
      traversal()
        .property('type', 'boolean', function(node) {
          booleanType = node.value;
        })
        .property('type', 'string', function(node) {
          stringType = node.value;
        })
        .property('type', 'number', function(node) {
          numberType = node.value;
        })
        .preorder('children')
        .walk(fixtures.typeTree);
      expect(booleanType).to.equal(true);
      expect(stringType).to.equal('hello');
      expect(numberType).to.equal(42);
      done();
    });

    it('should ignore repeated keys for preorder and postorder', function (done) {
      var total = 0;
      traversal()
        .visit(function(node) {
          total += node.value;
        })
        .preorder('children', 'children')
        .walk(fixtures.numberTree);
      expect(total).to.equal(15);
      done();
    });

    it('should allow the user to create property helpers', function (done) {
      var result;
      traversal().addPropertyHelper('type')
        .type('number', function (node) {
          result = node.value;
        })
        .preorder('children')
        .walk(fixtures.typeTree);
      expect(result).to.equal(42);
      done();
    });

    it('should not allow property helpers to redefine methods', function (done) {
      var t = traversal();
      var fn = t.preorder;
      t.addPropertyHelper('preorder');
      expect(t.preorder).to.equal(fn);
      done();
    });

    it('factory should automatically create property helpers', function (done) {
      var helpers = ['type', 'name'];
      var t = traversal(helpers);
      helpers.forEach(function (helper) {
        expect(t[helper]).to.exist();
        expect(typeof t[helper]).to.equal('function');
      });
      done();
    });
  }); // end 'traverse'

  describe('recur', function () {
    it('should correctly report depth', function (done) {
      traversal(['type'])
        .type('root', function (node, recur, depth) {
          recur(node.children);
        })
        .visit(function (node, recur, depth) {
          expect(depth).to.equal(1);
        })
        .walk(fixtures.typeTree);
      done();
    });

    it('should allow user to override depth', function (done) {
      traversal(['type'])
        .type('root', function (node, recur, depth) {
          recur(node.children, 4);
        })
        .visit(function (node, recur, depth) {
          expect(depth).to.equal(4);
        })
        .walk(fixtures.typeTree);
      done();
    });

    it('should define a reduce function', function (done) {
      var result = traversal()
        .visit(function (node, recur) {
          recur.setReduce(function(left, right) {
            return left + right;
          });
          recur.setReduceInitial(0);
          if (node.children) {
            return node.value + recur.each(node.children);
          }
          return node.value;
        })
        .walk(fixtures.numberTree);
      expect(result).to.equal(15);
      done();
    });
  });
}); // end 'traversal'
