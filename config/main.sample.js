module.exports = function(app){
    app.set('port', 3000);
    app.set('siteUrl', 'http://localhost');
    app.set('absoluteUrl', function(path){
        return app.get('siteUrl') + ':' + app.get('port') + '/' + path;
    });
    app.set('mandrillAPIKey',''); // Put your Mandrill API Key Here.
};
