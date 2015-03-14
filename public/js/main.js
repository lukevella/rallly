angular.module('rallly', ['ui.router','ngResource','btford.modal','ngTagsInput','ngAnimate','ngSanitize'])
    .config(function($stateProvider, $urlRouterProvider, $locationProvider){
        $locationProvider.html5Mode(true);
        $urlRouterProvider.otherwise(function($injector, $location){
            var $state = $injector.get('$state');
            $state.go('notfound');
        });
        $stateProvider
        .state('newevent',{
            url : '/new',
            templateUrl : 'templates/newevent.html',
            controller : 'NewEventCtrl',
        })
        .state('deletedevent',{
            templateUrl : 'templates/deletedevent.html',
        })
        .state('newevent.success', {
            templateUrl : 'templates/newEvent/success.html'
        })
        .state('about', {
            url : '/about',
            templateUrl : 'templates/about.html',
            controller : 'AboutCtrl'
        })
        .state('example', {
            url : '/example',
            controller : 'ExampleCtrl'
        })
        .state('notfound', {
            templateUrl : 'templates/notfound.html'
        })
        .state('event',{
            url : '/:id',
            templateUrl : 'templates/event.html',
            controller : 'EventCtrl'
        })
        .state('editevent', {
            url: '/:id/edit',
            templateUrl : 'templates/editevent.html',
            controller : 'EditEventCtrl'
        })
        .state('verifyevent', {
            url : '/verify/:id/code/:code',
            controller : 'VerificationCtrl'
        })
        .state('deleteevent', {
            url : '/delete/:id/code/:code',
            controller : 'DeletionCtrl'
        })
    })
    .factory('Event', function($resource){
        return $resource('/api/event/:id', { id : '@_id' }, {
            'update' : { method : 'PUT' },
            'verify' : { method : 'GET', url : '/api/event/:id/code/:code' },
            'destroy': { method : 'DELETE', url: '/api/event/:id/code/:code' }
        });
    })
    .factory('Participant', function($resource){
        return $resource('/api/event/:id/participant/:pid', { id: '@_id'}, {
            'update' : { method : 'PUT' }
        });
    })
    .factory('Comment', function($resource){
        return $resource('/api/event/:id/comment/:cid', { id : '@_id' }, {
            'update' : { method : 'PUT' }
        })
    })
    .factory('Title', function(){
        return {
            set : function(title){
                document.title = title;
            }
        }
    });
