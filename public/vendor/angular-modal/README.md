# angular-modal [![Build Status](https://travis-ci.org/btford/angular-modal.png)](https://travis-ci.org/btford/angular-modal)

A modal factory service for AngularJS that makes it easy to add modals to your app.


## Install

```shell
bower install angular-modal
```

## Usage
1. Include the `modal.js` script provided by this component into your app.
2. *Optional:* Include the `modal.css` style provided by this component into your html.
3. Add `btford.modal` as a module dependency to your app.


## Examples

[Plunker demo](http://plnkr.co/edit/lJDNqafSCKdpMI8AjR0B?p=preview)

### Typical Use

> app.js

```javascript
angular.module('myApp', ['btford.modal']).

// let's make a modal called `myModal`
factory('myModal', function (btfModal) {
  return btfModal({
    controller: 'MyModalCtrl',
    controllerAs: 'modal',
    templateUrl: 'my-modal.html'
  });
}).

// typically you'll inject the modal service into its own
// controller so that the modal can close itself
controller('MyModalCtrl', function (myModal) {
  this.closeMe = myModal.deactivate;
}).

controller('MyCtrl', function (myModal) {
  this.showModal = myModal.activate;
});
```

> my-modal.html

```html
<div class="btf-modal">
  <h3>Hello {{name}}</h3>
  <p><a href ng-click="modal.closeMe()">Close Me</a></p>
</div>
```

> index.html

```html
<div ng-app="myApp" ng-controller="MyCtrl as ctrl">
  <a href ng-click="ctrl.showModal()">Show the modal</a>
</div>
```

### Cleaning up

If you add any listeners within the modal's controller that are **outside the modal's `scope`**,
you should remove them with `$scope.$on('$destroy', fn () { ... })` to avoid creating a memory leak.

Building on the example above:

> app.js

```javascript
// ...
controller('MyModalCtrl', function (myModal, $timeout) {

  var ctrl = this,
      timeoutId;

  ctrl.tickCount = 5;

  ctrl.closeMe = function () {
    cancelTick();
    myModal.deactivate();
  };

  function tick() {
    timeoutId = $timeout(function() {
      ctrl.tickCount -= 1;
      if (ctrl.tickCount <= 0) {
        ctrl.closeMe();
      } else {
        tick();
      }
    }, 1000);
  }

  function cancelTick() {
    $timeout.cancel(timeoutId);
  }

  $scope.$on('$destroy', cancelTick);

  tick();
}).
// ...
```


### Inline Options

**Note:** The best practice is to use a separate file for the template and a separate declaration for
the controller, but inlining these options might be more pragmatic for cases where the template or
controller is just a couple lines.

```javascript
angular.module('myApp', []).

// let's make a modal called myModal
factory('myModal', function (btfModal) {
  return btfModal({
    controller: function () {
      this.name = 'World';
    },
    controllerAs: 'ctrl',
    template: '<div class="btf-modal">Hello {{ctrl.name}}</div>'
  });
}).

controller('MyCtrl', function (myModal) {
  this.showModal = myModal.activate;
});
```

```html
<div ng-app="myApp" ng-controller="MyCtrl">
  <a href ng-click="ctrl.showModal()">Show the modal</a>
</div>
```


## API

### `btfModal`

The modal `factory`. Takes a configuration object as a parameter:

```javascript
var modalService = btfModal({
  /* options */
})
```

And returns a `modalService` object that you can use to show/hide the modal (described below).

The config object **must** either have a `template` or a `templateUrl` option.

These options work just like the [route configuration in Angular's
`$routeProvider`](http://docs.angularjs.org/api/ngRoute.$routeProvider#methods_when).


#### `config.template`
**string:** HTML string of the template to be used for this modal.
Unless the template is very simple, you should probably use `config.templateUrl` instead.

#### `config.templateUrl`
**string (recommended):** URL to the HTML template to be used for this modal.

#### `config.controller`
**string|function (optional):** The name of a controller or a controller function.

#### `config.controllerAs`
**string (optional, recommended):** Makes the controller available on the scope of the modal as the given name.

#### `config.container`
**DOM Node (optional):** DOM node to prepend . Defaults to `document.body`.


### `modalService`

A `modalService` has just two methods: `activate` and `deactivate`.

#### `modalService.activate`

Takes a hash of objects to add to the scope of the modal as locals.
Adds the modal to the DOM by prepending it to the `<body>`.
Returns a promise that resolves once the modal is active.

#### `modalService.deactivate`

Removes the modal (DOM and scope) from the DOM.
Returns a promise that resolves once the modal is removed.

#### `modalService.active`

Returns whether or not the modal is currently activated.


## Tests

You can run the tests with [`karma`](http://karma-runner.github.io/0.10/index.html):

```shell
karma start karma.conf.js
```


## License
MIT
