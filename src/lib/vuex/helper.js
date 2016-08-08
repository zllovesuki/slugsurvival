var self = module.exports = {

	intersect: function(a, b) {
		var t;
		if (b.length > a.length) t = b, b = a, a = t; // indexOf to loop over shorter
		return a
			.filter(function(e) {
				return b.indexOf(e) !== -1;
			})
			.filter(function(e, i, c) { // extra step to remove duplicates
				return c.indexOf(e) === i;
			});
	}, // http://stackoverflow.com/questions/16227197/compute-intersection-of-two-arrays-in-javascript

	getHeader: function(state) {
		return {
			headers: {}
		}
	},

	_http: function($http, state, action, endpoint, header, data) {
		header = !!header ? self.getHeader(state) : {};
		data = data || {};
		var handle;
		if (action === 'get') handle = $http[action](endpoint, header)
		else handle = $http[action](endpoint, data, header)
		return handle
			.then(function(res) {
				return res;
			})
			.catch(function(res) {
				var data = res.json();
				if (data.hasOwnProperty('message')) {
					state.alert.error(data.message);
				} else {
					state.alert.error(res.statusText);
				}
			})
	},

	getWithHeader: function($http, state, endpoint) {
		return self._http($http, state, 'get', endpoint, true)
	},

	postWithHeader: function($http, state, endpoint, data) {
		return self._http($http, state, 'post', endpoint, true, data)
	},

	postWithoutHeader: function($http, state, endpoint, data) {
		return self._http($http, state, 'post', endpoint, false, data)
	}
}
