angular.module('rallly')
.directive('datepicker', function(){
    return {
        restrict : 'A',
        require : 'ngModel',
        scope : {
            model : '=ngModel',
            control : '='
        },
        templateUrl: 'templates/directives/datePicker.html',
        link : function(scope, el, attrs, ngModel){
            scope.model = scope.model || [];
            scope.control = scope.control || {};

            scope.$watchCollection('model', function(newValue){
                ngModel.$setViewValue(newValue);
                ngModel.$validate();
            });

            ngModel.$validators.required = function(modelValue, viewValue){
                if (!modelValue || modelValue.length == 0){
                    return false;
                }
                return true;
            }

            var today = Date.today(), activeDate = today.clone();
            var setMonth = function(toDate){
                activeDate = toDate;
                var startDate = activeDate.clone().moveToFirstDayOfMonth(),
                    startDateDOW = startDate.getDay();
                startDate.add(startDateDOW - 7).days();
                scope.title = activeDate.toString('MMMM yyyy');
                var days = new Array(42);
                for (var i = 0; i < days.length; i++){
                    var date = startDate.clone().add(i).days()
                    days[i] = {
                        date : date,
                        isOutsideMonth : (date.getMonth() != activeDate.getMonth()) ? true : false,
                        isToday : (Date.equals(date, today))
                    }
                }
                scope.days = days;
            }
            setMonth(activeDate);
            scope.selectDay = function(dayObj){
                if (dayObj.isOutsideMonth) {
                    setMonth(dayObj.date);
                }
                if ((index = scope.isActive(dayObj.date, true)) != -1) {
                    // Already selected
                    scope.model.splice(index, 1); // remove
                } else {
                    // Not selected
                    var index = 0, inserted = false;
                    do {
                        if (scope.model[index] == undefined || Date.compare(Date.parse(scope.model[index]), dayObj.date) > 0){
                            scope.model.splice(index, 0, dayObj.date);
                            inserted = true;
                        }
                        index++;
                    } while (inserted == false);
                }
            }
            scope.isActive = function(date, returnIndex){
                scope.model = scope.model || [];
                for (var i = 0; i < scope.model.length; i++){
                    if (Date.equals(Date.parse(scope.model[i]), date)){
                        return (returnIndex) ? i : true;
                    }
                }
                return (returnIndex) ? -1 : false;
            }
            scope.nextMonth = function(){
                setMonth(activeDate.add(1).months());
            }
            scope.prevMonth = function(){
                setMonth(activeDate.add(-1).months());
            }

            scope.control.removeDate = function(date){
                if ((index = scope.isActive(Date.parse(date), true)) != -1) {
                    scope.model.splice(index, 1)
                }
            }
        }
    }
});
