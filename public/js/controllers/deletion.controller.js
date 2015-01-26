angular.module('rallly')
.controller('DeletionCtrl', function($state, Notification, Event){
    Event.destroy({id : $state.params.id, code :$state.params.code}, function(){
        var notification = new Notification({
            title : 'Event deleted',
            message : 'This event has been deleted',
            type : 'success',
            timeout : 5000
        });
    }, function(e){
        var notification = new Notification({
            title : 'Deletion Failed',
            message : 'The event could not be deleted. Make sure that it exists and that the url is correct',
            type : 'error'
        });
    });
    $state.go('event', { id : $state.params.id });
});
