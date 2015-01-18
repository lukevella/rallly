(function() {
	'use strict';

	var hotKeys = angular.module('drahak.hotkeys', []);

	hotKeys.directive('hotkey', ['$parse', '$hotkey', 'HotKeysElement', function($parse, $hotkey, HotKeysElement) {
		return {
			restrict: 'AE',
			link: function(scope, element, attrs) {
				var hotkeys = scope.$eval(attrs.hotkey || attrs.bind);
				if (angular.isUndefined(hotkeys)) {
					var invoker = $parse(attrs.invoke);
					hotkeys = {};
					hotkeys[attrs.hotkey || attrs.bind] = function(event) {
						invoker(scope, { $event: event });
					}
				}

				var isUsedAsAttribute = element[0].nodeName.toLowerCase() !== 'hotkey';
				var entityManager = isUsedAsAttribute ?
					HotKeysElement(element) :
					$hotkey;

				angular.forEach(hotkeys, function(handler, hotkey) {
					entityManager.bind(hotkey, handler);
				});
			}
		}
	}]);

	hotKeys.factory('HotKeysElement', ['$window', 'HotKeys', function($window, HotKeys) {

		// TODO: find better way how to support multiple key codes for a key
		var replace = { 
			93: 91 // commmand key codes
		};

		var code = null;
		var getKeyCode = function(event) {
			code = event.keyCode;
			return typeof replace[code] !== 'undefined' ? replace[code] : code;
		};

		/**
		 * @params {HTMLElement} element
		 * @returns {HotKeys}
		 */
		return function(element) {
			var keys = [];
			var key = null;
			var elem = angular.element(element);
			var root = angular.element($window);
			var scope = elem.scope();
			var hotKeys = HotKeys();

			/** @type {HotKeys} */
			if (scope) scope.$hotKeys = hotKeys;

			root.bind('blur', function() { keys = []; });
			elem.bind('keydown', function(e) {
				key = getKeyCode(e);
				if (keys.indexOf(key) === -1) keys.push(key);
				hotKeys.trigger(keys, [e]);
			});

			elem.bind('keyup', function(e) { 
				keys.splice(keys.indexOf(getKeyCode(e)), 1); 
			});

			return hotKeys;
		};
	}]);

	hotKeys.factory('HotKeys', ['ParseKey', '$rootScope', function(ParseKey, $rootScope) {

		/**
		 * @constructor
		 */
		var HotKeys = function() {
			this._hotKeys = {};
		};

		/**
		 * Get hot key index
		 * @param {String|Array.<Number>} hotKeyExpr
		 * @returns {String}
		 * @private
		 */
		HotKeys.prototype._getHotKeyIndex = function(hotKeyExpr) {
			var hotKey;
			if (angular.isString(hotKeyExpr)) {
				hotKey = ParseKey(hotKeyExpr);
			} else if (angular.isArray(hotKeyExpr)) {
				hotKey = hotKeyExpr;
			} else {
				throw new Error('HotKey expects hot key to be string expression or key codes array, ' + typeof(hotKeyExpr) + ' given.');
			}
			return hotKey.sort().join('+');
		};

		/**
		 * Register hot key handler
		 * @param {String|Array.<Number>} hotKey
		 * @param {Function} callback
		 * @returns this
		 */
		HotKeys.prototype.bind = function(hotKey, callback) {
			hotKey = this._getHotKeyIndex(hotKey);
			if (!this._hotKeys[hotKey]) {
				this._hotKeys[hotKey] = [];
			}
			this._hotKeys[hotKey].push(callback);
			return this;
		};

		/**
		 * Remove registered hot key handlers
		 * @param {String|Array.<Number>} hotKey
		 * @returns this
		 */
		HotKeys.prototype.unbind = function(hotKey) {
			hotKey = this._getHotKeyIndex(hotKey);
			this._hotKeys[hotKey] = [];
			return this;
		};

		/**
		 * Trigger hot key handlers
		 * @param {String|Array.<Number>} hotKey
		 * @param {Array} [args]
		 */
		HotKeys.prototype.trigger = function(hotKey, args) {
			args = args || [];
			hotKey = this._getHotKeyIndex(hotKey);
			angular.forEach(this._hotKeys[hotKey], function(callback) {
				callback.apply(callback, args);
			});

			if (!$rootScope.$$phase) {
				$rootScope.$apply();
			}
		};

		return function() {
			return new HotKeys();
		}
	}]);

	hotKeys.factory('$hotkey', ['$window', 'HotKeysElement', function($window, HotKeysElement) {
		return HotKeysElement($window);
	}]);

	hotKeys.service('ParseKey', ['$window', function($window) {
		var userAgent = $window.navigator.userAgent.toLowerCase();
		var isFirefox = userAgent.indexOf('firefox') > -1;
		var isOpera = userAgent.indexOf('opera') > -1;
		var commandKeyCode = isFirefox ? 224 : (isOpera ? 17 : 91 /* webkit */); 

		var lexer = {
			'backspace': 8, 'return': 8,
			'tab': 9, 'tabulator': 9,
			'enter': 13,
			'shift': 16,
			'ctrl': 17, 'control': 17,
			'alt': 18,
			'esc': 27, 'escape': 27,
			'left': 37,
			'up': 38,
			'right': 39,
			'down': 40,
			'insert': 45,
			'del': 46,
			'delete': 46,
			'command': commandKeyCode,
			'cmd': commandKeyCode
		};

		return function(expression) {
			var keys = [];
			var expressions = expression.split('+');
			
			angular.forEach(expressions, function(expr) {
				expr = expr.trim().toLowerCase();
				if (lexer[expr]) {
					keys.push(lexer[expr]);
				} else if (expr.length === 1) {
					keys.push(expr.toUpperCase().charCodeAt(0));
				} else {
					throw new Error('ParseKey expects one character or special expression like "Tab" or "Control", "' + expr + '" given');
				}
			});

			return keys;
		};
	}]);

})();