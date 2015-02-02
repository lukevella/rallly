angular.module('rallly')
.controller('NewEventCtrl', function($scope, $http, $state, Event, ConfirmModal, Notification){

    $scope.title = "Schedule a New Event";
    $scope.description = "Fill in the form below to create your event and share it with your friends and colleagues.";
    $scope.event = {};

    var states = [
        'newevent.general',
        'newevent.datetime',
        'newevent.invite'
    ];

    $scope.page = 1;

    var goTo = function(page){
        $scope.page = page;
        $state.go(states[page-1]);
    }

    goTo($scope.page);


    $scope.submit = function(){
        if ($scope.form.$valid && $scope.page == states.length){
            $http.post('/api/event', $scope.event)
            .success(function(event, status, headers, config){
                $scope.event = event;
                $scope.eventUrl = $state.href('event', {
                    id: $scope.event._id
                }, {
                    absolute : true
                });
                $scope.page++;
                $state.go('newevent.success');
            })
            .error(function(){
                var modal = new ConfirmModal({
                    title : 'Uh oh!',
                    message : 'There was an error creating your event. Please try again later.',
                    cancelText : 'OK'
                });
            });
        } else if ($scope.form.$valid) {
            $scope.form.$setPristine();
            $scope.nextPage();
        }
    }

    $scope.nextPage = function(){
        goTo($scope.page+1);
    }

    $scope.prevPage = function(){
        goTo($scope.page-1);
    }

});
