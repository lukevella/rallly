angular.module('rallly')
.controller('NewEventCtrl', function($scope, $http, $state, Event, ConfirmModal){

    $scope.title = "Schedule a New Event";
    $scope.description = "Fill in the form below to create your event and share it with your friends and colleagues.";

    var showModal = function(title, message){
        var modal = new ConfirmModal({
            title : title || 'Not so fast!',
            message : message || 'Make sure you fill in all the required fields and try again.',
            cancelText : 'OK'
        });
    }

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
                showModal('Uh oh!', 'There was an error creating your event. Please try again later.');
            });
        } else {
            showModal();
        }
    }

    $scope.clearDates = null
});
