angular.module('rallly')
.controller('NewEventCtrl', function($scope, $http, $state, Event, ConfirmModal, Notification){

    $scope.title = "Schedule a New Event";
    $scope.description = "Fill in the form below to create your event and share it with your friends and colleagues.";

    $scope.submit = function(){
        if ($scope.form.$valid){
            $http.post('/api/event', $scope.event)
            .success(function(event, status, headers, config){
                $scope.event = event;
                $scope.eventUrl = $state.href('event', {
                    id: $scope.event._id
                }, {
                    absolute : true
                });
            })
            .error(function(){
                var modal = new ConfirmModal({
                    title : 'Uh oh!',
                    message : 'There was an error creating your event. Please try again later.',
                    cancelText : 'OK'
                });
            });
        } else {
            var notification = new Notification({
                title : 'Not so fast',
                message : 'Make sure you fill in all the required fields and try again.',
                type : 'error'
            });
        }
    }

    $scope.clearDates = null
});
