var self = module.exports = {

	arrayUnion: function(arr1, arr2, equalityFunc) {
	    var union = arr1.concat(arr2);

	    for (var i = 0; i < union.length; i++) {
	        for (var j = i+1; j < union.length; j++) {
	            if (equalityFunc(union[i], union[j])) {
	                union.splice(j, 1);
	                j--;
	            }
	        }
	    }

	    return union;
	}, // http://stackoverflow.com/questions/13319150/union-of-array-of-objects-in-javascript

	getHeader: function(state) {
		return {
			headers: {}
		}
	},

	_http: function($http, state, action, endpoint, header, data) {
		header = !!header ? self.getHeader(state): {};
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
			}else{
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
