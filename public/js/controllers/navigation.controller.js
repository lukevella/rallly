angular.module('rallly')
.controller('NavigationCtrl', function($scope, $rootScope, $location, $document){
    $scope.isActive = function(path) {
        if ($location.path() == path) {
            return true;
        } else {
            return false
        }
    }



    var clickHandler = function(event){
        var isClickedElementChildOfPopup = angular.element('.mobile-navigation').find(event.target).length > 0;
        console.log(isClickedElementChildOfPopup);
        if (isClickedElementChildOfPopup) return;
        $scope.toggleMenu()
    }

    $rootScope.$on('$stateChangeSuccess', function(){
        angular.element('body').removeClass('open-menu');
        $document.unbind('click', clickHandler);
    });

    $scope.toggleMenu = function(){
        console.log('click');
        var isOpen = angular.element('body').hasClass('open-menu');
        if (isOpen) {
            angular.element('body').removeClass('open-menu');
            $document.unbind('click', clickHandler);
        } else {
            angular.element('body').addClass('open-menu');
            $document.bind('click', clickHandler);
        }
    }


})
