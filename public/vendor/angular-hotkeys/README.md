AngularJS hotkeys [![Build status](https://api.travis-ci.org/drahak/angular-hotkeys.png)](https://travis-ci.org/drahak/angular-hotkeys)
=================

Installation & setup
--------------------
Add dependency to your angular module.

```js
angular.module('myAwesomeApp', ['drahak.hotkeys']);
```

Hot keys expression & events
----------------------------
Use `$hotkey` service to register hotkey globally on window object. The `$hotkey` service is instance of `HotKey` using $window element as its scope. You can also use `HotKey(Element)` factory to observe hotkeys just in scope of the element.

```js
$hotkey.bind('Ctrl + B', function(event) {
    // your handler here
});
```

Note the string expression in first argument. `ParseKey` service parses it into key codes array. As you can see it uses `+` sign to separate keys. There are some special expressions like Ctrl, Shift, Up, Left, Esc or even Escape. It's **not** case sensitive.

```
Ctrl + Shift + E
Control + escape + a
Shift + A
A+B
E +r
```

Directive
---------
You can also use it as directive. Simply add hot key to `hotkey` attribute and action to `invoke` attribute. As in any AngularJS event you can use `$event` variable to access Event object.

```html
<div hotkey="Esc" invoke="close($event)"></div>
<hotkey bind="Esc" invoke="close($event)"  />
```

**Important note:** this component **does not prevent default browser events**. Threfore it could block your hotkey. You can prevent it by calling `event.preventDefault()` where event is current browser event also available as `$event` in `invoke` and `hotkey` attributes.  

**Note:** the hotkey directive can be used as element or attribute. If it's used as attribute, it will observe key events **only on given element**. Otherwise it will use `$window` element.

To define more events within single element pass object to `hotkey` or `bind` attribute. Note you can only pass function references. It's not possible to pass angular expression at the moment. Handler function only takes one parameter (`event`).

```html
<div hotkey="{ 'Esc': close, 'Ctrl + C': close }"></div>
<hotkey bind="{ 'Esc': close, 'Ctrl + C': close }" />
```