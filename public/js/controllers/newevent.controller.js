angular.module('rallly')
.controller('NewEventCtrl', function($scope, $http, $state, Event){
    $(".nav-link").removeClass('active');
    $(".nav-link[href='/']").addClass('active');

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
            angular.element(el).datepicker({
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
                angular.element(el).datepicker('setDate', null)
            };
            scope.unsetDate = function(date){
                angular.element(el).datepicker('setDates', scope.event.dates.filter(function(el){
                    return el != date;
                }));
            };
        }
    }
});
