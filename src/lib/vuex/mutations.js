var elasticlunr = require('elasticlunr')

module.exports = {
	setTitle: function(state, title) {
		state.title = title;
	},
	setTermName: function(state, name) {
		state.termName = name;
	},
	saveTermsList: function(state, terms) {
		state.flatTermsList = terms;
		terms.forEach(function(term) {
			state.termsList[term.code] = term.name;
		})
	},
	saveTermCourses: function(state, termId, courses) {
		state.courses[termId] = true;
		if (typeof state.flatCourses[termId] === 'undefined') {
			state.flatCourses[termId] = {};
		}
		var obj;
		Object.keys(courses).forEach(function(subject) {
			courses[subject].forEach(function(course) {
				obj = course;
				obj.code = [subject, course.code].join(' ');
				state.flatCourses[termId][course.number] = obj;
			})
		})
	},
	saveInstructorNameToTidMapping: function(state, mapping) {
		state.instructorNameToTidMapping = mapping;
	},
	saveInstructorStats: function(state, stats) {
		state.instructorStats[stats.tid] = stats;
	},
	saveCourseInfo: function(state, termId, courses) {
		state.courseInfo[termId] = courses;
	},
	buildIndexedSearch: function(state, termId, json) {
		state.search[termId] = elasticlunr.Index.load(json);
	},
	pushToEventSource: function(state, termId, obj) {
		if (typeof state.events[termId] === 'undefined') state.events[termId] = [];
		state.events[termId].push(obj);
	},
	restoreEventSourceSnapshot: function(state, termId, events) {
		state.events[termId] = events;
	},
	removeFromSource: function(state, termId, courseNumber) {
		if (typeof state.events[termId] === 'undefined') return;
		state.events[termId] = state.events[termId].filter(function(event) {
			return event.number != courseNumber;
		})
	},
	removeEmptySection: function(state, termId, courseNumber) {
		if (typeof state.events[termId] === 'undefined') return;
		state.events[termId] = state.events[termId].filter(function(event) {
			if (event.number !== courseNumber)
				return true;
			if (event.number == courseNumber && typeof(event._number) !== 'undefined')
				return false;
		})
	}
}
