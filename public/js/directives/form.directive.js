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
        templateUrl : 'templates/directives/eventForm/userForm.html',
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
        templateUrl : 'templates/directives/eventForm/eventForm.html',
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
        templateUrl : 'templates/directives/eventForm/dateForm.html'
    }
})
.directive('participantsForm', function(FormHelper){
    return {
        scope : {
            event : '=',
            form : '='
        },
        templateUrl : 'templates/directives/eventForm/participantsForm.html',
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
        templateUrl : 'templates/directives/eventForm/settingsForm.html',
        link : function(scope, el, attrs){
            scope.deleteEvent = function(){
                if (scope.deleteRequestSent) return;
                Event.delete({'id' : scope.event._id}, function(){
                    scope.deleteRequestSent = true;
                    var modal = new ConfirmModal({
                        title : 'Delete Request Sent',
                        message : 'An email has been sent to the creator of this event with instructions to delete it.',
                        cancelText : 'OK'
                    });
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
});
