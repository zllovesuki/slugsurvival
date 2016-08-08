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

	containsAll: function(/* pass all arrays here */) {
	    var output = [];
	    var cntObj = {};
	    var array, item, cnt;
	    // for each array passed as an argument to the function
	    for (var i = 0; i < arguments.length; i++) {
	        array = arguments[i];
	        // for each element in the array
	        for (var j = 0; j < array.length; j++) {
	            item = "-" + array[j];
	            cnt = cntObj[item] || 0;
	            // if cnt is exactly the number of previous arrays,
	            // then increment by one so we count only one per array
	            if (cnt == i) {
	                cntObj[item] = cnt + 1;
	            }
	        }
	    }
	    // now collect all results that are in all arrays
	    for (item in cntObj) {
	        if (cntObj.hasOwnProperty(item) && cntObj[item] === arguments.length) {
	            output.push(item.substring(1));
	        }
	    }
	    return(output);
	}, // http://stackoverflow.com/questions/11076067/finding-matches-between-multiple-javascript-arrays

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
