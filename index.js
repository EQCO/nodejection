'use strict';
var _ = require('lodash'),
    q = require('q');

var dependencies = {};

function register (dependencyName, dependencyPath) {
  //console.log(arguments);
  if (arguments.length == 2) { 
    if (_.isString(dependencyPath)) { // Dependency is a file, need to require it.
      dependencyPath = require(dependencyPath);
    }

    var deferred = q.defer();

    dependencies[dependencyName] = {
      definition: dependencyPath,
      deferred: deferred,
      promise: deferred.promise
    };
  } else if (arguments.length == 1 && _.isArray(arguments[0])) {
    _.each(arguments[0], function (argument) {
      register.apply(undefined, argument);
    });
  }
}

function resolveFunctionDependency (dependencyFunction, promise, dependencyArguments) {
  dependencyFunction.apply(undefined, dependencyArguments).done(function (obj) {
    promise.resolve(obj);
  }, function () {
    promise.reject('Error initializing dependency');
  });
}

function inject (requestedDependency, stack) {
  var dependency = dependencies[requestedDependency];

  if (_.isUndefined(dependency)) {
    return q.reject('Requsted dependency doesn\'t exist');
  }

  if (_.contains(stack, requestedDependency)) {
    return q.reject('Circular dependency detected');
  }
  stack.push(requestedDependency);

  if (dependency.promise.isPending()) {
    if (_.isPlainObject(dependency.definition)) { // Plain objects don't return promises, so just return as is.
      dependency.deferred.resolve(dependency.definition);
    } else if (_.isFunction(dependency.definition)) {
      resolveFunctionDependency(dependency.definition, dependency.deferred);
    } else if (_.isArray(dependency.definition)) {
      if (dependency.definition.length == 1) {
        if (_.isFunction(dependency.definition[0])) {
          resolveFunctionDependency(dependency.definition[0], dependency.deferred);
        } else {
          dependency.deferred.reject('Invalid dependency');
        }
      } else {
        var promises = _.map(_.initial(dependency.definition), function (dependencyName) {
          return inject(dependencyName, stack);
        });

        q.all(promises).done(function (dependencies) {
          resolveFunctionDependency(_.last(dependency.definition), dependency.deferred, dependencies);
        }, function () {
          dependency.deferred.reject('Error initializing dependencies');
        });
      }
    } else {
      dependency.deferred.reject('Invalid dependency');
    }
  }

  return dependency.promise;
};

module.exports.register = register;
module.exports.inject = function (requestedDependency) {
  return inject(requestedDependency, []);
};

module.exports.clean = function () {
  dependencies = {};
};

Object.defineProperty(module.exports, 'services', {
  get: function () {
    return _.keys(dependencies);
  }
});