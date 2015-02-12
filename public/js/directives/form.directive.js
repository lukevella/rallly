angular.module('rallly')
.service('FormHelper', function(){
    this.emailRegexString = '^([\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4})?$';
    this.emailRegex = new RegExp(this.emailRegexString);
    this.prettyError = function(errors, field){
        if (errors.required) return field + " is required";
        if (errors.pattern) return field + " is invalid" ;
        if (errors.maxlength) return field + " is too long";
        return false;
    }
})
.directive('userForm', function(FormHelper){
    return {
        scope : {
            event : '=',
            form : '='
        },
        templateUrl : 'templates/form/userForm.html',
        link : function(scope, el, attrs) {
            scope.errors = {};

            scope.emailRegex = FormHelper.emailRegex;

            scope.$watchCollection('form.name.$error',function(errors){
                scope.errors.name = FormHelper.prettyError(errors, "Name");
            });

            scope.$watchCollection('form.email.$error',function(errors){
                scope.errors.email = FormHelper.prettyError(errors, "Email");
            });
        }
    }
})
.directive('eventForm', function(FormHelper){
    return {
        scope : {
            event : '=',
            form : '='
        },
        templateUrl : 'templates/form/eventForm.html',
        link : function(scope, el, attrs) {
            scope.errors = {};

            scope.$watchCollection('form.title.$error',function(errors){
                scope.errors.title = FormHelper.prettyError(errors, "Title");
            });

            scope.$watchCollection('form.location.$error',function(errors){
                scope.errors.location = FormHelper.prettyError(errors, "Location");
            });

        }
    }
})
.directive('dateForm', function(){
    return {
        scope : {
            event : '=',
            form : '='
        },
        templateUrl : 'templates/form/dateForm.html'
    }
})
.directive('participantsForm', function(FormHelper){
    return {
        scope : {
            event : '=',
            form : '='
        },
        templateUrl : 'templates/form/participantsForm.html',
        link : function(scope, el, attrs){
            scope.emailRegex = FormHelper.emailRegexString;
        }
    }
})
.directive('settingsForm', function(Event, ConfirmModal){
    return {
        scope : {
            event : '=',
            form : '='
        },
        templateUrl : 'templates/form/settingsForm.html',
        link : function(scope, el, attrs){
            scope.deleteEvent = function(){
                var modal = new ConfirmModal({
                    title : 'Are you sure?',
                    message : 'The event will no longer be accessible after it is deleted. Are you sure you want to continue?',
                    isDestructive : true,
                    confirmText : 'Yes - delete',
                    cancelText : 'Cancel',
                    confirm : function(){
                        Event.delete({'id' : scope.event._id}, function(e){
                            scope.event.isDeleted = true;
                        });
                    }
                });
            }
        }
    }
})
.directive('switchToggle', function(){
    return {
        scope : {
            model : '=ngModel'
        },
        require : 'ngModel',
        link : function(scope, el, attrs, ngModel) {
            el.addClass('switch-toggle');
            var setClass = function(){
                if (scope.model ^ typeof(attrs.invert) !== 'undefined'){
                    el.addClass('active');
                } else {
                    el.removeClass('active');
                }
            }
            scope.$watch('model', setClass);
            el.bind('click', function(e){
                scope.model = !scope.model;
                ngModel.$setViewValue(scope.model, e);
            });
        }
    }
})
.directive('timeForm', function(DatePickerService){
    return {
        scope : {
            event : '=',
            form : '='
        },
        templateUrl : 'templates/form/timeForm.html',
        link : function(scope, el, attrs){
            var init = false;
            var dateService;
            var deregister = scope.$watch('event.dates', function(value){
                if (value && !init) {
                    deregister();
                }
                init = true;
                dateService = new DatePickerService(scope.event.dates);
                scope.unsetDate = function(date){
                    dateService.removeDate(date);
                }
            });
        }
    }
})
.directive('timePicker', function($timeout){
    return {
        scope : {
            model : '=ngModel'
        },
        require : 'ngModel',
        link : function(scope, el, attrs, ngModel){
            ngModel.$viewChangeListeners.push(function(){
                scope.model = ngModel.$modelValue;
            });

            ngModel.$parsers.push(function (value) {
                if (!value) return;
                return Date.parse(value);
            });

            ngModel.$validators.time = function(modelValue, viewValue){
                if (ngModel.$isEmpty(modelValue)) return true;
                var time = Date.parse(modelValue);
                if (time) {
                    ngModel.$setViewValue(time.toString("hh:mm tt"));
                    ngModel.$render();
                    return true;
                }
                return false;
            }
        }
    }
});
