angular.module('rallly')
    .directive('poll', function ($timeout, Participant, Event, ConfirmModal, Communicator) {
        return {
            restrict: 'A',
            templateUrl: 'templates/directives/poll.html',
            $scope: {
                'event': '='
            },
            controllerAs: 'pollCtrl',
            controller: function ($scope, $rootScope) {
                $scope.defaults = [];
                $scope.participant = {};
                $rootScope.$on('add:comment', function (e, event, comment) {
                    // Don't repopulate field if user has already voted
                    if (!$scope.didVote) {
                        $scope.participant.name = comment.author.name;
                    }
                });
                this.toggleVote = function (date, participant) {
                    if (!_.contains(date.possible_times[0].voted_by, participant._id)) {
                        date.possible_times[0].voted_by.push(participant._id); // TODO: the [0] hack will be removed when the UI supports time
                    } else {
                        _.remove(date.possible_times[0].voted_by, function(voter) {
                            return voter.toString() === participant._id.toString();
                        });
                    }
                };
                this.hasVote = function(date, participant) {
                    return _.contains(date.possible_times[0].voted_by, participant._id);
                };
                this.delete = function (participant) {
                    var modal = new ConfirmModal({
                        title: 'Delete ' + participant.name + '?',
                        message: 'Are you sure you want to remove ' + participant.name + ' from the poll?',
                        confirmText: 'Yes - delete',
                        cancelText: 'No - nevermind',
                        isDestructive: true,
                        confirm: function () {
                            Participant.remove({id: $scope.event._id, pid: participant._id}, function (event) {
                                $scope.event = event;
                                Communicator.trigger('delete:participant', event);
                            });
                        }
                    });
                };
                this.update = function () {
                    Event.update({
                        id: $scope.event._id
                    }, $scope.event);
                };
                this.edit = function (participant) {
                    $scope.defaults[$scope.event.participants.indexOf(participant)] = angular.copy(participant); //TODO: copy over date instead?
                };
                this.cancel = function (index) {
                    $scope.event.participants[index] = $scope.defaults[index]; //TODO: copy over default date instead
                };
                this.save = function () {
                    console.log('saving');
                    if ($scope.formnew.$valid) {
                        var participant = new Participant($scope.participant);
                        participant.$save({id: $scope.event._id}, function (event) {
                            $scope.event = event;
                            $scope.didVote = true;
                            Communicator.trigger('add:participant', event, $scope.participant);
                            $scope.participant = {};
                        });
                        $scope.formnew.$setPristine();
                    }
                }
            },
            link: function (scope, el, attrs, discussionCtrl) {
                var datesCount = [];

                scope.event.$promise.then(function (event) {
                    var examplesNames = ['John Example', 'Jane Specimen', 'Mark Instance', 'Mary Case'];
                    var examples = [];
                    for (var i = 0; i < examplesNames.length; i++) {
                        var example = {name: examplesNames[i]};
                        example.votes = [];
                        for (var j = 0; j < event.dates.length; j++) {
                            var answer = Math.random() < .5;
                            example.votes[j] = answer;
                        }
                        examples.push(example);
                    }
                    scope.examples = examples;
                });

                scope.isTopDate = function (index) {
                    var count = datesCount[index];
                    for (var i = 0; i < datesCount.length; i++) {
                        if (datesCount[i] > count) return false;
                    }
                    return true;
                };

                scope.selectedDate = function (index) {
                    datesCount[index] = 0;
                    for (var i = 0; i < scope.event.participants.length; i++) {
                        if (scope.event.participants[i].votes[index]) datesCount[index]++;
                    }
                    return datesCount[index];
                }
            }
        }
    });
