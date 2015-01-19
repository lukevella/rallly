angular.module('rallly')
.controller('EditEventCtrl', function($scope, $http, $state, $timeout, Event, ConfirmModal, Title){
    var id = $state.params.id
    $scope.event = Event.get({id:id}, function(data){
        Title.set("Edit: " + $scope.event.title);
        $scope.master = angular.copy($scope.event);
    }, function(e){
        $state.go('notfound');
    });
    $scope.undoChanges = function(){
        $scope.event = angular.copy($scope.master);
        resetDates();
    }
    $scope.didChange = function(){
        return JSON.stringify($scope.master) != JSON.stringify($scope.event);
    }
    $scope.didChangeDates = function(){
        return JSON.stringify($scope.master.dates) != JSON.stringify($scope.event.dates);
    }
    $scope.submit = function(){
        if ($scope.form.$valid){
            if ($scope.didChangeDates() ){
                var modal = new ConfirmModal({
                    title : 'Hold up!',
                    message : 'Changing the dates will reset all entries by the participants. Are you sure you want to do that?',
                    confirmText : 'Yes, I\'m sure',
                    isDestructive : true,
                    confirm : function(){
                        $scope.event.participants = [];
                        update();
                    }
                });

            } else {
                update();
            }
        } else {
            var modal = new ConfirmModal({
                title : 'Not so fast!',
                message : 'Make sure you fill in all the required fields and try again.',
                cancelText : 'OK'
            });
        }
    }
    var update = function(){
        Event.update({
            id : id
        }, $scope.event,
        function(){
            var modal = new ConfirmModal({
                title : 'Event Updated',
                message : 'Your changes have been saved successfully!',
                confirmText : 'Back to Event Page',
                cancelText : 'Stay here',
                confirm : function(){
                    $state.go('event',{id : $scope.event._id});
                }
            });
            $scope.master = angular.copy($scope.event);
            $scope.didSave = $timeout(function(){
                $scope.didSave = false;
            }, 2000);
        });
    }
});
