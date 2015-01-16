angular.module('rallly')
.controller('NavigationCtrl', function($scope, $location){
    $scope.isActive = function(path) {
        if ($location.path() == path) {
            return true;
        } else {
            return false
        }
    }
})
