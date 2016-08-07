var ucsc = require('ucsc');
var Promise = require('bluebird');
var fs = require('fs');

function write(name, json) {
	return new Promise(function(resolve, reject) {
		fs.writeFile(name, json, function(err) {
		    if (err) {
		        return reject(err);
		    }
			return resolve();
		});
	})
}

ucsc.getTerms().then(function(terms) {
	return write('./public/db/terms.json', JSON.stringify(terms)).then(function() {
		return Promise.map(terms, function(term) {
			return ucsc.getCourses(term.code, 3000).then(function(courses) {
				return write('./public/db/' + term.code + '.json', JSON.stringify(courses)).then(function() {
					console.log(term.name, 'saved to', './public/db/' + term.code + '.json');
				})
			}).catch(function(e) {
				console.error('Error saving', term.name)
			})
		}, { concurrency: 1 })
	})
})
