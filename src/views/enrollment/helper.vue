<template>
    <div>
        <div class="overflow-hidden bg-white rounded mb2">
			<div class="m0 p1">
				<div class="clearfix">
					<span class="btn black h5">Real Time Enrollment Cheker: </span>
				</div>
				<div class="clearfix">
					<span class="ml1 btn black h6 muted not-clickable">
                        You can instantly check the real time enrollment status when you search for classes in the planner.
                    </span>
				</div>
			</div>
			<div class="m0 p2 border-top">
				<div class="clearfix">
					<a class="muted h6 ml1 mb1 bold btn btn-outline {{ color }}" v-link="{ name: 'termsList' }">Take me to the Interactive Planner</a>
				</div>
			</div>
		</div>
		<div class="overflow-hidden bg-white rounded mb2">
			<div class="m0 p1">
				<div class="clearfix">
					<span class="btn black h5">Notify Me When Available: </span>
				</div>
				<div class="clearfix">
					<span class="ml1 btn black h6 muted not-clickable">
                        SlugSurvival will notify you when your desired classes are opened for enrollment.
                    </span>
				</div>
			</div>
            <div class="m0 p1 border-top">
				<div class="clearfix">
					<span class="btn black h5">Will notify for {{ termsList[monitoredTerm] }}: </span>
				</div>
				<div class="clearfix">
					<table class="h6 col col-12">
						<template v-for="course in courses" track-by="num">
							<tr>
								<td class="col col-6">
									<span class="btn not-clickable left">{{ course.c }}</span>
								</td>
							</tr>
						</template>
					</table>
				</div>
			</div>
			<div class="m0 p2 border-top">
				<div class="clearfix">
                    <a class="muted h6 ml1 mb1 bold btn btn-outline red">Add Classes</a>
					<a class="muted h6 ml1 mb1 bold btn btn-outline {{ color }}">Via SMS</a>
                    <a class="muted h6 ml1 mb1 bold btn btn-outline {{ color }}">Via Email</a>
                    <a class="muted h6 ml1 mb1 bold btn btn-outline {{ color }}">Via Push Notifications</a>
				</div>
			</div>
		</div><!--
		<div class="overflow-hidden bg-white rounded mb2">
			<div class="m0 p1">
				<div class="clearfix">
					<span class="btn black h5">Security: </span>
				</div>
				<div class="clearfix">
					<span class="ml1 btn black h6 muted not-clickable">Safeguarding your emails' authenticity and integrity.</span>
				</div>
			</div>
			<div class="m0 p2 border-top">
				<div class="clearfix">
					<a class="muted h6 ml1 mb1 bold btn btn-outline {{ color }}" v-link="{ name: 'settingSPFDKIMDMARC' }">SPF, DKIM, and DMARC</a>
				</div>
			</div>
		</div>-->
    </div>
</template>

<script>
var getters = require('../../lib/vuex/getters.js')
var actions = require('../../lib/vuex/actions.js')
var config = require('../../../config')

module.exports = {
    vuex: {
        getters: getters,
        actions: actions
    },
    data: function() {
        return {
            monitoredTerm: config.monitoredTerm,
            courses: [
                {
                    num: 1234,
                    c: 'ECON 2'
                }
            ]
        }
    },
    methods: {

    },
    created: function() {

    },
    ready: function() {
        this.setTitle('Tracker');
    }
}
</script>
