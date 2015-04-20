module.exports = function (app) {
    app.set('port', 3000);
    app.set('siteUrl', ''); // Used for creating an absolute URL
    app.set('absoluteUrl', function (path) {
        return app.get('siteUrl') + ':' + app.get('port') + '/' + path;
    });
    app.set('dbname', ''); // MongoDB database name
    app.set('dbuser', ''); // MongoDB user name
    app.set('dbpwd', ''); // MongoDB user password
    app.set('mandrillAPIKey', ''); // https://mandrillapp.com
};
