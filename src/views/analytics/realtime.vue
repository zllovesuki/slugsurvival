<template>
    <div>
        <div class="overflow-hidden bg-white rounded mb2">
			<div class="m0 p1">
				<div class="clearfix">
					<span class="btn black h4">See changes in realtime: </span>
				</div>
				<div class="clearfix">
					<span class="ml1 btn black h5 muted not-clickable">
                        SlugSurvival enables you to see enrollment changes as they happen.
                    </span>
                    <span class="ml1 btn black h6 muted not-clickable block">
                        Note: in compliance with the school policy, each individual course will be updated every 5 minutes.
                    </span>
				</div>
			</div>
			<div class="m0 p1 border-top">
                <div class="clearfix">
                    <div class="overflow-scroll col col-12 block" v-show="changes.length > 0">
                        <table class="table-light">
                            <thead class="bg-silver h6">
                                <th>Course</th>
                                <th>Status</th>
                                <th>Seats (Avail/Enrolled/Capacity)</th>
                                <th>Term</th>
                                <th>Last Updated</th>
                            </thead>
                            <tbody v-bind:class="{ 'h6': isMobile, 'h5': !isMobile }">
                                <tr v-for="change in changes.slice(0, 10)">
                                    <td class="nowrap non-clickable">{{ flatCourses[change.termCode][change.courseNum].c + ' - ' + flatCourses[change.termCode][change.courseNum].s }}</td>
                                    <td
                                        class="nowrap non-clickable"
                                        v-bind:class="{ 'green': change.seats.status === 'Open', 'red': change.seats.status !== 'Open'}"
                                    >
                                        {{ change.seats.status }}
                                    </td>
                                    <td class="nowrap non-clickable">{{ change.seats.avail }} / {{ change.seats.enrolled }} / {{ change.seats.cap }}</td>
                                    <td class="nowrap non-clickable">{{ helper.calculateTermName(change.termCode) }}</td>
                                    <td class="nowrap non-clickable">{{ new Date(change.date * 1000).toLocaleString() }}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <div
                        class="ml1 col col-12 block h5"
                        v-show="changes.length === 0"
                        v-bind:class="{ 'h6': isMobile, 'h5': !isMobile }"
                    >
                        No changes yet.
                    </div>
				</div>
			</div>
		</div>
    </div>
</template>
<script>
var config = require('../../../config')

module.exports = {
    data: function () {
        return {
            helper: require('../../lib/vuex/helper'),
            isMobile: false,
            socket: null,
            changes: []
        }
    },
    computed: {
        alert: function() {
            return this.$store.getters.alert;
        },
        route: function() {
            return this.$store.getters.route;
        },
        flatCourses: function() {
            return this.$store.getters.flatCourses
        },
        termsList: function() {
            return this.$store.getters.termsList
        },
        termDates: function() {
            return this.$store.getters.termDates
        },
        colorMap: function() {
            return this.$store.getters.colorMap;
        },
        termName: function() {
            return this.$store.getters.termName;
        }
    },
    mounted: function() {
        var self = this;
        this.$store.dispatch('setTitle', 'Realtime');

        return this.$store.dispatch('fetchAvailableTerms')
        .then(function(list) {
            var terms = list.filter(function(term) {
                return self.termDates[term.code].start !== null;
            }).sort(function(a, b) {
                if (a.code > b.code) return -1;
                else if (a.code < b.code) return 1;
                else return 0
            }).slice(0, 2)
            return Bluebird.map(terms, function(term) {
                return self.$store.dispatch('fetchTermCourses', term.code)
            })
        })
        .then(function() {
            self.socket = require('socket.io-client')(config.realtimeURL);
            self.socket.on('connect', function() {
                console.log('Feeds ready')
                self.$store.dispatch('hideSpinner')
            })
            self.socket.on('delta', function(data) {
                self.changes.unshift(data)
            })
        })
    },
    beforeDestroy: function() {
        this.socket.disconnect()
    },
    created: function() {
        this.isMobile = this.$store.getters.MobileDetect.phone()
    }
}
</script>
