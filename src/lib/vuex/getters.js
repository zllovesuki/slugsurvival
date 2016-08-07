module.exports = {
	alert: function(state) {
		return state.alert;
	},
	termId: function(state) {
		return state.route.params.termId;
	},
	terms: function(state) {
		return state.terms;
	},
	flatTerms: function(state) {
		return state.flatTerms;
	},
	eventSource: function(state) {
		return state.eventSource
	}
}
