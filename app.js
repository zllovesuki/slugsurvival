module.exports = function() {
    var express = require('express'),
        path = require('path'),
        config = require('./config.js'),
        bodyParser = require('body-parser'),
        formParser = bodyParser.urlencoded({ extended: true }),
        fs = require('fs'),
        app = express(),
        version = require('./version.json'),
        fillPdf = require('fill-pdf');

    app.enable('trust proxy');
    app.set('trust proxy', 'loopback, linklocal, uniquelocal');

    var root = __dirname + '/src/static/index.html', js = 'prod.js';

    app.use('/public', express.static(path.join(__dirname, 'public')));

    var pdfTemplatePath = __dirname + '/public/academic-planning-form.pdf';

    if (process.env.RDB_HOST) {
        js = 'app.js'
    }

    var html = fs.readFileSync(root).toString('utf-8');
    var analytics = '', drift = '';

    if (config.analytics && config.analytics.piwik && config.analytics.piwik.enabled) {
        analytics = fs.readFileSync(__dirname + '/src/static/piwik.tmpl').toString('utf-8');
        analytics = analytics.replace(new RegExp('__ENDPOINT__', 'g'), config.analytics.piwik.endpoint);
        analytics = analytics.replace(new RegExp('__DOMAIN__', 'g'), config.analytics.piwik.domain);
        analytics = analytics.replace(new RegExp('__SITEID__', 'g'), config.analytics.piwik.siteId);
        html = html.replace('__ANALYTICS__', analytics);
    }else{
        html = html.replace('__ANALYTICS__', '');
    }

    if (config.analytics && config.analytics.drift) {
        drift = fs.readFileSync(__dirname + '/src/static/drift.tmpl').toString('utf-8');
        drift = drift.replace('__DRIFT_VERSION__', config.analytics.drift.version);
        drift = drift.replace('__DRIFT_ID__', config.analytics.drift.id);
        html = html.replace('__DRIFT__', drift);
    }else{
        html = html.replace('__DRIFT__', '');
    }

    html = html.replace('__JS__', js)

    app.get('/version', function(req, res, next) {
        return res.end(version);
    });

    app.post('/fillAcademicPlannerPDF', formParser, function(req, res, next) {
        fillPdf.generatePdf(req.body, pdfTemplatePath, function(err, output) {
            if (err) {
                return next(err);
            }
            res.type('application/pdf');
            res.send(output)
        })
    })

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
