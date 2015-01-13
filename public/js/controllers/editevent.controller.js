angular.module('rallly')
.controller('EditEventCtrl', function($scope, $http, $state, $timeout, Event, ConfirmModal){
    var id = $state.params.id
    $scope.event = Event.get({id:id}, function(data){
        var dates = [];
        for (var i = 0; i < data.dates.length; i++){
            dates.push(new Date(data.dates[i]));
        }
        $("[data-datepicker]").datepicker('setDates',dates);
        $scope.master = angular.copy($scope.event);
    }, function(e){
        $state.go('notfound');
    });
    $scope.didChange = function(){
        return JSON.stringify($scope.master) != JSON.stringify($scope.event);
    }
    $scope.didChangeDates = function(){
        return JSON.stringify($scope.master.dates) != JSON.stringify($scope.event.dates);
    }
    $scope.submit = function(){
        if ($scope.didChange()){
            if ($scope.didChangeDates() ){
                var modal = new ConfirmModal({
                    title : 'Hold up!',
                    message : 'Changing the dates will reset all entries by the participants. Are you sure you want to do that?',
                    confirmText : 'Yes, I\'m sure',
                    isDestructive : true,
                    confirm : function(){
                        update();
                    }
                });
                modal.show();

            } else {
                update();
            }
        }
    }
    var update = function(){
        Event.update({
            id : id
        }, $scope.event,
        function(){
            $timeout.cancel($scope.didSave);
            $scope.master = angular.copy($scope.event);
            $scope.didSave = $timeout(function(){
                $scope.didSave = false;
            }, 2000);
        });
    }
});
