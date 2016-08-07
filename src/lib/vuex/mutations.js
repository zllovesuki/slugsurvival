module.exports = {
	saveTerms: function(state, terms) {
		terms.forEach(function(term) {
			state.termsList[term.code] = term.name;
		})
	},
	saveTermCourses: function(state, termId, courses) {
		state.terms[termId] = courses;
		if (typeof state.flatTerms[termId] === 'undefined') {
			state.flatTerms[termId] = [];
		}
		var obj;
		Object.keys(courses).forEach(function(subject) {
			courses[subject].forEach(function(course) {
				obj = course;
				obj.code = [subject, course.code].join(' ');
				state.flatTerms[termId].push(obj);
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
