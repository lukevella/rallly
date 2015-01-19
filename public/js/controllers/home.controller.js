angular.module('rallly')
.controller('HomeCtrl', function($scope, $state, Title){
    Title.set('Rallly - Collaborative Scheduling')

    $scope.newEvent = function(){
        $state.go('newevent');
    }
});
