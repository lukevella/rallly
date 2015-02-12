angular.module('rallly')
.controller('EditEventCtrl', function($scope, $http, $state, $timeout, Event, ConfirmModal, Notification, Title){
    var id = $state.params.id
    $scope.event = Event.get({id:id}, function(data){
        Title.set("Edit: " + $scope.event.title);
        $scope.master = angular.copy($scope.event);
    }, function(e){
        $state.go('notfound');
    });
    $scope.$watch('event.isDeleted', function(value){
        if (value){
            $state.go('deletedevent');
        }
    });
    $scope.undoChanges = function(){
        $scope.event = angular.copy($scope.master);
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
            var notification = new Notification({
                title : 'Not so fast',
                message : 'Make sure you fill in all the required fields and try again.',
                type : 'error'
            });
        }
    }
    var update = function(){
        Event.update({
            id : id
        }, $scope.event,
        function(){
            var notification = new Notification({
                title : 'Changes Saved',
                message : 'Your changes have been saved successfully.',
                type : 'success'
            });
            $scope.master = angular.copy($scope.event);
        });
    }
});
