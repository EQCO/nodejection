'use strict';
var should = require('chai').should(),
    testData = require('./test.data.js');

describe('nodejection', function () {
  var nodejection;

  before(function () {
    nodejection = require('./index.js');
  });

  it('should have a working clean function', function () {
    nodejection.register('object', testData.object);

    nodejection.services.length.should.equal(1);
    nodejection.clean();
    nodejection.services.length.should.equal(0);
  });

  describe('register', function () {
    beforeEach(function() {
      nodejection.clean();
    });

    after(function () {
      nodejection.clean();
    });

    it('should accept a plain object as a dependency', function () {
      nodejection.register('object', testData.object);

      nodejection.services.length.should.equal(1);
      nodejection.services[0].should.equal('object');
    });

    it('should accept a function object as a dependency', function () {
      var test = function () {};
      test.foo = 'abc';

      nodejection.register('function', nodejection.Literal(test));

      nodejection.services.length.should.equal(1);
      nodejection.services[0].should.equal('function');

      return nodejection.inject('function')
      .then(function (test) {
        should.exist(test);
        test.should.be.a.function;
        should.exist(test.foo);
        test.foo.should.equal('abc');
      });
    });

    it('should accept a path dependency', function () {
      nodejection.register('path', './test.data.js');

      nodejection.services.length.should.equal(1);
      nodejection.services[0].should.equal('path');
    });

    it('should accept a function as a dependency', function () {
      nodejection.register('function', testData.function);

      nodejection.services.length.should.equal(1);
      nodejection.services[0].should.equal('function');
    });

    it('should accept an array of dependencies', function () {
      nodejection.register([
        ['object', testData.object],
        ['path', './test.data.js'],
        ['function', testData.function]
      ]);

      nodejection.services.length.should.equal(3);
      nodejection.services[0].should.equal('object');
      nodejection.services[1].should.equal('path');
      nodejection.services[2].should.equal('function');
    });
  });

describe('scoped injection', function () {
    beforeEach(function() {
      nodejection.clean();
    });

    after(function () {
      nodejection.clean();
    });

    it('should be able to create an instance that has different registered injections than the global copy', function () {
      var nodejection2 = nodejection.scope();
      nodejection.register('object', testData.object);

      nodejection.services.length.should.equal(1);
      nodejection2.services.length.should.equal(0);

      nodejection2.register('object', testData.object);
      nodejection2.register('path', './test.data.js');

      nodejection.services.length.should.equal(1);
      nodejection2.services.length.should.equal(2);
    });
  });

  describe('inject', function () {
    before(function () {
      nodejection.register([
        ['object', testData.object],
        ['function', testData.function],
        ['arrayedFunction', testData.arrayedFunction],
        ['dependentFunction', testData.dependentFunction],
        ['multiDependentFunction', testData.multiDependentFunction],
        ['nestedDependentFunction', testData.nestedDependentFunction],
        ['errorFunction', testData.errorFunction],
        ['nestedErrorFunction', testData.nestedErrorFunction],
        ['circularFunction', testData.circularFunction],
        ['circularNestedEndFunction', testData.circularNestedEndFunction],
        ['circularNestedStartFunction', testData.circularNestedStartFunction]
      ]);
    });

    after(function () {
      nodejection.clean();
    });

    describe('simple tests', function() {
      it('should be able to inject plain object', function (done) {
        nodejection.inject('object').done(function (obj) {
          obj.name.should.equal('object');
          done();
        });
      });

      it('should be able to inject function', function (done) {
        nodejection.inject('function').done(function (obj) {
          obj.name.should.equal('function');
          done();
        });
      });

      it('should be able to inject arrayedFunction', function (done) {
        nodejection.inject('arrayedFunction').done(function (obj) {
          obj.name.should.equal('arrayedFunction');
          done();
        });
      });

      it('should be able to inject dependentFunction', function (done) {
        nodejection.inject('dependentFunction').done(function (obj) {
          obj.name.should.equal('dependentFunction');
          obj.object.name.should.equal('object');
          done();
        });
      });

      it('should be able to inject multiDependentFunction', function (done) {
        nodejection.inject('multiDependentFunction').done(function (obj) {
          obj.name.should.equal('multiDependentFunction');
          obj.object.name.should.equal('object');
          obj.func.name.should.equal('function');
          done();
        });
      });

      it('should be able to inject nestedDependentFunction', function (done) {
        nodejection.inject('nestedDependentFunction').done(function (obj) {
          obj.name.should.equal('nestedDependentFunction');
          obj.dependentFunction.name.should.equal('dependentFunction');
          obj.dependentFunction.object.name.should.equal('object');
          done();
        });
      });
    });

    describe('error handling', function () {
      it('should return a rejected promise on requesting invalid dependency', function (done) {
        nodejection.inject('object2').catch(function(reason) {
          reason.name.should.equal('object2');
          reason.message.should.equal('Requested dependency does not exist');
          done();
        });
      });

      it('should handle errors', function (done) {
        nodejection.inject('errorFunction').catch(function (reason) {
          reason.name.should.equal('errorFunction');
          reason.message.should.equal('Unhandled error initializing dependency');
          reason.error.should.be.an.Object;
          done();
        });
      });

      it('should handle nested errors', function (done) {
        nodejection.inject('nestedErrorFunction').catch(function (reason) {
          reason.name.should.equal('nestedErrorFunction');
          reason.message.should.equal('Error initializing child dependency');
          reason.reason.name.should.equal('errorFunction');
          reason.reason.message.should.equal('Unhandled error initializing dependency');
          reason.reason.error.should.be.an.Object;
          done();
        });
      });

      it('should handle circular dependencies', function (done) {
        nodejection.inject('circularFunction').catch(function (reason) {
          reason.name.should.equal('circularFunction');
          reason.reason.message.should.equal('Circular dependency detected');
          done();
        });
      });

      it('should handle nested circular dependencies', function (done) {
        nodejection.inject('circularNestedStartFunction').catch(function (reason) {
          reason.name.should.equal('circularNestedStartFunction');
          reason.message.should.equal('Error initializing child dependency');
          reason.reason.reason.name.should.equal('circularNestedStartFunction');
          reason.reason.reason.message.should.equal('Circular dependency detected');
          done();
        });
      });
    });

    describe('edge cases', function () {
      it('should handle parallel dependencies', function (done) {
        nodejection.inject(testData.parallelFunction).done(function () {
          done();
        });
      });

      it('should handle no return values', function (done) {
        nodejection.inject(testData.noReturnFunction).done(function () {
          done();
        });
      });
    });

    describe('functionality', function () {
      it('should handle injection from root object', function (done) {
        nodejection('object').done(function (obj) {
          obj.name.should.equal('object');
          done();
        });
      });

      it('should handle onetime injections without registering the dependency', function (done) {
        nodejection.inject(testData.multiDependentFunction).done(function (obj) {
          obj.name.should.equal('multiDependentFunction');
          obj.object.name.should.equal('object');
          done();
        });
      });

      it('should handle injections without promises', function (done) {
        nodejection.inject(testData.noPromiseFunction).done(function (obj) {
          obj.name.should.equal('noPromiseFunction');
          done();
        });
      });

      it('should handle multiple concurrent injections', function (done) {
        nodejection.inject('object', 'function').spread(function (obj, obj2) {
          obj.name.should.equal('object');
          obj2.name.should.equal('function');
          done();
        });
      });
    });
  });
});