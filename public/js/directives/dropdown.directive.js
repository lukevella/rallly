angular.module('rallly')
.directive('dropdown', function($document){
    return {
        restrict : 'A',
        link : function(scope, el, attrs){
            el.addClass('dropdown');
            scope.open = false;

            var clickHandler = function(event){
                var isClickedElementChildOfPopup = el.find(event.target).length > 0;
                if (isClickedElementChildOfPopup) return;
                scope.toggle();
            }

            scope.toggle = function(){
                scope.open = !scope.open;
                if (scope.open){
                    el.addClass('open');
                    $document.bind('click', clickHandler);
                } else {
                    el.removeClass('open');
                    $document.unbind('click', clickHandler);
                }
            }
        }
    }
});
