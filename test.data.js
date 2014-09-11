'use strict';
var q = require('q');

module.exports = {
  object: {
    name: 'object'
  },

  function: function () {
    return q({ name: 'function' });
  },
  arrayedFunction: [function () {
    return q({ name: 'arrayedFunction' });
  }],
  dependentFunction: ['object', function (object) {
    return q({ name: 'dependentFunction', object: object });
  }],
  noRegisterFunction: ['object', function (object) {
    return q({ name: 'noRegisterFunction', object: object });
  }],
  multiDependentFunction: ['object', 'function', function (object, func) {
    return q({ name: 'multiDependentFunction', object: object, func: func });
  }],
  nestedDependentFunction: ['dependentFunction', function (dependentFunction) {
    return q({ name: 'nestedDependentFunction', dependentFunction: dependentFunction });
  }],
  errorFunction: function() {
    throw new Error();
  },
  nestedErrorFunction: ['errorFunction', function (error) {
    return q({ name: 'nestedErrorFunction '});
  }],
  circularFunction: ['circularFunction', function (circular) {
    return q({ name: 'circularFunction '});
  }],
  circularNestedEndFunction: ['circularNestedStartFunction', function (circular) {
    return q({ name: 'circularNestedEndFunction '});
  }],
  circularNestedStartFunction: ['circularEndFunction', function (circular) {
    return q({ name: 'circularNestedStartFunction '});
  }]
};