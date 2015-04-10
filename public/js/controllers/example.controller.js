angular.module('rallly')
    .controller('ExampleCtrl', function ($state, Event) {

        // Generate Participants
        var examplesNames = ['John Example', 'Jane Specimen', 'Mark Instance', 'Mary Case'];
        var examples = [];
        _.forEach(examplesNames, function (name) {
            examples.push({
                name: name
            });
        });

        // Generate dates
        var dates = [];
        var numberDatesToGenerate = 4;
        var baseDate = new Date();
        baseDate.setSeconds(0);
        baseDate.setMilliseconds(0);

        for (var i = 0; i < numberDatesToGenerate; ++i) {
            var randomDate = {
                raw_date: baseDate.add(Math.ceil(Math.random() * 5)).days().toISOString(),
                possible_times: []
            };
            for (var j = 0; j < Math.ceil(Math.random() * 3); ++j) {
                var startTime = baseDate.add(Math.ceil(Math.random() * 5000)).minutes().toISOString();
                var endTime = (new Date(startTime)).add(Math.ceil(Math.random() * 5000)).minutes().toISOString();
                randomDate.possible_times.push({
                    start_time: startTime,
                    end_time: endTime
                });
            }
            dates.push(randomDate);
        }

        var event = new Event({
            "creator": {
                "name": "John Example",
                "email": "rallly@lukevella.com",
                "allowNotifications": false
            },
            "title": "Lunch Meeting",
            "location": "Starbucks, 901 New York Avenue",
            "description": "This event has been automatically generated just for you! Feel free to try out all the different features and when you're ready, you can schedule a new event.",
            "dates": dates,
            "participants": examples,
            "emails": [],
            "comments": [{
                author: {
                    name: "John Example"
                },
                content: "Hey guys, this is a comment!"
            }, {
                author: {
                    name: "Mark Instance"
                },
                content: "Hi John... nice comment. Keep up the great work!"
            }, {
                author: {
                    name: "John Example"
                },
                content: "Thank you!"
            }],
            "isExample": true
        });
        event.$save(function (data) {
            // Generate votes
            _.forEach(data.dates, function (date) {
                _.forEach(date.possible_times, function (time) {
                    time.voted_by = _.sample(_.pluck(data.participants, '_id'), _.random(data.participants.length));
                });
            });

            Event
                .update({id: data._id}, data, function (updatedEvent) {
                    $state.go('event', {id: updatedEvent._id}, {
                        location: "replace"
                    });
                });
        })
    });
