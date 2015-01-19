angular.module('rallly')
.controller('EventCtrl', function($scope, $http, $state, Title, Event){
    var id = $state.params.id;
    $scope.participant = {};
    $scope.event = Event.get({id:id}, function(data){
        Title.set($scope.event.title);
        $scope.eventUrl = $state.href('event', {
            id: $scope.event._id
        }, {
            absolute : true
        });
    }, function(e){
        $state.go('notfound');
    });

    $scope.editEvent = function(){
        $state.go('editevent', { id : $scope.event._id });
    }

})
.directive('poll', function(Event, Participant, ConfirmModal){
    return {
        restrict : 'A',
        templateUrl : 'templates/directives/poll.html',
        scope : {
            'event' : '=',
            'participant' : '='
        },
        link : function(scope, el, attrs){
            scope.defaults = [];
            var datesCount = [];
            scope.delete = function(participant){
                var modal = new ConfirmModal({
                    title : 'Delete ' + participant.name + '?',
                    message : 'Are you sure you want to remove '+participant.name+' from the poll?',
                    confirmText : 'Yes - delete',
                    cancelText : 'No - nevermind',
                    isDestructive : true,
                    confirm : function(){
                        Participant.remove({ id : scope.event._id , pid : participant._id }, function(event){
                            scope.event = event;
                        });
                    }
                });
                modal.show();
            }
            scope.isTopDate = function(index){
                var count = datesCount[index];
                for (var i = 0; i < datesCount.length; i++){
                    if (datesCount[i] > count) return false;
                }
                return true;
            }
            scope.selectedDate = function(index){
                datesCount[index] = 0;
                for (var i = 0; i < scope.event.participants.length; i++){
                    if (scope.event.participants[i].dates[index]) datesCount[index]++;
                }
                return datesCount[index];
            }
            scope.update = function(participant){
                Participant.update({
                    id : scope.event._id,
                    pid : participant._id
                }, participant);
            }
            scope.edit = function(participant){
                scope.defaults[scope.event.participants.indexOf(participant)] = angular.copy(participant);
            }
            scope.cancel = function(index){
                scope.event.participants[index] = scope.defaults[index];
            }
            scope.save = function(participant){
                if (scope.formnew.$valid){
                    var participant = new Participant(participant);
                    participant.$save({id:scope.event._id}, function(event){
                        scope.event = event;
                        scope.participant = {};
                    });
                    scope.formnew.$setPristine();
                }
            }
        }
    }
});
