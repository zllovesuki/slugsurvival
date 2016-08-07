var helper = require('./helper')

var self = module.exports = {
	fetchTerms: function(_) {
		return helper.getWithHeader(this.$http, _.state, '/public/db/terms.json')
		.then(function(res) {
			if (typeof res === 'undefined') return;
			var data = res.json();
			_.dispatch('saveTerms', data);
			return data;
		})
	},
	fetchTermCourses: function(_) {
		var termId = _.state.route.params.termId;
		return helper.getWithHeader(this.$http, _.state, '/public/db/' + termId + '.json')
		.then(function(res) {
			if (typeof res === 'undefined') return;
			var data = res.json();
			_.dispatch('saveTermCourses', termId, data);
			return data;
		})
	},
	initializeCalendar: function(_) {
		var self = this;
		$('#calendar').fullCalendar({
			customButtons: {
				clickToSearch: {
					text: 'add',
					click: function() {
						self.showModal();
					}
				}
			},
			columnFormat: 'ddd',
			minTime: '07:00:00',
			maxTime: '23:00:00',
			defaultDate: _.state.dateMap.Monday,
			allDaySlot: false,
			weekends: false,
			defaultView: 'agendaWeek',
			header: {
				left: 'title',
				center: '',
				right: 'clickToSearch'
			},
			views: {
				agenda: {
					titleFormat: '[Weekly Schedule for ' + _.state.termsList[_.state.route.params.termId] + ']'
				}
			},
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
			obj.title = course.name;
			obj.number = course.number;
			obj.start = _.state.dateMap[day] + 'T' + course.time.time.start + ':00';
			obj.end = _.state.dateMap[day] + 'T' + course.time.time.end + ':00';
			_.dispatch('pushToEventSource', obj);
			obj = {};
		})
		this.refreshCalendar();
	}
}
