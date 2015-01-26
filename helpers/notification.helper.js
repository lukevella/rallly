/*
    Email Notifications Helper Class
*/

var app = require('../app');
var communicator = require('../communicator');
var debug = require('debug')('notification');
var mandrill = require('mandrill-api');
var mandrill_client = new mandrill.Mandrill(app.get('mandrillAPIKey'));

communicator.on('event:create', function(event){
    if (!event.creator.allowNotifications && event.isClosed) return;
    sendEmailConfirmation(event);
    sendInvites(event);
});

communicator.on('event:update:creator.email', function(event, oldEvent){
    if (!event.creator.allowNotifications && event.isClosed) return;
    verifyEmail(event);
});

communicator.on('event:delete', function(event){
    deleteConfirmation(event);
});

// Send confirmation to the creator of the event with a link to verify the creators email address
var sendEmailConfirmation = function(event){
    var message = {
        subject : "Rallly: " + event.title + " - Verify Email Address",
        from_email : 'noreply@rallly.co',
        from_name : 'Rallly',
        to: [{
            'email': event.creator.email
        }],
        global_merge_vars : [{
            'name' : 'TITLE',
            'content' : 'Your event ' + event.title + ' has been created successfully.'
        }, {
            'name' : 'MESSAGE',
            'content' : 'Hi ' + event.creator.name + ',<br /><br />' +
                        'An email has been sent to each participant with a link to the event.<br /><br />' +
                        'Important: To continue receiving email notifications about this event, please click the button below to verify your email address.'
        }, {
            'name' : 'BUTTONTEXT',
            'content' : 'Verify Email Address'
        }, {
            'name' : 'BUTTONLINK',
            'content' : app.get('absoluteUrl')('verify/'+event._id+'/code/'+event.__private.verificationCode)
        }]
    }
    mandrill_client.messages.sendTemplate({
        message : message,
        template_name : 'rallly-standard',
        async : true,
        template_content : []
    }, mandrillSuccessHandler, mandrillErrorHandler);
}

// Send an invite to all participants of the evnet
var sendInvites = function(event){
    event.emails.forEach(function(item){
        var toEmail = item.email;
        var message = {
            subject : "Rallly: " + event.title,
            from_email : 'noreply@rallly.co',
            from_name : 'Rallly',
            to: [{
                'email': toEmail
            }],
            headers : {
                'Reply-To' : event.creator.email
            },
            global_merge_vars : [{
                'name' : 'TITLE',
                'content' :  event.creator.name + ' has invited you to participate in their event: ' + event.title,            }, {
                'name' : 'MESSAGE',
                'content' : 'Rallly is a free collaborative scheduling service that lets you and your friends vote on a date to host an event. ' +
                            'Click on the button below to visit the event page and vote on the dates that best suit you. '
            }, {
                'name' : 'BUTTONTEXT',
                'content' : 'View Event'
            }, {
                'name' : 'BUTTONLINK',
                'content' : app.get('absoluteUrl')(event._id)
            }]
        }
        mandrill_client.messages.sendTemplate({
            message : message,
            template_name : 'rallly-standard',
            async : true,
            template_content : []
        }, mandrillSuccessHandler, mandrillErrorHandler);
    })
}

// This message is sent when the user want to verify an email address after the event has been created
var verifyEmail = function(event){
    var message = {
        subject : "Rallly: " + event.title + " - Verify Email Address",
        from_email : 'noreply@rallly.co',
        from_name : 'Rallly',
        to: [{
            'email': event.creator.email
        }],
        global_merge_vars : [{
            'name' : 'TITLE',
            'content' : 'Please verify your email address to receive updates from this event.'
        }, {
            'name' : 'MESSAGE',
            'content' : 'Hi ' + event.creator.name + ',<br /><br />' +
            'If you would like to receive email updates from this event, please click on the button below to verify your email address.'
        }, {
            'name' : 'BUTTONTEXT',
            'content' : 'Verify Email Address'
        }, {
            'name' : 'BUTTONLINK',
            'content' : app.get('absoluteUrl')('verify/'+event._id+'/code/'+event.__private.verificationCode)
        }]
    }
    mandrill_client.messages.sendTemplate({
        message : message,
        template_name : 'rallly-standard',
        async : true,
        template_content : []
    }, mandrillSuccessHandler, mandrillErrorHandler);
}

var sendUpdate = function(event){
    var message = {
        subject : "Rallly: " + event.title + " - Verify Email Address",
        from_email : 'noreply@rallly.co',
        from_name : 'Rallly',
        to: [{
            'email': event.creator.email
        }],
        global_merge_vars : [{
            'name' : 'Name',
            'content' : event.creator.name
        }, {
            'name' : 'Event',
            'content' : event.title
        }, {
            'name' : 'VerifyUrl',
            'content' : app.get('absoluteUrl')('verify/'+event._id+'/code/'+event.creator.verificationCode)
        }]
    }
    mandrill_client.messages.sendTemplate({
        message : message,
        template_name : 'rallly-standard',
        async : true,
        template_content : []
    }, mandrillSuccessHandler, mandrillErrorHandler);
}

var deleteConfirmation = function(event){
    var message = {
        subject : "Rallly: " + event.title + " - Delete Request",
        from_email : 'noreply@rallly.co',
        from_name : 'Rallly',
        to: [{
            'email': event.creator.email
        }],
        global_merge_vars : [{
            'name' : 'TITLE',
            'content' : 'Are you sure you want to delete ' + event.title + '?'
        }, {
            'name' : 'MESSAGE',
            'content' : 'Hi ' + event.creator.name + ',<br /><br />' +
            'A request has been made to delete this event. If you would like to delete it click the button below. If you did not make this request, please ignore this email.'
        }, {
            'name' : 'BUTTONTEXT',
            'content' : 'Delete Event'
        }, {
            'name' : 'BUTTONLINK',
            'content' : app.get('absoluteUrl')('delete/'+event._id+'/code/'+event.__private.deleteCode)
        }]
    }
    mandrill_client.messages.sendTemplate({
        message : message,
        template_name : 'rallly-standard',
        async : true,
        template_content : []
    }, mandrillSuccessHandler, mandrillErrorHandler);
}

var mandrillSuccessHandler = function(result){
    if (result.length == 1) {
        debug('Email sent to ' + result[0].email);
    } else {
        debug('Email sent to ' + result.length + ' recipients');
    }
}

var mandrillErrorHandler = function(e){
    debug('A mandrill error occurred: ' + e.name + ' - ' + e.message);
}
