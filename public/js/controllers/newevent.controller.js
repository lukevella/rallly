angular.module('rallly')
.controller('NewEventCtrl', function($scope, $http, $state){
    $scope.event = {};
    $scope.submit = function(){
        $http.post('/api/event', $scope.event)
        .success(function(event, status, headers, config){
            $scope.event = event;
            $scope.eventUrl = $state.href('event', {
                id: $scope.event._id
            }, {
                absolute : true
            });
            // $state.go('event',{id : data.event._id});
        })
        .error(function(data, status, headers, config){
            $scope.errors = data.errors;
        })
    }
    $scope.clearDates = null
})
.directive('datepicker', function(){
    return {
        restrict : 'A',
        require : 'ngModel',
        link : function(scope, el, attrs, ngModel){
            $(el).datepicker({
                multidate : true,
                todayHighlight: true,
                format : 'dd/mm/yyyy'
            })
            .on('changeDate', function(e){
                var dates = e.dates;
                dates.sort(function(a, b){
                    if (a.getTime() > b.getTime()) return true;
                    return false;
                });
                ngModel.$setViewValue(dates, e);
            });

            scope.clearDates = function(){
                $(el).datepicker('setDate', null)
            };
            scope.unsetDate = function(date){
                $(el).datepicker('setDates', scope.event.dates.filter(function(el){
                    return el != date;
                }));
            };
        }
    }
});
