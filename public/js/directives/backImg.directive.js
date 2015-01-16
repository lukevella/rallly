angular.module('rallly')
.directive('backImg', function(){
    return function(scope, element, attrs){
        var url = attrs.backImg;
        element.css({
            'background-image': 'url(/images/' + url +'.png)'
        });
    };
})
