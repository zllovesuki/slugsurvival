module.exports = {
	alert: function(state) {
		return state.alert;
	},
	route: function(state) {
		return state.route
	},
	title: function(state) {
		return state.title;
	},
	termId: function(state) {
		return state.route.params.termId;
	},
	termName: function(state) {
		return state.termName;
	},
	flatTermsList: function(state) {
		return state.flatTermsList;
	},
	termsList: function(state) {
		return state.termsList;
	},
	indexSearch: function(state) {
		return state.search;
	},
	courses: function(state) {
		return state.courses;
	},
	flatCourses: function(state) {
		return state.flatCourses;
	},
	courseInfo: function(state) {
		return state.courseInfo;
	},
	eventSource: function(state) {
		return state.eventSource
	}
}
