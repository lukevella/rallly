angular.module('rallly')
    .controller('NewEventCtrl', function ($scope, $http, $state, Event, ConfirmModal, Notification, Communicator) {

        $scope.title = "Schedule a New Event";
        $scope.description = "Fill in the form below to create your event and share it with your friends and colleagues.";
        $scope.event = {
            creator: {
                allowNotifications: true
            }
        };

        $scope.submit = function () {
            if ($scope.form.$valid) {
                var newEvent = new Event($scope.event);
                newEvent.$save()
                    .then(function (event) {
                        _.forEach(event.dates, function(date) {
                            date.raw_date = new Date(date.raw_date);
                            _.forEach(date.possible_times, function(time) {
                                time.start_time = new Date(time.start_time);
                                time.end_time = new Date(time.end_time);
                            });
                        });

                        $scope.event = event;
                        $scope.eventUrl = $state.href('event', {
                            id: $scope.event._id
                        }, {
                            absolute: true
                        });
                        Communicator.trigger('add:event', event);
                        $state.go('newevent.success');
                    }, function () {
                        var modal = new ConfirmModal({
                            title: 'Uh oh!',
                            message: 'There was an error creating your event. Please try again later.',
                            cancelText: 'OK'
                        });
                    });
            } else {
                var notification = new Notification({
                    title: 'Hold on!',
                    message: 'Make sure you fill in all the required fields and that your data is correct.'
                });
            }
        };
    });
