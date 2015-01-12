angular.module('rallly')
.controller('EventCtrl', function($scope, $http, $state, Event, Participant){
    var id = $state.params.id;
    $scope.event = Event.get({id:id});
    $scope.delete = function(participant){
        if (confirm("Are you sure you want to remove "+participant.name+"?")){
            Participant.remove({ id : id , pid : participant._id }, function(event){
                $scope.event = event;
            });
        }
    }
    $scope.defaults = [];

    $scope.update = function(participant){
        Event.update({'_id':$scope.event.id}, $scope.event);
    }
    $scope.edit = function(participant){
        $scope.defaults[$scope.event.participants.indexOf(participant)] = angular.copy(participant);
    }

    $scope.cancel = function(index){
        $scope.event.participants[index] = $scope.defaults[index];
    }

    $scope.save = function(participant){
        var participant = new Participant(participant);
        participant.$save({id:id}, function(event){
            $scope.event = event;
            $scope.participant = {};
        });
    }
});
