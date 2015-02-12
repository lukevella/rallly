angular.module('rallly')
.controller('ExampleCtrl', function($state, Event){
    // Generate dates

    var dates = [], date = new Date();
    for (var i = 0; i < 4; i++){
        dates.push(date.add(Math.ceil(Math.random() * 5)).days().toISOString());
    }
    // Generate Participants
    var examplesNames = ['John Example', 'Jane Specimen','Mark Instance', 'Mary Case'];
    var examples = [];
    for (var i = 0; i < examplesNames.length; i++){
        var example = { name : examplesNames[i] };
        example.votes = [];
        for (var j = 0; j <  dates.length; j++){
            var answer = Math.random()<.5;
            example.votes[j] = answer;
        }
        examples.push(example);
    }
    var event =  new Event({
        "creator": {
         "name": "John Example",
         "email": "rallly@lukevella.com",
         "allowNotifications" : false
        },
        "title": "Lunch Meeting",
        "location": "Starbucks, 901 New York Avenue",
        "description": "This event has been automatically generated just for you! Feel free to try out all the different features and when you're ready, you can schedule a new event.",
        "dates" : dates,
        "participants" : examples,
        "emails": [],
        "comments" : [{
            author : {
                name : "John Example"
            },
            content : "Hey guys, this is a comment!"
        }, {
            author : {
                name : "Mark Instance"
            },
            content : "Hi John... nice comment. Keep up the great work!"
        }, {
            author : {
                name : "John Example"
            },
            content : "Thank you!"
        }],
        "isExample" : true
    });
    event.$save(function(data){
        $state.go('event', { id : data._id }, {
            location : "replace"
        });
    })
});
