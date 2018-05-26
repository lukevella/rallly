/*
    Email Notifications Helper Class
*/

var app = require('../app');
var communicator = require('../communicator');
var debug = require('debug')('rallly');
var nodemailer = require('nodemailer');
var hbs = require('nodemailer-express-handlebars');

var transportConfig = {
    auth: {
        user: app.get('smtpUser'),
        pass: app.get('smtpPwd')
    }
};

// create reusable transporter object
if (app.get('smtpService')) {
    transportConfig.service = app.get('smtpService')
} else {
    transportConfig.host = app.get('smtpHost');
    transportConfig.port = app.get('smtpPort');
    transportConfig.secure = app.get('smtpSecure');
}
let transporter = nodemailer.createTransport(transportConfig);
var hbsOpts = {
    viewEngine: 'express-handlebars',
    viewPath: 'views/emails'
};
transporter.use('compile', hbs(hbsOpts));

// verify connection configuration
transporter.verify(function (error, success) {
    if (error) {
        debug(error);
    } else {
        debug('Server is ready to take our messages');
    }
});

var sendEmail = function (options) {
    let mailOptions = {
        from: app.get('smtpFrom'),
        to: options.to,
        subject: options.subject,
        template: 'email',
        context: {
            buttonText: options.buttonText,
            buttonURL: options.buttonURL,
            message: options.message,
            title: options.title
        }
    };
    if (options.replyto) {
        mailOptions.replyTo = options.replyto;
    }

    return transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return debug(error);
        }
        debug('Message %s sent: %s', info.messageId, info.response);
    });
};

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
    if (!event.creator.allowNotifications || !event.creator.isVerified || event.isExample) return;
    sendNewParticipantNotification(event, participant);
});

communicator.on('comment:add', function (event, comment) {
    if (!event.creator.allowNotifications || !event.creator.isVerified || event.isExample) return;
    sendNewCommentNotification(event, comment);
});

// Send confirmation to the creator of the event with a link to verify the creators email address
var sendEmailConfirmation = function (event) {
    sendEmail({
        to: event.creator.email,
        subject: 'Rallly: ' + event.title + ' - Verify Email Address',
        title: 'Your event ' + event.title + ' has been created successfully.',
        buttonText: 'Verify Email Address',
        buttonURL: app.get('absoluteUrl')('verify/' + event._id + '/code/' + event.__private.verificationCode),
        message: `Hi ${event.creator.name},<br /><br />` +
            'An email has been sent to each participant with a link to the event.<br /><br />' +
            'Important: To continue receiving email notifications about this event, please click the button below to verify your email address.'
    });
}

// Send an invite to all participants of the evnet
var sendInvites = function (event) {
    event.emails.forEach(function (item) {
        sendEmail({
            to: item.email,
            subject: 'Rallly: ' + event.title,
            title: event.creator.name + ' has invited you to participate in their event: ' + event.title,
            replyto: event.creator.email,
            buttonText: 'View Event',
            buttonURL: app.get('absoluteUrl')(event._id),
            message: 'Rallly is a free collaborative scheduling service that lets you and your friends vote on a date to host an event. ' +
                'Click on the button below to visit the event page and vote on the dates that best suit you.'
        });
    });
}

// This message is sent when the user want to verify an email address after the event has been created
var verifyEmail = function (event) {
    sendEmail({
        to: event.creator.email,
        subject: 'Rallly: ' + event.title + ' - Verify Email Address',
        title: 'Please verify your email address to receive updates from this event.',
        buttonText: 'Verify Email Address',
        buttonURL: app.get('absoluteUrl')('verify/' + event._id + '/code/' + event.__private.verificationCode),
        message: `Hi ${event.creator.name},<br /><br />` +
            `If you would like to receive email updates from this event, please click on the button below to verify your email address.`
    });
}

var sendNewParticipantNotification = function (event, participant) {
    sendEmail({
        to: event.creator.email,
        subject: 'Rallly: ' + event.title + ' - New Participant',
        title: participant.name + ' has voted!',
        buttonText: 'View Event',
        buttonURL: app.get('absoluteUrl')(event._id),
        message: `Hi ${event.creator.name},<br /><br />` +
            'Click the button below to see the updates made to your event page!'
    });
}

var sendNewCommentNotification = function (event, comment) {
    sendEmail({
        to: event.creator.email,
        subject: 'Rallly: ' + event.title + ' - New Comment',
        title: comment.author.name + ' has commented on your event!',
        buttonText: 'View Event',
        buttonURL: app.get('absoluteUrl')(event._id),
        message: `Hi ${event.creator.name},<br /><br />` +
            'Click the button below to see the updates made to your event page!'
    });
}
