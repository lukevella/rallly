'use strict';

describe('ParseKey expression parser', function() {

	var parse, userAgent;
	beforeEach(module('drahak.hotkeys'));
	beforeEach(inject(function(ParseKey, $window) {
		parse = ParseKey;
		userAgent = $window.navigator.userAgent.toLowerCase();
	}));

	it('parses string into keycodes array', function() {
		var keys = parse('B + A');
		expect(keys).toEqual([66, 65]);
	});

	it('parses control key', function() {
		var ctrl = parse('Ctrl');
		var control = parse('Control');
		expect(ctrl).toEqual([17]);
		expect(control).toEqual([17]);
	});

	it('parses shift key', function() {
		var shift = parse('Shift');
		var lowercase = parse('shift');
		expect(shift).toEqual([16]);
		expect(lowercase).toEqual([16]);
	});

	it('parses alt key', function() {
		var alt = parse('Alt');
		var lowercase = parse('alt');
		expect(alt).toEqual([18]);
		expect(lowercase).toEqual([18]);
	});

	it('parses escape key', function() {
		var esc = parse('Esc');
		var escape = parse('Escape');
		expect(esc).toEqual([27]);
		expect(escape).toEqual([27]);
	});

	it('parses enter key', function() {
		var enter = parse('Enter');
		expect(enter).toEqual([13]);
	});

	it('parses tab key', function() {
		var tab = parse('Tab');
		var tabulator = parse('Tabulator');
		expect(tab).toEqual([9]);
		expect(tabulator).toEqual([9]);
	});

	it('parses delete key', function() {
		var del = parse('Del');
		var deleteKey = parse('Delete');
		expect(del).toEqual([46]);
		expect(deleteKey).toEqual([46]);
	});

	it('parses insert key', function() {
		var insert = parse('Insert');
		expect(insert).toEqual([45]);
	});

	it('parses arrow keys', function() {
		var arrows = parse('left + up + right + down');
		expect(arrows).toEqual([37, 38, 39, 40]);
	});

	it('fails if one expression is invalid', function() {
		var trigger = function() {
			parse('left + esc + a + some + right');
		};
		expect(trigger).toThrow();
	});

	it('parses command key', function() {
		var commandKeyCode = userAgent.indexOf('firefox') > -1 ? 224 : (userAgent.indexOf('opera') > -1 ? 17 : 91);
		var command = parse('Command');
		var cmd = parse('Cmd');
		expect(cmd).toEqual([commandKeyCode]);
		expect(command).toEqual([commandKeyCode]);
	});

});

describe('HotKey event manager', function() {

	var hotKey;
	beforeEach(module('drahak.hotkeys'));
	beforeEach(inject(function(HotKeys) {
		hotKey = HotKeys();
	}));

	it('triggers registered event handler', function() {
		var handler = jasmine.createSpy();
		hotKey.bind('Ctrl + S', handler);
		hotKey.trigger('Ctrl + S');

		expect(handler).toHaveBeenCalled();
	});

	it('removes registered event handler', function() {
		var handler = jasmine.createSpy();
		hotKey.bind('Ctrl + S', handler);
		hotKey.unbind('S + Ctrl');
		hotKey.trigger('Ctrl + S');
		expect(handler).not.toHaveBeenCalled();
	});

	it('registers hot key using key codes array', function() {
		var handler = jasmine.createSpy();
		hotKey.bind([13], handler);
		hotKey.trigger('Enter');
		expect(handler).toHaveBeenCalled();
	});

	it('throws error if invalid hot key is given', function() {
		var callback = function() {
			hotKey.bind(13, function(){});
		};
		expect(callback).toThrow();
	});

});

describe('HotKey element', function() {

	var scope = null;
	var element = null;
	var hotKeys = null;
	beforeEach(module('drahak.hotkeys'));
	beforeEach(function() {
		module({
			HotKeys: function() {
				return {
					trigger: jasmine.createSpy()
				}
			}
		});
		inject(function(HotKeysElement, $window) {
			scope = {};
			element = angular.element($window);
			spyOn(element, 'scope').andReturn(scope);
			hotKeys = HotKeysElement(element);
		});
	});

	it('adds HotKeys service to element scope as $hotKeys', function() {
		expect(element.scope().$hotKeys).toBe(hotKeys);
	});

	it('triggers hotkey on key down', function() {
		element.triggerHandler('keydown');
		expect(hotKeys.trigger).toHaveBeenCalled();
	});

});

describe('Hotkey directive', function() {

	var $compile;
	var $rootScope;
	var hotKeyElement;
	beforeEach(module('drahak.hotkeys'));
	beforeEach(function() {
		var mockHotKey = function() {
			return { bind: jasmine.createSpy() };
		};
		hotKeyElement = mockHotKey();
		module({
			$hotkey: mockHotKey(),
			HotKeysElement: function() {
				return hotKeyElement;
			}
		});
		inject(function(_$compile_, _$rootScope_) {
			$compile = _$compile_;
			$rootScope = _$rootScope_;
		});
	});

	it('binds event from hotkey and invoke attributes to hotkey event manager', function() {
		$compile('<div hotkey="Ctrl + S" invoke="test()"></div>')($rootScope);
		expect(hotKeyElement.bind).toHaveBeenCalledWith('Ctrl + S', jasmine.any(Function));
	});

	it('binds events from hotkey attribute if we pass object', function() {
		$rootScope.handler = function() {};
		$rootScope.handlerToo = function() {};
		$compile('<div hotkey="{ \'Ctrl + S\': handler, \'Shift + J\': handlerToo }"></div>')($rootScope);
		expect(hotKeyElement.bind).toHaveBeenCalledWith('Ctrl + S', $rootScope.handler);
		expect(hotKeyElement.bind).toHaveBeenCalledWith('Shift + J', $rootScope.handlerToo);
	});

	it('binds events to global scope', inject(function($hotkey) {
		$compile('<hotkey bind="Ctrl + A" invoke="handler"></hotkey>')($rootScope);
		expect($hotkey.bind).toHaveBeenCalledWith('Ctrl + A', jasmine.any(Function));
	}));

	it('binds events to global scope using object in bind attribute', inject(function($hotkey) {
		$rootScope.handler = function() {};
		$rootScope.handlerToo = function() {};
		$compile('<hotkey bind="{ \'Ctrl + S\': handler, \'Shift + J\': handlerToo }"></hotkey>')($rootScope);
		expect($hotkey.bind).toHaveBeenCalledWith('Ctrl + S', $rootScope.handler);
		expect($hotkey.bind).toHaveBeenCalledWith('Shift + J', $rootScope.handlerToo);
	}));

});