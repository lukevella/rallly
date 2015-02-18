angular.module('rallly')
.directive('discussion', function($timeout, Comment, ConfirmModal, Communicator){
    return {
        restrict : 'A',
        templateUrl : 'templates/directives/discussion.html',
        scope : {
            'event' : '='
        },
        controllerAs : 'discussionCtrl',
        controller : function($scope, $rootScope){
            $scope.comment = { author : {}, comment : '' };
            $rootScope.$on('add:participant', function(e, event, participant){
                $scope.comment.author.name = participant.name;
            });
            this.deleteComment = function(comment){
                var modal = new ConfirmModal({
                    title : 'Are you sure?',
                    message : 'Are you sure you want to remove this comment?',
                    confirmText : 'Yes - delete',
                    cancelText : 'No - nevermind',
                    isDestructive : true,
                    confirm : function(){
                        Comment.remove({ id : $scope.event._id , cid : comment._id }, function(event){
                            $scope.event = event;
                        });
                    }
                });
            }
            this.postComment = function(){
                if ($scope.commentForm.$valid){
                    var comment = new Comment($scope.comment);
                    comment.$save({id:$scope.event._id}, function(event){
                        $scope.event = event;
                        Communicator.trigger('add:comment', event, $scope.comment);
                        $scope.comment.content = '';
                        $timeout($scope.scrollToBottom);
                    });
                    $scope.commentForm.$setPristine();
                }
            }
            $scope.scrollToBottom = function(){
                var thread = angular.element('.comment-thread');
                thread.scrollTop(thread.prop('scrollHeight'));
            }
        },
        link : function(scope, el, attrs){
            $timeout(scope.scrollToBottom);
        }
    }
});
