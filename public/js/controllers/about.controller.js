angular.module('rallly')
.controller('AboutCtrl', function(){
    $(".nav-link").removeClass('active');
    $(".nav-link[href='/about']").addClass('active');
});
