angular.module('rallly')
.factory('Notification', function($timeout, btfModal){
    return function(config){
        var modal;
        modal = btfModal({
            templateUrl : 'templates/notification.html',
            controllerAs : 'notification',
            controller : function(){
                this.title = config.title
                this.message = config.message;
                this.close = modal.deactivate;
                this.type = config.type;
                var timeout = config.timeout || 5000;
                $timeout(modal.deactivate, timeout);
            }
        });
        modal.activate();

        this.destroy = function(){
            modal.deactivate();
        }
    }
});
