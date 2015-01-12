angular.module('rallly')
.controller('EventCtrl', function($scope, $http, $state, Event, Participant){
    $(".nav-link").removeClass('active');
    var id = $state.params.id;
    $scope.participant = {};
    $scope.event = Event.get({id:id}, function(data){
        $scope.eventUrl = $state.href('event', {
            id: $scope.event._id
        }, {
            absolute : true
        });
    }, function(e){
        $state.go('notfound');
    });
    $scope.delete = function(participant){
        if (confirm("Are you sure you want to remove "+participant.name+"?")){
            Participant.remove({ id : id , pid : participant._id }, function(event){
                $scope.event = event;
            });
        }
    }
    $scope.defaults = [];

    $scope.editEvent = function(){
        $state.go('editevent', { id : $scope.event._id });
    }

    $scope.update = function(participant){
        Participant.update({
            id : $scope.event._id,
            pid : participant._id
        }, participant);
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
