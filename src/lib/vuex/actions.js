var helper = require('./helper')

var self = module.exports = {
	alert: function(_) {
		return _.state.alert;
	},
	setTitle: function(_, title) {
		_.dispatch('setTitle', title)
	},
	fetchTerms: function(_) {
		return helper.getWithHeader(this.$http, _.state, '/db/terms.json')
		.then(function(res) {
			if (typeof res === 'undefined') return;
			var data = res.json();
			_.dispatch('saveTermsList', data);
			return data;
		})
	},
	fetchTermCourses: function(_) {
		var termId = _.state.route.params.termId;
		_.dispatch('setTermName', _.state.termsList[termId])
		if (typeof _.state.courses[termId] === 'undefined') {
			return helper.getWithHeader(this.$http, _.state, '/db/terms/' + termId + '.json')
			.then(function(res) {
				if (typeof res === 'undefined') return;
				var coursesData = res.json();
				_.dispatch('saveTermCourses', termId, coursesData);
				return helper.getWithHeader(this.$http, _.state, '/db/courses/' + termId + '.json')
				.then(function(res) {
					if (typeof res === 'undefined') return;
					var courseInfo = res.json();
					_.dispatch('saveCourseInfo', termId, courseInfo);
					return coursesData
				})
			})
		}else{
			return Promise.resolve(_.state.courses[termId])
		}
	},
	courseHasSections: function(_, courseNumber) {
		var termId = _.state.route.params.termId;
		return _.state.courseInfo[termId][courseNumber].sections.length > 0;
	},
	initializeCalendar: function(_) {
		// TODO: do not couple this tightly with views/calendar/term.vue
		var self = this;
		var termId = _.state.route.params.termId;
		$('#calendar-' + termId).fullCalendar({
			columnFormat: 'ddd',
			minTime: '07:00',
			maxTime: '23:00',
			defaultDate: _.state.dateMap.Monday,
			allDayText: 'TBA',
			//allDaySlot: false,
			weekends: false,
			defaultView: 'agendaWeek',
			header: false,
			contentHeight: 'auto',
			eventSources: [
				{
		            events: function(start, end, timezone, callback) {
		                callback(_.state.events[termId]);
		            },
		            //color: 'yellow',   // an option!
		            //textColor: 'black' // an option!
		        }
		    ],
			eventClick: function(calEvent, jsEvent, view) {
				self.alert()
				.okBtn("Yes")
				.cancelBtn("No")
				.confirm('Remove from calendar?')
				.then(function(resolved) {
					resolved.event.preventDefault();
					if (resolved.buttonClicked !== 'ok') return;
					_.dispatch('removeFromSource', termId, calEvent.number);
					self.refreshCalendar();
					_.state.alert.success('Removed!')
				}.bind(self));
			}
		})
	},
	refreshCalendar: function(_) {
		$('#calendar-' + _.state.route.params.termId).fullCalendar( 'refetchEvents' )
	},
	pushToEventSource: function(_, course) {
		var termId = _.state.route.params.termId;
		var obj = {};
		if (!!!course.time) {
			// TBA will be in the allDaySlot
			obj.title = [course.code + ' - ' + course.section, course.name].join("\n");
			obj.number = course.number;
			obj.allDay = true;
			obj.start = _.state.dateMap['Monday'];
			obj.end = _.state.dateMap['Saturday'];
			obj.course = course;
			_.dispatch('pushToEventSource', termId, obj);
			obj = {};
		}else{
			course.time.day.forEach(function(day) {
				obj.title = [course.code + ' - ' + course.section, course.name].join("\n");
				obj.number = course.number;
				obj.allDay = false;
				obj.start = _.state.dateMap[day] + ' ' + course.time.time.start;
				obj.end = _.state.dateMap[day] + ' ' + course.time.time.end;
				obj.course = course;
				_.dispatch('pushToEventSource', termId, obj);
				obj = {};
			})
		}
		this.refreshCalendar();
		this.alert().success(course.code + ' added to the planner!')
		return Promise.resolve();
	},
	// TODO: remove the ugly hack in here and from views/calendar/term.vue
	_pushSectionToEventSource: function(_, courseNumber, sectionNumber) {
		var termId = _.state.route.params.termId;
		var courseInfo = _.state.courseInfo[termId][courseNumber];
		var courses = _.state.flatCourses[termId];
		var obj = {};
		var section = courseInfo.sections.filter(function(section) {
			return section.number == sectionNumber
		});
		section = section[0];
		var course = courses.filter(function(course) {
			return course.number == courseNumber;
		})
		course = course[0];
		var day = section.time.day[0];
		obj.title = ['DIS ' + section.section, 'Section for ' + course.code].join("\n");
		obj.number = course.number;
		obj.start = _.state.dateMap[day] + ' ' + section.time.time.start;
		obj.end = _.state.dateMap[day] + ' ' + section.time.time.end;
		obj.course = course;
		obj.section = section;
		_.dispatch('pushToEventSource', termId, obj);
		this.pushToEventSource(course);
		this.refreshCalendar();
		return Promise.resolve();
	}
}
