angular.module('rallly')
.controller('EventCtrl', function($scope, $http, $state, Title, Event, ConfirmModal, Communicator){

    var id = $state.params.id;
    // Get Event
    $scope.event = Event.get({id:id}, function(data){
        // Set the page title to the event title
        if (data.isDeleted) {
            $state.go('deletedevent');
            return;
        }
        
        Communicator.trigger('view:event', data);

        Title.set($scope.event.title);
        // Generate event url - i.e. http://rallly.co/jF9F_Fd
        $scope.eventUrl = $state.href('event', {
            id: $scope.event._id
        }, {
            absolute : true
        });
    }, function(e){
        $state.go('notfound');
    });

    $scope.openEvent = function(){
        $scope.event.isClosed = false;
        Event.update({
            id : id
        }, $scope.event,
        function(){
            var modal = new ConfirmModal({
                title : 'Event Open',
                message : 'People can vote and comment on this event.',
                cancelText : 'OK',
            });
        });
    }

    $scope.closeEvent = function(){
        $scope.event.isClosed = true;
        Event.update({
            id : id
        }, $scope.event,
        function(){
            var modal = new ConfirmModal({
                title : 'Event Closed',
                message : 'People can no longer vote or comment on this event.',
                cancelText : 'OK',
            });
        });
    }

    $scope.editEvent = function(){
        $state.go('editevent', { id : $scope.event._id });
    }

});
