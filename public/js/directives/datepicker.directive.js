angular.module('rallly')
.directive('datepicker', function(DatePickerService){
    return {
        restrict : 'A',
        require : 'ngModel',
        scope : {
            model : '=ngModel',
            control : '='
        },
        link : function(scope, el, attrs, ngModel){
            var dateService  = new DatePickerService(scope.model),
                dateBuffer = dateService.getDatesArray();

            angular.element(el).datepicker({
                multidate : true,
                todayHighlight: true
            })
            .on('changeDate', function(e){
                var datePickerDates = e.dates;
                if (datePickerDates.length > dateBuffer.length) {
                    var dateAdded = datePickerDates[datePickerDates.length-1];
                    dateService.addDate(dateAdded);
                } else {
                    var dateRemoved = dateService.diffDates(dateBuffer, datePickerDates);
                    if (dateRemoved)
                        dateService.removeDate(dateRemoved);
                }
                ngModel.$setViewValue(dateService.getDates())
                dateBuffer = datePickerDates;
            });
            scope.control = scope.control || {};
            scope.$watchCollection('model', function(newValue, oldValue){
                var datePickerDates = angular.element(el).datepicker('getDates');
                var modelDates = dateService.getDatesArray();
                if (datePickerDates.length != modelDates.length){
                    angular.element(el).datepicker('setDates', modelDates);
                }
            });
            scope.control.unsetDate = function(date){
                dateService.removeDate(date);
            }

            ngModel.$validators.required = function(modelValue, viewValue){
                if (!modelValue || modelValue.length == 0){
                    return false;
                }
                return true;
            }

        }
    }
})
.service('DatePickerService', function(){
    return function(defaultStore){

        var store = defaultStore || [];

        this.addDate = function(date){
            store.push({ date : date });
            store.sort(function(a, b){
                if (Date.compare(a.date, b.date) > 0) return true;
                return false;
            });
        }
        this.removeDate = function(date){
            for (var i = 0; i < store.length; i++){
                if (Date.equals(store[i].date, date)){
                    store.splice(i,1);
                }
            }
        }
        this.getDates = function(){
            return (store.length > 0) ? store : null;
        }
        this.getDatesArray = function(){
            var dates = [];
            for (var i = 0; i < store.length; i++){
                dates.push(store[i].date);
            }
            return dates;
        }
        this.diffDates = function(bigArr, smallArr){
            var shouldReturn = true;
            for (var i = 0; i < bigArr.length; i++){
                shouldReturn = true;
                for (var j = 0; j < smallArr.length; j++) {
                    if (Date.equals(bigArr[i], smallArr[j])) {
                        shouldReturn = false;
                    }
                }
                if (shouldReturn) return bigArr[i];
            }
        }
    };
});
