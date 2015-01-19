angular.module('rallly')
.service('FormHelper', function(){
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

            scope.emailRegex = /^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/;

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
.directive('participantsForm', function(){
    return {
        scope : {
            event : '=',
            form : '='
        },
        templateUrl : 'templates/directives/eventForm/participantsForm.html'
    }
});
