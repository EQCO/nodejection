+![NPM Version](https://img.shields.io/npm/v/nodejection.svg)

nodejection
===========

Angular-style node depedency injection


Installation
===========
````npm install nodejection -S````

Usage
=====
###Pull nodejection into your file.  
````
var nodejection = require('nodejection');
````

###Create objects for nodejection to inject.
````
var object1 = {
  doStuff: function () {
    return 'Hello World';
  }
};
````

object2.js
````
module.exports = ['object1', function (obj1) {
  return {
    result: obj1.doStuff()
  };
}];
````
###Register your dependencies  
````
nodejection.register('object1', object1);
nodejection.register('object2', require('./object2.js'));
````
or
````
nodejection.register([
  ['object1', object1],
  ['object2', require('./object2.js')]
]);
````

### Inject!
````
nodejection.inject('object2')
.then(function (object2) {
  console.log(object2.result)
});
````
or even
````
nodejection.inject(require('./object2.js'))
.then(function (object2) {
  console.log(object2.result)
});
````

Advanced
========

###### nodejection.clean() 
Removes all registered dependencies.

######nodejection.scope()
Creates new nodejection object that contains its own dependency list.
