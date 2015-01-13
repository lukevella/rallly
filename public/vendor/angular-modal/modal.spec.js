'use strict';

describe('btfModal', function() {
  var container,
      btfModal,
      $rootScope;

  beforeEach(module('btford.modal'));

  beforeEach(function () {
    container = angular.element('<div></div>');
  });

  afterEach(function() {
    container = null;
  });

  describe('without animations', function () {
    beforeEach(inject(function(_btfModal_, _$rootScope_, $templateCache) {
      btfModal  = _btfModal_;
      $rootScope = _$rootScope_;
      $rootScope.greeting = 'こんばんは';

      $templateCache.put('test.html', [200, '<div>{{greeting}}</div>', {}]);
    }));

    it('should not show a modal initially', function() {
      var modal = btfModal({
        templateUrl: 'test.html',
        container: container
      });

      $rootScope.$digest();

      expect(container.text()).toBe('');
    });


    it('should throw if called without a `template` or `templateUrl` option', function() {
      expect(function () { btfModal({}); }).toThrow();
    });

    it('should throw if called with a text node', function() {
      var modal = btfModal({
        template: 'hey'
      });
      expect(function () {
        modal.activate();
        $rootScope.$digest();
      }).toThrow();
    });

    it('should throw if called with both `template` and `templateUrl` options', function() {
      expect(function () {
        btfModal({
          template: 'foo',
          templateUrl: 'foo.html'
        });
      }).toThrow();
    });

    describe('#activate', function () {
      it('should show a modal when activated with `templateUrl`', function() {
        var modal = btfModal({
          templateUrl: 'test.html',
          container: container
        });
        modal.activate();
        $rootScope.$digest();

        expect(container.text()).toBe('こんばんは');
      });

      it('should show a modal when activated with `template`', function() {
        var modal = btfModal({
          template: '<span>{{greeting}}</span>',
          container: container
        });

        modal.activate();
        $rootScope.$digest();

        expect(container.text()).toBe('こんばんは');
      });

      it('should instantiate a controller via the `controller` option', function() {
        var modal = btfModal({
          template: '<span>{{greeting}}</span>',
          controller: function ($scope) {
            $scope.greeting = 'goodnight'
          },
          container: container
        });

        modal.activate();
        $rootScope.$digest();

        expect(container.text()).toBe('goodnight');
      });

      it('should expose a controller to the scope via the `controllerAs` option', function() {
        var modal = btfModal({
          template: '<span>{{ctrl.greeting}}</span>',
          controller: function () {
            this.greeting = 'boa noite'
          },
          controllerAs: 'ctrl',
          container: container
        });

        modal.activate();
        $rootScope.$digest();

        expect(container.text()).toBe('boa noite');
      });

      it('should pass locals to the modal scope', function() {
        var modal = btfModal({
          template: '<span>{{greeting}}</span>',
          container: container
        });

        modal.activate({
          greeting: 'bon soir'
        });
        $rootScope.$digest();

        expect(container.text()).toBe('bon soir');
      });

      it('should not activate multiple times', function() {
        var modal = btfModal({
          template: '<span>x</span>',
          container: container
        });

        modal.activate();
        $rootScope.$digest();
        modal.activate();
        $rootScope.$digest();

        expect(container.text()).toBe('x');
      });

      it('should resolve a promise after activating', function() {
        var spy = jasmine.createSpy('activated');

        var modal = btfModal({
          template: '<span>x</span>',
          container: container
        });

        modal.activate().then(spy);
        expect(spy).not.toHaveBeenCalled();

        $rootScope.$digest();
        expect(spy).toHaveBeenCalled();
      });
    });


    describe('#deactivate', function () {
      it('should remove a modal when deactivated', function() {

        var modal = btfModal({
          template: '<span>{{greeting}}</span>',
          container: container
        });

        modal.activate();
        $rootScope.$digest();

        modal.deactivate();
        $rootScope.$digest();

        expect(container.text()).toBe('');
      });

      it('should destroy the scope when deactivated', inject(function($$asyncCallback) {
        var destroySpy = jasmine.createSpy('onDestroy');

        var modal = btfModal({
          template: '<span>{{greeting}}</span>',
          container: container,
          controller: function ($scope) {
            $scope.$on('$destroy', destroySpy);
          }
        });

        modal.activate();
        $rootScope.$digest();

        expect(destroySpy).not.toHaveBeenCalled();

        modal.deactivate();
        $rootScope.$digest();
        $$asyncCallback.flush();

        expect(destroySpy).toHaveBeenCalled();
      }));

      it('should resolve a promise after deactivating', inject(function($$asyncCallback) {
        var spy = jasmine.createSpy('deactivated');

        var modal = btfModal({
          template: '<span>x</span>',
          container: container
        });

        modal.activate();
        $rootScope.$digest();

        modal.deactivate().then(spy);
        expect(spy).not.toHaveBeenCalled();

        $$asyncCallback.flush();
        $rootScope.$digest();
        expect(spy).toHaveBeenCalled();
      }));

    });


    describe('#active', function () {
      it('should return the state of the modal', inject(function($$asyncCallback) {

        var modal = btfModal({
          template: '<span>{{greeting}}</span>',
          container: container
        });

        $rootScope.$digest();
        expect(modal.active()).toBe(false);

        modal.activate();
        $rootScope.$digest();
        expect(modal.active()).toBe(true);

        modal.deactivate();
        $rootScope.$digest();
        $$asyncCallback.flush();

        expect(modal.active()).toBe(false);
      }));
    });
  });


  describe('with animations', function () {
    var $animate,
        modal;

    beforeEach(module('ngAnimateMock'));

    beforeEach(inject(function(btfModal, _$rootScope_, _$animate_) {
      $rootScope = _$rootScope_;
      $animate = _$animate_;

      modal = btfModal({
        template: '<span>animations!</span>',
        container: container
      });
    }));

    it('should trigger an enter animation when activated', function () {
      modal.activate();
      $rootScope.$digest();

      var item = $animate.queue.shift();
      expect(item.event).toBe('enter');
    });

    it('should trigger a leave animation when deactivated', function () {
      modal.activate();
      $rootScope.$digest();
      $animate.queue.shift();

      modal.deactivate();
      $rootScope.$digest();

      var item = $animate.queue.shift();
      expect(item.event).toBe('leave');
    });
  });

});
