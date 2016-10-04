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
		<div class="overflow-hidden bg-white rounded mb2" v-if="ready">
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
                        <tr v-show="courses.length === 0">
                            <td class="col col-6">
                                <span class="btn not-clickable left muted">(none)</span>
                            </td>
                        </tr>
					</table>
				</div>
			</div>
			<div class="m0 p2 border-top">
				<div class="clearfix">
                    <a class="muted h6 ml1 mb1 bold btn btn-outline red" @click="showSearchModal">Add Classes</a>
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
        <search :show.sync="searchModal" :callback="addToNotifyList" :selected-term-id="monitoredTerm"></search>
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
            ready: false,
            searchModal: false,
            monitoredTerm: config.monitoredTerm,
            courses: []
        }
    },
    methods: {
        showSearchModal: function() {
            this.searchModal = true;
            setTimeout(function() {
                document.getElementsByClassName('search-box')[0].focus();
            }, 75);
        },
        addToNotifyList: function(course) {
            var html = this.getCourseDom(this.monitoredTerm, course);
            return this.alert()
            .okBtn('Add Class')
            .cancelBtn("Go Back")
            .confirm(html)
            .then(function(resolved) {
                resolved.event.preventDefault();
                if (resolved.buttonClicked !== 'ok') return;

                this.courses.push(course);
            }.bind(this));
        }
    },
    created: function() {

    },
    ready: function() {
        var self = this;
        this.loading.go(30);
        this.setTitle('Tracker');

        this.fetchTermCourses(this.monitoredTerm)
        .then(function() {
            self.loading.go(100);
            self.ready = true;
        })
    }
}
</script>
