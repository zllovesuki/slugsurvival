<template>
	<div>
		<div class="mt2 mb1">
			<div class="overflow-hidden bg-white rounded mb2">
				<div class="m0 p1">
					<div class="clearfix">
						<span class="btn black h4">Classes: </span>
					</div>
					<div class="clearfix">
						<span class="ml1 btn black h5 muted not-clickable">my.ucsc.edu is too slow? Plan your classes here!</span>
					</div>
				</div>
				<div class="m0 p2 border-top">
					<div class="clearfix">
						<a class="h6 ml2 mb1 bold btn btn-outline {{ color }}" v-link="{ name: 'termsList' }">Interactive Planner</a>
						<a class="h6 ml2 mb1 bold btn btn-outline {{ color }}" @click="comingSoon">Major/Minor Requirements</a>
						<a class="h6 ml2 mb1 bold btn btn-outline {{ color }}" @click="comingSoon">Enrollment Opening Tracker</a>
					</div>
				</div>
			</div>
			<div class="overflow-hidden bg-white rounded mb2">
				<div class="m0 p1">
					<div class="clearfix">
						<span class="btn black h4">Transportation: </span>
					</div>
					<div class="clearfix">
						<span class="ml1 btn black h5 muted not-clickable">It shouldn't be hard to get around in Santa Cruz.</span>
					</div>
				</div>
				<div class="m0 p2 border-top">
					<div class="clearfix">
						<a class="h6 ml2 mb1 bold btn btn-outline {{ color }}" href="http://slugroute.com" target="_blank">Campus Bus Tracker</a>
						<a class="h6 ml2 mb1 bold btn btn-outline {{ color }}" href="https://www.scmtd.com/en/routes/system-map" target="_blank">City Bus Schedule</a>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>
<script>

var getters = require('../lib/vuex/getters.js')
var actions = require('../lib/vuex/actions.js')

module.exports = {
	vuex: {
		getters: getters,
		actions: actions
	},
	methods: {
		comingSoon: function() {
			this.alert.alert('Coming soon')
		}
	}
}
</script>
