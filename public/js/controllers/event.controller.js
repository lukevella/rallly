angular.module('rallly')
.controller('EventCtrl', function($scope, $http, $state, Event, Participant){

    var id = $state.params.id;
    $scope.event = Event.get({id:id});
    $scope.deleteParticipant = function(pid){
        Participant.remove({ id : id , pid : pid }, function(event){
            $scope.event = event;
        });
    }
    $scope.save = function(participant){
        var participant = new Participant(participant);
        participant.$save({id:id}, function(event){
            $scope.event = event;
            $scope.participant = {};
        });
    }
});
