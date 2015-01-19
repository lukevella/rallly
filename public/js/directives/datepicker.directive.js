angular.module('rallly')
.directive('datepicker', function(){
    return {
        restrict : 'A',
        require : 'ngModel',
        scope : {
            model : '=ngModel',
            control : '='
        },
        link : function(scope, el, attrs, ngModel){
            scope.model = scope.model || [];
            angular.element(el).datepicker({
                multidate : true,
                todayHighlight: true
            })
            .on('changeDate', function(e){
                var dates = e.dates;
                dates.sort(function(a, b){
                    if (a.getTime() > b.getTime()) return true;
                    return false;
                });
                ngModel.$setViewValue(dates, e);
            });

            var update = function(modelValue, oldValue){
                if (!modelValue || !oldValue || (modelValue.length == oldValue.length)) return;
                var dates = [];
                for (var i = 0; i < modelValue.length; i++){
                    dates.push(new Date(modelValue[i]));
                }
                angular.element(el).datepicker('setDates', dates);
            }
            scope.$watchCollection('model', update);

            scope.control = scope.control || {};
            scope.control.unsetDate = function(date){
                var index = scope.model.indexOf(date);
                scope.model.splice(index, 1);
            }

            ngModel.$validators.required = function(modelValue, viewValue){
                if (!modelValue || modelValue.length == 0){
                    return false;
                }
                return true;
            }

        }
    }
});
