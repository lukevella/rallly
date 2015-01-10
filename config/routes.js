module.exports = function(app) {

    // Insert routes below
    app.use('/api/event', require('../api/event'));

    // All undefined asset or api routes should return a 404
    // app.route('/:url(api|auth|components|app|bower_components|assets)/*')
    // .get(errors[404]);

    // All other routes should redirect to the index.html
    app.route('/*')
    .get(function(req, res) {
        res.render('index.ejs');
    });

    if (app.get('env') === 'development') {
        app.use(function(err, req, res, next) {
            res.status(err.status || 500);
            res.render('error.ejs', {
                message: err.message,
                error: err
            });
        });
    }
};
