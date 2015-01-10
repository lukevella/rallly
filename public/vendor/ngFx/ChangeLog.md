#ngFx Change Log

##1.0 (11 Jul 2014)
+ ###Bug Fixes
    * ```fx-trigger``` will now emit ```leave``` animations
    * Rid of console logs :)
    * Add demoApp to visually inspect animations for development
+ ###Features
    * Concat ```ngAnimate``` and ```TweenMax``` into one file
+ ###Breaking changes
    * You no longer use ```fx.animations``` in your modules, you must now use ```ngFx```, so ... ```angular.module("app", ["ngFx"])```
    * You no longer have to include ```ngAnimate``` or ```GSAP```
    * ngFx is now regestered on bower  as ```ngFx```, ```bower install ngFx```       
