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
            var dateService  = new DatePickerService(scope.model);

            angular.element(el).datepicker({
                multidate : true,
                todayHighlight: true
            })
            .on('changeDate', function(e){
                var datePickerDates = e.dates;
                if (datePickerDates.length > dateService.count()) {
                    var dateAdded = datePickerDates[datePickerDates.length-1];
                    dateService.addDate(dateAdded);
                } else {
                    var dateRemoved = dateService.diffDates(datePickerDates);
                    if (dateRemoved)
                        dateService.removeDate(dateRemoved);
                }
                ngModel.$setViewValue(dateService.getDates())
            });
            var init = false;
            scope.$watchCollection('model', function(newValue, oldValue){
                if (newValue){
                    if (!init){
                        init = true;
                        dateService.setStore(newValue);
                    }
                    var modelDates = dateService.getDatesArray();
                    var datePickerDates = angular.element(el).datepicker('getDates');
                    if (datePickerDates.length != modelDates.length){
                        angular.element(el).datepicker('setDates', modelDates);
                    }
                }
            });

            scope.control = scope.control || {};
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

        // Storage for the datepicker ui element
        var store = defaultStore || [];
        var me = this;

        this.count = function(){
            return store.length;
        }
        this.setStore = function(newStore){
            store = newStore;
        }
        this.addDate = function(date){
            store.push({ date : date });
            store.sort(function(a, b){
                if (Date.compare(a.date, b.date) > 0) return true;
                return false;
            });
        }
        this.removeDate = function(date){
            console.log('removing date');
            var parsedDate = Date.parse(date);
            for (var i = 0; i < store.length; i++){
                if (Date.equals(store[i].date, parsedDate)){
                    store.splice(i,1);
                }
            }
        }
        // Returns the store
        this.getDates = function(){
            return (store.length > 0) ? store : null;
        }
        // Returns the store as an array of Dates
        this.getDatesArray = function(){
            var dates = [];
            for (var i = 0; i < store.length; i++){
                dates.push(Date.parse(store[i].date));
            }
            return dates;
        }
        // Takes two arrays of Dates and returns the first element in the first array that isn't in the second array
        this.diffDates = function(smallArr){
            var shouldReturn = true, bigArr = me.getDatesArray();
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
