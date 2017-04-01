module.exports = function (app) {
    app.set('port', 3000);
    app.set('siteUrl', ''); // Used for creating an absolute URL - include port
    app.set('absoluteUrl', function (path) {
        return app.get('siteUrl') + '/' + path;
    });
    app.set('fromName', 'Rallly'); // Email from name
    app.set('fromEmail', 'no-reply@rally.co'); // Email from address
    app.set('dbname', ''); // MongoDB database name
    app.set('dbuser', ''); // MongoDB user name - can be blank if authentication is disabled
    app.set('dbpwd', ''); // MongoDB user password - can be blank if authentication is disabled
    app.set('sendGridAPIKey', ''); // https://sendgrid.com
    app.set('sendGridTemplateId', ''); // https://sendgrid.com
};