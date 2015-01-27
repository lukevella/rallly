module.exports = function(app){
    app.set('port', 3000);
    app.set('siteUrl', '');
    app.set('absoluteUrl', function(path){
        return app.get('siteUrl') + ':' + app.get('port') + '/' + path;
    });
    app.set('dbname', '');
    app.set('dbuser', '');
    app.set('dbpwd', '');
    app.set('mandrillAPIKey','');
};
