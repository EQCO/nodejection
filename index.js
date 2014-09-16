'use strict';
var _ = require('lodash'),
    q = require('q'),
    util = require('util');

var dependencies = {};

function register (dependencyName, dependencyPath) {
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

function resolveFunctionDependency (name, dependencyFunction, promise, dependencyArguments) {
  try {
    var result = dependencyFunction.apply(undefined, dependencyArguments);

    if (q.isPromise(result)) {
      result.done(function (obj) {
        promise.resolve(obj);
      }, function (reason) {
        promise.reject({
          name: name,
          message: 'Dependency returned a rejected promise',
          reason: reason
        });
      });
    } else {
      promise.resolve(result);
    }
  } catch (err) {
    promise.reject({
      name: name,
      message: 'Unhandled error initializing dependency',
      error: err
    });
  }
}

function inject (requestedDependency, stack) {
  var dependency;

  if (_.isString(requestedDependency)) {
    dependency = dependencies[requestedDependency];

     if (_.contains(stack, requestedDependency)) {
      return q.reject({
        name: requestedDependency,
        message: 'Circular dependency detected'
      });
     }
     stack.push(requestedDependency);
  } else {
    var deferred = q.defer();
    dependency = {
      definition: requestedDependency,
      deferred: deferred,
      promise: deferred.promise
    };
    requestedDependency = 'anonymous';
  }

  if (_.isUndefined(dependency)) {
    return q.reject({
      name: requestedDependency,
      message: 'Requested dependency does not exist'
    });
  }

  if (dependency.promise.isPending() && !(_.isBoolean(dependency.initializing) && dependency.initializing)) {
    dependency.initializing = true;
    if (_.isPlainObject(dependency.definition)) { // Plain objects don't return promises, so just return as is.
      dependency.deferred.resolve(dependency.definition);
    } else if (_.isFunction(dependency.definition)) {
      resolveFunctionDependency(requestedDependency, dependency.definition, dependency.deferred);
    } else if (_.isArray(dependency.definition)) {
      if (dependency.definition.length == 1) {
        if (_.isFunction(dependency.definition[0])) {
          resolveFunctionDependency(requestedDependency, dependency.definition[0], dependency.deferred);
        } else {
          dependency.deferred.reject({
            name: requestedDependency,
            message: 'Unrecognized dependency'
          });
        }
      } else {
        var promises = _.map(_.initial(dependency.definition), function (dependencyName) {
          return inject(dependencyName, _.clone(stack));
        });

        q.all(promises).done(function (dependencies) {
          resolveFunctionDependency(requestedDependency, _.last(dependency.definition), dependency.deferred, dependencies);
        }, function (reason) {
          dependency.deferred.reject({
            name: requestedDependency,
            message: 'Error initializing child dependency',
            reason: reason
          });
        });
      }
    } else {
      dependency.deferred.reject({
        name: requestedDependency,
        message: 'Unrecognized dependency'
      });
    }
  }

  return dependency.promise;
};

function outerInject(requestedDependency) {
  var argsLength = arguments.length;

  if (argsLength > 1) {
    var callback = _.last(arguments);

    if (_.isFunction(callback)) { // Someone wanting to use callbacks instead
      outerInject.apply(undefined, _.initial(arguments)).done(function () {
        callback.bind(undefined, null).apply(undefined, argsLength === 2 ? [arguments[0]] : arguments[0]);
      }, function (err) {
        callback(err);
      });
    } else {
      return q.all(_.map(arguments, function (arg) {
        return inject(arg, []);
      }));
    }
  } else {
    return inject(requestedDependency, []);
  }
};

module.exports = outerInject;
module.exports.register = register;
module.exports.inject = outerInject;

module.exports.clean = function () {
  dependencies = {};
};

Object.defineProperty(module.exports, 'services', {
  get: function () {
    return _.keys(dependencies);
  }
});