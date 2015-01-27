module.exports = function(app){
    app.set('port', 3000);
    app.set('siteUrl', 'http://localhost');
    app.set('absoluteUrl', function(path){
        return app.get('siteUrl') + ':' + app.get('port') + '/' + path;
    });
    app.set('dbname', 'rallly');
    app.set('dbuser', 'rallly');
    app.set('dbpwd', 'vVgbBmuEQD72a');
    app.set('mandrillAPIKey','suEKoTkjRDeYie0Wd16Knw');
};
