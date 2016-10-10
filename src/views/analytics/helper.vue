<template>
    <div>
        <div class="overflow-hidden bg-white rounded mb2">
			<div class="m0 p1">
				<div class="clearfix">
					<span class="btn black h5">Course Opening Analytics: </span>
				</div>
				<div class="clearfix">
					<span class="ml1 btn black h6 muted not-clickable">
                        You can check the historical enrollment data of a course.
                    </span>
				</div>
			</div>
			<div class="m0 p1 border-top">
                <div class="clearfix">
                    <span class="btn black h6 not-clickable"><i>Currently we have the data for {{ termName }}: </i></span>
				</div>
                <div class="m0 p1">
    				<div class="clearfix">
    				    <a class="h6 ml1 mb1 bold btn btn-outline white" v-bind:style="{ backgroundColor: colorMap.searchAnything }" @click="showSearchModal">search anything</a>
    				</div>
                </div>
			</div>
		</div>
        <search :show.sync="searchModal" :callback="openAnalytics" :selected-term-id="monitoredTerm"></search>
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
            monitoredTerm: config.monitoredTerm
        }
    },
    methods: {
        showSearchModal: function() {
            this.searchModal = true;
            setTimeout(function() {
                document.getElementsByClassName('search-box')[0].focus();
            }, 75);
        },
        openAnalytics: function(course) {
            this.searchModal = false;
            this.route.router.go({ name: 'analyticsCourse', params: { termId: this.monitoredTerm, courseNum: course.num }})
        }
    },
    created: function() {

    },
    ready: function() {
        var self = this;
        this.loading.go(30);
        this.setTitle('Analytics');

        this.fetchTermCourses(this.monitoredTerm)
        .then(function() {
            self.loading.go(100);
            self.ready = true;
        })
    }
}
</script>
