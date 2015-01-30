'use strict';
var _ = require('lodash'),
    q = require('q'),
    util = require('util');

function nodejection() {
  var dependencies = {};

  function register (dependencyName, dependencyPath) {
    var that = this;

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
        that.register.apply(undefined, argument);
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

  function innerInject (requestedDependency, stack) {
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
      if (_.isFunction(dependency.definition)) {
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
            return innerInject(dependencyName, _.clone(stack));
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
        dependency.deferred.resolve(dependency.definition);
      }
    }

    return dependency.promise;
  };

  function inject (requestedDependency) {
    var argsLength = arguments.length;

    if (argsLength > 1) {
      return q.all(_.map(arguments, function (arg) {
        return innerInject(arg, []);
      }));
    } else {
      return innerInject(requestedDependency, []);
    }
  };

  function clean () {
    dependencies = {};
  };

  var obj = inject;
  obj.inject = inject;
  obj.register = register;
  obj.clean = clean;
  obj.scope = nodejection;

  Object.defineProperty(obj, 'services', {
    get: function () {
      return _.keys(dependencies);
    }
  });

  return obj;
}

module.exports = nodejection();