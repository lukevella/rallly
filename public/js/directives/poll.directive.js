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
                    _.forEach($scope.event.dates, function (date) {
                        _.forEach(date.possible_times, function (time) {
                            $scope.defaults[participant._id] = $scope.defaults[participant._id] || {};
                            $scope.defaults[participant._id][date._id] = $scope.defaults[participant._id][date._id] || {};
                            $scope.defaults[participant._id][date._id][time._id] = $scope.defaults[participant._id][date._id][time._id] || {};
                            $scope.defaults[participant._id][date._id][time._id] = _.contains(time.voted_by, participant._id.toString());
                        });
                    });
                };
                this.cancel = function (participant) {
                    _.forEach($scope.event.dates, function (date) {
                        _.forEach(date.possible_times, function (time) {
                            if ($scope.defaults[participant._id][date._id][time._id] !== _.contains(time.voted_by, participant._id.toString())) {
                                $scope.pollCtrl.toggleVote(time, participant);
                            }
                        });
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
                                _.forEach(date.possible_times, function(time) {
                                    if ($scope.participantVotes[date._id] &&  $scope.participantVotes[date._id][time._id]) {
                                        time.voted_by.push(newParticipant);
                                    }
                                });
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
                            for (var k = 0; k <event.dates[j].possible_times.length; ++k) {
                                var answer = Math.random() < .5;
                                example.votes[j+k] = answer;
                            }
                        }
                        examples.push(example);
                    }
                    scope.examples = examples;
                });

                scope.isTopDate = function (time) {
                    var highest = scope.event.dates[0].possible_times[0].voted_by.length;
                    for (var i = 0; i < scope.event.dates.length; ++i) {
                        for (var j = 0; j < scope.event.dates[i].possible_times.length; ++j) {
                            if (scope.event.dates[i].possible_times[j].voted_by.length > highest) {
                                highest = scope.event.dates[i].possible_times[j].voted_by.length;
                            }
                        }
                    }
                    return time.voted_by.length === highest;
                };

                scope.numberVotes = function (time) {
                    return time.voted_by.length;
                };

                scope.isTopDateExample = function (index) {
                    var highest = scope.numberVotesExample(0);
                    for (var i =0; i< scope.event.dates.length; ++i) {
                        for (var j=0; j<scope.event.dates[i].possible_times.length; ++j) {
                            var numVotes = scope.numberVotesExample(i+j);
                            if (numVotes > highest) {
                                highest = numVotes;
                            }
                        }
                    }
                    return highest === scope.numberVotesExample(index);
                };

                scope.numberVotesExample = function (index) {
                    return _.filter(scope.examples, function(participant) {
                        return participant.votes[index];
                    }).length;
                };
            }
        }
    });
