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
		state.courses[termId] = courses;
		if (typeof state.flatCourses[termId] === 'undefined') {
			state.flatCourses[termId] = [];
		}
		var obj;
		Object.keys(courses).forEach(function(subject) {
			courses[subject].forEach(function(course) {
				obj = course;
				obj.code = [subject, course.code].join(' ');
				state.flatCourses[termId].push(obj);
			})
		})
	},
	pushToEventSource: function(state, obj) {
		state.events.push(obj);
	},
	removeFromSource: function(state, number) {
		state.events = state.events.filter(function(event) {
			return event.number !== number;
		})
	}
}
