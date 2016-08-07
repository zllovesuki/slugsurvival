module.exports = function(_, router) {
	router.beforeEach(function (transition) {
		if (_.state.flatTermsList.length === 0) {
			router.app.fetchTerms().then(function() {
				transition.next();
			})
		}else{
			transition.next();
		}
	})
}
