module.exports = function (app) {
    var env = process.env;
    var config = require('../config.json');
    var isSecure = false;
    app.set('port', env.PORT || config.port);
    app.set('siteUrl', env.SITE_URL || config.siteUrl);
    app.set('absoluteUrl', function (path) {
        return app.get('siteUrl') + '/' + path;
    });
    app.set('fromName', env.FROM_NAME || config.fromName);
    app.set('fromEmail', env.FROM_EMAIL || config.fromEmail);
    app.set('db', env.MONGO_URL || config.db);

    // SMTP settings
    app.set('smtpService', env.SMTP_SERVICE || config.smtpService);
    app.set('smtpUser', env.SMTP_USER || config.smtpUser);
    app.set('smtpPwd', env.SMTP_PWD || config.smtpPwd);
    app.set('smtpHost', env.SMTP_HOST || config.smtpHost);
    app.set('smtpPort', env.SMTP_PORT || config.smtpPort || 587);
    
    if (env.SMTP_SECURE) isSecure = (env.SMTP_SECURE == 'true');
    else isSecure = (config.smtpSecure == 'true');
    app.set('smtpSecure', isSecure);
    app.set('smtpFrom', `"${app.get('fromName')}" <${app.get('fromEmail')}>`);
};
