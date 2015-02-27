'use strict';
var Promise = require('bluebird');

var functions = {
  object: {
    name: 'object'
  },

  function: function () {
    return Promise.resolve({ name: 'function' });
  },
  arrayedFunction: [function () {
    return Promise.resolve({ name: 'arrayedFunction' });
  }],
  dependentFunction: ['object', function (object) {
    return Promise.resolve({ name: 'dependentFunction', object: object });
  }],
  multiDependentFunction: ['object', 'function', function (object, func) {
    return Promise.resolve({ name: 'multiDependentFunction', object: object, func: func });
  }],
  nestedDependentFunction: ['dependentFunction', function (dependentFunction) {
    return Promise.resolve({ name: 'nestedDependentFunction', dependentFunction: dependentFunction });
  }],
  errorFunction: function() {
    throw new Error();
  },
  nestedErrorFunction: ['errorFunction', function (error) {
    return Promise.resolve({ name: 'nestedErrorFunction '});
  }],
  circularFunction: ['circularFunction', function (circular) {
    return Promise.resolve({ name: 'circularFunction '});
  }],
  circularNestedEndFunction: ['circularNestedStartFunction', function (circular) {
    return Promise.resolve({ name: 'circularNestedEndFunction '});
  }],
  circularNestedStartFunction: ['circularNestedEndFunction', function (circular) {
    return Promise.resolve({ name: 'circularNestedStartFunction '});
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