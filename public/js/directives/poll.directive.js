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
                $scope.defaults = {};
                $scope.participant = {};
                $scope.participantVotes = {};
                $rootScope.$on('add:comment', function (e, event, comment) {
                    // Don't repopulate field if user has already voted
                    if (!$scope.didVote) {
                        $scope.participant.name = comment.author.name;
                    }
                });
                this.toggleVote = function (time, participant) {
                    if (!_.contains(time.voted_by, participant._id)) {
                        time.voted_by.push(participant._id);
                    } else {
                        _.remove(time.voted_by, function (voter) {
                            return voter.toString() === participant._id.toString();
                        });
                    }
                };
                this.hasVote = function (time, participant) {
                    return _.contains(time.voted_by, participant._id);
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
                    $scope.defaults[participant._id] = _.filter($scope.event.dates, function (date) {
                        return _.contains(date.possible_times[0].voted_by, participant._id.toString());
                    });

                };
                this.cancel = function (participant) {
                    _.forEach($scope.event.dates, function (date) {
                        var votedForDateDefault = _.find($scope.defaults[participant._id], function (votedDate) {
                            return (date.possible_times[0]._id === votedDate.possible_times[0]._id);
                        });

                        if (votedForDateDefault && !_.contains(date.possible_times[0].voted_by, participant._id.toString())) {
                            date.possible_times[0].voted_by.push(participant._id);
                        } else if (!votedForDateDefault && _.contains(date.possible_times[0].voted_by, participant._id.toString())) {
                            _.remove(date.possible_times[0].voted_by, function (voter) {
                                return voter.toString() === participant._id.toString();
                            });
                        }
                    });
                };
                this.save = function () {
                    if ($scope.formnew.$valid) {
                        var participant = new Participant($scope.participant);
                        participant.$save({id: $scope.event._id}, function (event) {
                            var currentParticipantIds = _.pluck($scope.event.participants, '_id');
                            var newParticipantIds = _.pluck(event.participants, '_id');
                            var newParticipant = _.difference(newParticipantIds, currentParticipantIds)[0];

                            $scope.event = event;
                            $scope.didVote = true;
                            Communicator.trigger('add:participant', event, $scope.participant);

                            _.forEach($scope.event.dates, function (date) {
                                if ($scope.participantVotes[date._id]) {
                                    date.possible_times[0].voted_by.push(newParticipant);
                                }
                            });

                            $scope.pollCtrl.update();
                            $scope.participant = {};
                            $scope.participantVotes = {};
                        });

                        $scope.formnew.$setPristine();
                    }
                };
            },
            link: function (scope, el, attrs, discussionCtrl) {
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

                scope.isTopDate = function (date) {
                    var highest = scope.event.dates[0].possible_times[0].voted_by.length;
                    for (var i = 1; i < scope.event.dates.length; ++i) {
                        if (scope.event.dates[i].possible_times[0].voted_by.length > highest) {
                            highest = scope.event.dates[i].possible_times[0].voted_by.length;
                        }
                    }
                    return date.possible_times[0].voted_by.length === highest;
                };

                scope.numberVotes = function (date) {
                    return date.possible_times[0].voted_by.length;
                }
            }
        }
    });
