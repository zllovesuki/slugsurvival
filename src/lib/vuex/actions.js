var helper = require('./helper')

var self = module.exports = {
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
				var data = res.json();
				_.dispatch('saveTermCourses', termId, data);
				return data;
			})
		}else{
			return Promise.resolve(_.state.courses[termId])
		}
	},
	initializeCalendar: function(_) {
		// TODO: do not couple this tightly with views/calendar/term.vue
		var self = this;
		$('#calendar').fullCalendar({
			columnFormat: 'ddd',
			minTime: '07:00',
			maxTime: '23:00',
			defaultDate: _.state.dateMap.Monday,
			allDaySlot: false,
			weekends: false,
			defaultView: 'agendaWeek',
			header: false,
			contentHeight: 'auto',
			eventSources: [
				{
		            events: function(start, end, timezone, callback) {
		                callback(_.state.events);
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
					_.dispatch('removeFromSource', calEvent.number);
					self.refreshCalendar();
				}.bind(self));
			}
		})
	},
	refreshCalendar: function(_) {
		$('#calendar').fullCalendar( 'refetchEvents' )
	},
	pushToEventSource: function(_, course) {
		var obj = {};
		course.time.day.forEach(function(day) {
			obj.title = [course.code + ' - ' + course.section, course.name].join("\n");
			obj.number = course.number;
			obj.start = _.state.dateMap[day] + ' ' + course.time.time.start;
			obj.end = _.state.dateMap[day] + ' ' + course.time.time.end;
			obj.course = course;
			_.dispatch('pushToEventSource', obj);
			obj = {};
		})
		this.refreshCalendar();
		this.alert().success(course.code + ' added to the planner!')
		return Promise.resolve();
	}
}
