angular.module('rallly')
.controller('HomeCtrl', function($scope, $state){
    $scope.newEvent = function(){
        $state.go('newevent');
    }
});
