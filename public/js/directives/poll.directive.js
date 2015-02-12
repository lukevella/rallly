angular.module('rallly')
.directive('poll', function($timeout, Participant, ConfirmModal, Communicator){
    return {
        restrict : 'A',
        templateUrl : 'templates/directives/poll.html',
        scope : {
            'event' : '='
        },
        link : function(scope, el, attrs){
            scope.defaults = [];
            scope.participant = {};
            var datesCount = [];
            scope.event.$promise.then(function(event){
                var examplesNames = ['John Example', 'Jane Specimen','Mark Instance', 'Mary Case'];
                var examples = [];
                for (var i = 0; i < examplesNames.length; i++){
                    var example = { name : examplesNames[i] };
                    example.votes = [];
                    for (var j = 0; j <  event.dates.length; j++){
                        var answer = Math.random()<.5;
                        example.votes[j] = answer;
                    }
                    examples.push(example);
                }
                scope.examples = examples;
            })
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
                            Communicator.trigger('delete:participant', event);
                        });
                    }
                });
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
                    if (scope.event.participants[i].votes[index]) datesCount[index]++;
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
            scope.save = function(){
                if (scope.formnew.$valid){
                    var participant = new Participant(scope.participant);
                    participant.$save({id:scope.event._id}, function(event){
                        scope.event = event;
                        scope.participant = {};
                        Communicator.trigger('add:participant', event);
                    });
                    scope.formnew.$setPristine();
                }
            }
        }
    }
});
