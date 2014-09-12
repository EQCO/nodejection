'use strict';
var q = require('q');

var functions = {
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
  circularNestedStartFunction: ['circularNestedEndFunction', function (circular) {
    return q({ name: 'circularNestedStartFunction '});
  }],
  noPromiseFunction: ['object', function (obj) {
    return {
      name: 'noPromiseFunction',
      object: obj
    };
  }],
  parallelFunction: ['object', ['object', function(object) {}], function (object, mdf) {
    return {};
  }],
  noReturnFunction: ['object', function (object) {}]
};

module.exports = functions;