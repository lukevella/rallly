angular.module('rallly', ['ui.router','ngResource','ngFx'])
    .config(function($stateProvider, $urlRouterProvider, $locationProvider){
        $locationProvider.html5Mode(true);
        $urlRouterProvider.otherwise("/notfound")
        $stateProvider
        .state('index',{
            url : '/',
            templateUrl : 'templates/newevent.html',
            controller : 'NewEventCtrl'
        })
        .state('about', {
            url : '/about',
            templateUrl : 'templates/about.html'
        })
        .state('notfound', {
            url : '/notfound',
            templateUrl : 'templates/notfound.html'
        })
        .state('editevent', {
            url: '/:id/edit',
            templateUrl : 'templates/editevent.html',
            controller : 'EditEventCtrl'
        })
        .state('event',{
            url : '/:id',
            templateUrl : 'templates/event.html',
            controller : 'EventCtrl'
        })
    })
    .factory('Event', function($resource){
        return $resource('/api/event/:id', { id : '@_id' }, {
            'update' : { method : 'PUT' }
        });
    })
    .factory('Participant', function($resource){
        return $resource('/api/event/:id/participant/:pid', { id: '@_id', pid : '@pid'}, {
            'update' : { method : 'PUT' }
        });
    });
