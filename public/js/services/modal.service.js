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
                this.confirm = function(){
                    if (config.confirm) config.confirm();
                    modal.deactivate();
                }
                this.cancel = modal.deactivate;
                this.confirmText = config.confirmText || 'Confirm';
                this.cancelText = config.cancelText || 'Cancel';
                this.isDestructive = config.isDestructive;
            }
        });
        this.show = function(){
            modal.activate();
        }
        this.destroy = function(){
            modal.deactivate();
        }
    }
});
