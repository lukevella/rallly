module.exports = function (app) {
    var env = process.env;
    var config = require('./config.json');
    app.set('port', env.PORT || config.port);
    app.set('siteUrl', env.SITE_URL || config.siteUrl); // Used for creating an absolute URL - include port
    app.set('absoluteUrl', function (path) {
        return app.get('siteUrl') + '/' + path;
    });
    app.set('fromName', env.FROM_NAME || config.fromName); // Email from name
    app.set('fromEmail', env.FROM_EMAIL || config.fromEmail); // Email from address
    app.set('dbaddress', env.DB_ADDRESS || config.dbAddress); // MongoDB database name
    app.set('dbname', env.DB_NAME || config.dbName); // MongoDB database name
    app.set('dbuser', config.dbUser); // MongoDB user name - can be blank if authentication is disabled
    app.set('dbpwd', config.dbPwd); // MongoDB user password - can be blank if authentication is disabled
    app.set('sendGridAPIKey', env.SG_KEY || config.sgApiKey); // https://sendgrid.com
    app.set('sendGridTemplateId', env.SG_TEMPLATE_ID || config.sgTemplateId); // https://sendgrid.com
    console.log(app.get('dbaddress'));
};