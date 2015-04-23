'use strict';
function UnhandledDependencyError(dependencyName, error) {
  this.name = 'UnhandledDependencyError';
  this.dependencyName = dependencyName;
  this.dependencyError = error;
  this.message = 'Unhandled error initializing dependency';
}
UnhandledDependencyError.prototype = Object.create(Error.prototype);
UnhandledDependencyError.prototype.constructor = UnhandledDependencyError;

function RejectedDependencyPromiseError(dependencyName, reason) {
  this.name = 'RejectedDependencyPromiseError';
  this.dependencyName = dependencyName;
  this.reason = reason;
  this.message = 'Dependency returned a rejected promise';
}
RejectedDependencyPromiseError.prototype = Object.create(Error.prototype);
RejectedDependencyPromiseError.prototype.constructor = RejectedDependencyPromiseError;

function CircularDependencyError(dependencyName) {
  this.name = 'CircularDependencyError';
  this.dependencyName = dependencyName;
  this.message = 'Circular dependency detected';
}
CircularDependencyError.prototype = Object.create(Error.prototype);
CircularDependencyError.prototype.constructor = CircularDependencyError;

function UnknownDependencyError(dependencyName) {
  this.name = 'UnknownDependencyError';
  this.dependencyName = dependencyName;
  this.message = 'Requested dependency does not exist';
}
UnknownDependencyError.prototype = Object.create(Error.prototype);
UnknownDependencyError.prototype.constructor = UnknownDependencyError;

function ChildDependencyError(dependencyName, reason) {
  this.name = 'ChildDependencyError';
  this.dependencyName = dependencyName;
  this.reason = reason;
  this.message = 'Error initializing child dependency';

  var innerReason = reason;

  while (innerReason.reason !== undefined) { innerReason = innerReason.reason; }

  this.causingError = innerReason.dependencyError;
  this.causingMessage = innerReason.message;
}
ChildDependencyError.prototype = Object.create(Error.prototype);
ChildDependencyError.prototype.constructor = ChildDependencyError;

module.exports = {
  UnhandledDependencyError: UnhandledDependencyError,
  RejectedDependencyPromiseError: RejectedDependencyPromiseError,
  CircularDependencyError: CircularDependencyError,
  UnknownDependencyError: UnknownDependencyError,
  ChildDependencyError: ChildDependencyError
};