angular.module('rallly')
.directive('discussion', function($timeout, Comment, ConfirmModal, Communicator){
    return {
        restrict : 'A',
        templateUrl : 'templates/directives/discussion.html',
        scope : {
            'event' : '='
        },
        link : function(scope, el, attrs){
            scope.comment = {};
            var thread = angular.element('.comment-thread');
            $timeout(function(){
                thread.scrollTop(thread.prop('scrollHeight'));
            });
            scope.deleteComment = function(comment){
                var modal = new ConfirmModal({
                    title : 'Are you sure?',
                    message : 'Are you sure you want to remove this comment?',
                    confirmText : 'Yes - delete',
                    cancelText : 'No - nevermind',
                    isDestructive : true,
                    confirm : function(){
                        Comment.remove({ id : scope.event._id , cid : comment._id }, function(event){
                            scope.event = event;
                        });
                    }
                });
            }
            scope.postComment = function(){
                if (scope.commentForm.$valid){
                    var comment = new Comment(scope.comment);
                    comment.$save({id:scope.event._id}, function(event){
                        scope.event = event;
                        scope.comment = {};
                        Communicator.trigger('add:comment', event);
                    });
                    scope.commentForm.$setPristine();
                }
            }
        }
    }
});
