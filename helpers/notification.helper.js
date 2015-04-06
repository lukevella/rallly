/*
 Email Notifications Helper Class
 */

var app = require('../app');
var communicator = require('../communicator');
var debug = require('debug')('rallly');
var mandrill = require('mandrill-api');
var mandrill_client = new mandrill.Mandrill(app.get('mandrillAPIKey'));

communicator.on('event:create', function (event) {
    sendInvites(event);
    if (!event.creator.allowNotifications || event.isClosed || event.isExample) return;
    sendEmailConfirmation(event);
});

communicator.on('event:update:creator.email', function (event, oldEvent) {
    if (!event.creator.allowNotifications || event.isClosed || event.isExample) return;
    verifyEmail(event);
});

communicator.on('participant:add', function (event, participant) {
    if (!event.creator.allowNotifications || event.isExample) return;
    sendNewParticipantNotification(event, participant);
});

communicator.on('comment:add', function (event, comment) {
    if (!event.creator.allowNotifications || event.isExample) return;
    sendNewCommentNotification(event, comment);
});

// Send confirmation to the creator of the event with a link to verify the creators email address
var sendEmailConfirmation = function (event) {
    var message = {
        subject: "Rallly: " + event.title + " - Verify Email Address",
        from_email: 'noreply@rallly.co',
        from_name: 'Rallly',
        to: [{
            'email': event.creator.email
        }],
        global_merge_vars: [{
            'name': 'TITLE',
            'content': 'Your event ' + event.title + ' has been created successfully.'
        }, {
            'name': 'MESSAGE',
            'content': 'Hi ' + event.creator.name + ',<br /><br />' +
            'An email has been sent to each participant with a link to the event.<br /><br />' +
            'Important: To continue receiving email notifications about this event, please click the button below to verify your email address.'
        }, {
            'name': 'BUTTONTEXT',
            'content': 'Verify Email Address'
        }, {
            'name': 'BUTTONLINK',
            'content': app.get('absoluteUrl')('verify/' + event._id + '/code/' + event.__private.verificationCode)
        }]
    };
    mandrill_client.messages.sendTemplate({
        message: message,
        template_name: 'rallly-standard',
        async: true,
        template_content: []
    }, mandrillSuccessHandler, mandrillErrorHandler);
};

// Send an invite to all participants of the evnet
var sendInvites = function (event) {
    event.emails.forEach(function (item) {
        var toEmail = item.email;
        var message = {
            subject: "Rallly: " + event.title,
            from_email: 'noreply@rallly.co',
            from_name: 'Rallly',
            to: [{
                'email': toEmail
            }],
            headers: {
                'Reply-To': event.creator.email
            },
            global_merge_vars: [{
                'name': 'TITLE',
                'content': event.creator.name + ' has invited you to participate in their event: ' + event.title,
            }, {
                'name': 'MESSAGE',
                'content': 'Rallly is a free collaborative scheduling service that lets you and your friends vote on a date to host an event. ' +
                'Click on the button below to visit the event page and vote on the dates that best suit you. '
            }, {
                'name': 'BUTTONTEXT',
                'content': 'View Event'
            }, {
                'name': 'BUTTONLINK',
                'content': app.get('absoluteUrl')(event._id)
            }]
        };
        mandrill_client.messages.sendTemplate({
            message: message,
            template_name: 'rallly-standard',
            async: true,
            template_content: []
        }, mandrillSuccessHandler, mandrillErrorHandler);
    })
};

// This message is sent when the user want to verify an email address after the event has been created
var verifyEmail = function (event) {
    var message = {
        subject: "Rallly: " + event.title + " - Verify Email Address",
        from_email: 'noreply@rallly.co',
        from_name: 'Rallly',
        to: [{
            'email': event.creator.email
        }],
        global_merge_vars: [{
            'name': 'TITLE',
            'content': 'Please verify your email address to receive updates from this event.'
        }, {
            'name': 'MESSAGE',
            'content': 'Hi ' + event.creator.name + ',<br /><br />' +
            'If you would like to receive email updates from this event, please click on the button below to verify your email address.'
        }, {
            'name': 'BUTTONTEXT',
            'content': 'Verify Email Address'
        }, {
            'name': 'BUTTONLINK',
            'content': app.get('absoluteUrl')('verify/' + event._id + '/code/' + event.__private.verificationCode)
        }]
    };
    mandrill_client.messages.sendTemplate({
        message: message,
        template_name: 'rallly-standard',
        async: true,
        template_content: []
    }, mandrillSuccessHandler, mandrillErrorHandler);
};

var sendNewParticipantNotification = function (event, participant) {
    var message = {
        subject: "Rallly: " + event.title + " - New Partcipant",
        from_email: 'noreply@rallly.co',
        from_name: 'Rallly',
        to: [{
            'email': event.creator.email
        }],
        global_merge_vars: [{
            'name': 'TITLE',
            'content': participant.name + ' has voted!'
        }, {
            'name': 'MESSAGE',
            'content': 'Hi ' + event.creator.name + ',<br /><br />' +
            'Click the button below to see the updates made to your event page!'
        }, {
            'name': 'BUTTONTEXT',
            'content': 'View Event'
        }, {
            'name': 'BUTTONLINK',
            'content': app.get('absoluteUrl')(event._id)
        }]
    };
    mandrill_client.messages.sendTemplate({
        message: message,
        template_name: 'rallly-standard',
        async: true,
        template_content: []
    }, mandrillSuccessHandler, mandrillErrorHandler);
};

var sendNewCommentNotification = function (event, comment) {
    var message = {
        subject: "Rallly: " + event.title + " - New Comment",
        from_email: 'noreply@rallly.co',
        from_name: 'Rallly',
        to: [{
            'email': event.creator.email
        }],
        global_merge_vars: [{
            'name': 'TITLE',
            'content': comment.author.name + ' has commented on your event!'
        }, {
            'name': 'MESSAGE',
            'content': 'Hi ' + event.creator.name + ',<br /><br />' +
            'Click the button below to see the updates made to your event page!'
        }, {
            'name': 'BUTTONTEXT',
            'content': 'View Event'
        }, {
            'name': 'BUTTONLINK',
            'content': app.get('absoluteUrl')(event._id)
        }]
    };
    mandrill_client.messages.sendTemplate({
        message: message,
        template_name: 'rallly-standard',
        async: true,
        template_content: []
    }, mandrillSuccessHandler, mandrillErrorHandler);
};

var mandrillSuccessHandler = function (result) {
    if (result.length == 1) {
        debug('Email sent to ' + result[0].email);
    } else {
        debug('Email sent to ' + result.length + ' recipients');
    }
};

var mandrillErrorHandler = function (e) {
    debug('A mandrill error occurred: ' + e.name + ' - ' + e.message);
};
