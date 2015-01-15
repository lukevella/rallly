angular.module('rallly')
.filter('elapsed', function($filter){
    return function(date){
        if (!date) return;
        var time = Date.parse(date),
            timeNow = new Date().getTime(),
            difference = timeNow - time,
            seconds = Math.floor(difference / 1000),
            minutes = Math.floor(seconds / 60),
            hours = Math.floor(minutes / 60),
            days = Math.floor(hours / 24);
        if (days > 30) {
            return 'on ' + $filter('date')(date, 'MMMM d');
        } else if (days > 1) {
            return days + " days ago";
        } else if (days == 1) {
            return "1 day ago"
        } else if (hours > 1) {
            return hours + " hours ago";
        } else if (hours == 1) {
            return "an hour ago";
        } else if (minutes > 1) {
            return minutes + " minutes ago";
        } else if (minutes == 1){
            return "a minute ago";
        } else {
            return "a few seconds ago";
        }
    }
})
