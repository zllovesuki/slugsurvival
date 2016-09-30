module.exports = function() {
    var express = require('express'),
        path = require('path'),
        config = require('./config.js'),
        fs = require('fs'),
        app = express();

    app.enable('trust proxy');
    app.set('trust proxy', 'loopback, linklocal, uniquelocal');

    var root;

    app.use('/public', express.static(path.join(__dirname, 'public')));

    if (process.env.RDB_HOST) {
        root = __dirname + '/src/static/dev.html'
    }else{
        root = __dirname + '/src/static/prod.html';
    }

    var html = fs.readFileSync(root).toString('utf-8');
    var analytics = '';

    if (config.analytics && config.analytics.piwik && config.analytics.piwik.enabled) {
        analytics = fs.readFileSync(__dirname + '/src/static/piwik.tmpl').toString('utf-8');
        analytics = analytics.replace('__ENDPOINT__', config.analytics.piwik.endpoint);
        analytics = analytics.replace('__DOMAIN__', config.analytics.piwik.domain);
        analytics = analytics.replace('__SITEID__', config.analytics.piwik.siteId);
        html = html.replace('__ANALYTICS__', analytics);
    }else{
        html = html.replace('__ANALYTICS__', '');
    }

    app.use('/*', function(req, res, next) {
        return res.end(html);
    });

    // production error handler
    // no stacktraces leaked to user
    app.use(function(err, req, res, next) {
      res.status(err.status || 500);
      res.send({
          message: err.message,
          error: {}
      });
    });

    return app;
};
