'use strict';
var should = require('should'),
    testData = require('./test.data.js');

describe('nodejection', function () {
  var nodejection;

  before(function () {
    nodejection = require('./index.js');
  });

  it('should have a working clean function', function () {
    nodejection.register('object', testData.object);

    nodejection.services.length.should.be.exactly(1);
    nodejection.clean();
    nodejection.services.length.should.be.exactly(0);
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

      nodejection.services.length.should.be.exactly(1);
      nodejection.services[0].should.equal('object');
    });

    it('should accept a path dependency', function () {
      nodejection.register('path', './test.data.js');

      nodejection.services.length.should.be.exactly(1);
      nodejection.services[0].should.equal('path');
    });

    it('should accept a function as a dependency', function () {
      nodejection.register('function', testData.function);

      nodejection.services.length.should.be.exactly(1);
      nodejection.services[0].should.equal('function');
    });

    it('should accept an array of dependencies', function () {
      nodejection.register([
        ['object', testData.object],
        ['path', './test.data.js'],
        ['function', testData.function]
      ]);

      nodejection.services.length.should.be.exactly(3);
      nodejection.services[0].should.equal('object');
      nodejection.services[1].should.equal('path');
      nodejection.services[2].should.equal('function');
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

    it('should return a rejected promise on requesting invalid dependency', function (done) {
      nodejection.inject('object2').catch(function() {
        done();
      });
    });

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

    it('should handle errors', function (done) {
      nodejection.inject('errorFunction').fail(function (obj) {
        done();
      });
    });

    it('should handle nested errors', function (done) {
      nodejection.inject('nestedErrorFunction').fail(function (obj) {
        done();
      });
    });

    it('should handle circular dependencies', function (done) {
      nodejection.inject('circularFunction').fail(function (obj) {
        done();
      });
    });

    it('should handle nested circular dependencies', function (done) {
      nodejection.inject('circularNestedStartFunction').fail(function (obj) {
        done();
      });
    });
  });
});