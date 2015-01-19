angular.module('rallly')
.factory('ConfirmModal', function(btfModal){

    return function(config){
        var modal;
        modal = btfModal({
            templateUrl : 'templates/confirmmodal.html',
            controllerAs : 'modal',
            controller : function(){
                this.title = config.title
                this.message = config.message;
                this.confirm = (config.confirm) ? function(){config.confirm(); modal.deactivate()} : false;
                this.cancel = modal.deactivate;
                this.confirmText = config.confirmText || 'Confirm';
                this.cancelText = config.cancelText || 'Cancel';
                this.isDestructive = config.isDestructive;
            }
        });
        modal.activate();
        
        this.destroy = function(){
            modal.deactivate();
        }
    }
});
