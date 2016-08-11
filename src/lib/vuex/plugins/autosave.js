module.exports = function(storage) {
	return function(store) {
		store.subscribe(function(mutation, state) {
			if (mutation.type === 'pushToEventSource') {
				console.log(mutation.payload)
			}
		})
	}
}
