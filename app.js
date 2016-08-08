module.exports = function() {
	var express = require('express'),
		path = require('path'),
		config = require('./config.js'),
		fs = require('fs'),
		app = express();

	app.enable('trust proxy');
	app.set('trust proxy', 'loopback, linklocal, uniquelocal');

	var root = __dirname + '/src/static/prod.html';

	if (process.env.RDB_HOST) {
		root = __dirname + '/src/static/dev.html'
	}

	app.use('/public', express.static(path.join(__dirname, 'public')));
	app.use('/db', express.static(path.join(__dirname, '../', 'ucsc', 'db')));

	app.use('/*', function(req, res, next) {
		return res.sendFile(root);
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
