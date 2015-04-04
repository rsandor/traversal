module.exports = {
  tree: {
    value: 'a',
    children: [
      {
        value: 'b',
        children: [{ value: 'c' }, { value: 'd' }]
      },
      {
        value: 'e',
        children: [{value: 'f'}, {value: 'g'}]
      }
    ]
  },
  binaryTree: {
    value: 'a',
    left: {
      value: 'b',
      left: { value: 'c' },
      right: { value: 'd' }
    },
    right: {
      value: 'e',
      left: { value: 'f' },
      right: { value: 'g' }
    }
  },
  typeTree: {
    type: 'root',
    children: [
      { type: 'boolean', value: true },
      { type: 'string', value: 'hello' },
      { type: 'number', value: 42 },
      { value: 16 }
    ]
  },
  numberTree: {
    value: 1,
    children: [
      { value: 2 },
      { value: 3 },
      { value: 4 },
      { value: 5 }
    ]
  }
};
