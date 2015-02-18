angular.module('rallly')
.factory('Communicator', function($rootScope){
    return new (function(){
        this.trigger = function(){
            $rootScope.$emit.apply($rootScope, arguments);
        }
        $rootScope.$on('view:event',function(e, data){
            mixpanel.track('View Event', {
                id : data._id,
                participants : data.participants.length,
                comments  : data.comments.length,
                isExample : data.isExample,
                dates : data.dates.length
            });
        })

        $rootScope.$on('add:participant', function(e, event, participant){
            mixpanel.track('Add Participant', {
                id : event._id
            })
        })

        $rootScope.$on('add:comment', function(e, event, comment){
            mixpanel.track('Add Comment', {
                id : event._id
            })
        })

        $rootScope.$on('add:event', function(e, data){
            mixpanel.track('Add Event', {
                id : data._id,
                participants : data.participants.length,
                comments  : data.comments.length,
                isExample : data.isExample,
                dates : data.dates.length
            })
        })

    })();
});
