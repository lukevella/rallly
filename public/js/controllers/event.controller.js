angular.module('rallly')
.controller('EventCtrl', function($scope, $http, $state, Title, Event, ConfirmModal){
    var id = $state.params.id;
    // Get Event
    $scope.event = Event.get({id:id}, function(data){
        // Set the page title to the event title
        Title.set($scope.event.title);
        // Generate event url - i.e. http://rallly.co/jF9F_Fd
        $scope.eventUrl = $state.href('event', {
            id: $scope.event._id
        }, {
            absolute : true
        });
        var examplesNames = ['John Example', 'Jane Specimen','Mark Instance', 'Mary Case'];
        $scope.event.examples = [];
        for (var i = 0; i < examplesNames.length; i++){
            var example = { name : examplesNames[i] };
            example.dates = [];
            for (var j = 0; j < $scope.event.dates.length; j++){
                var answer = Math.random()<.5;
                example.dates[j] = answer;
            }
            $scope.event.examples.push(example);
        }
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
