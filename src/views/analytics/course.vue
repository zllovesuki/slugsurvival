<template>
    <div>
        <div class="overflow-hidden bg-white rounded mb2" v-show="ready">
			<div class="m0 p1">
				<div class="clearfix">
					<span class="btn black h4">Course Opening Analytics: </span>
				</div>
				<div class="clearfix">
					<span class="ml1 btn black h5 muted not-clickable">
                        You can check the historical enrollment data of a course.
                    </span>
				</div>
			</div>
			<div class="m0 p1 border-top">
                <div class="clearfix">
                    <span class="btn black h5 not-clickable"><i>Currently we have the data for {{ termName }} until {{ dropDeadline }}: </i></span>
				</div>
                <div class="m0 p1">
    				<div class="clearfix">
                        <div class="md-flex">
                            <div class="p1 flex m1 h6 white bold clickable btn-outline" v-bind:style="{ backgroundColor: colorMap.searchAnything }" v-on:click.prevent.stop="showSearchModal"><i class="fa fa-search fa-lg">&nbsp;</i>search anything</div>
                        </div>
    				</div>
                </div>
			</div>
		</div>
        <div class="overflow-hidden bg-white rounded mb2" v-show="ready && !route.params.termId && !route.params.courseNum">
			<div class="m0 p1">
				<div class="clearfix">
					<span class="btn black h4">Top Ten Classes in the Last Hour: </span>
				</div>
				<div class="clearfix">
					<span class="ml1 btn black h5 muted not-clickable">
                        Because the Hunger Game is real.
                    </span>
				</div>
			</div>
			<div class="m0 p1 border-top">
                <div class="clearfix">
                    <span class="btn black h5 not-clickable"><i>Data for {{ termName }}: </i></span>
				</div>
                <div class="m0 p1">
    				<div class="clearfix">
                        <div class="overflow-hidden" v-show="heat.length > 0">
                            <table class="table-light">
                                <thead class="bg-darken-1 h6">
                                    <th>Course</th>
                                    <th>Changes</th>
                                </thead>
                                <tbody class="h5">
                                    <tr class="clickable" v-on:click.prevent.stop="openAnalytics(result.course)" v-for="result in heat" :key="result.num">
                                        <td class="nowrap">{{ result.course.c }}</td>
                                        <td class="nowrap">{{ result.count }}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <div v-show="heat.length === 0">
                            No results.
                        </div>
    				</div>
                </div>
			</div>
		</div>
        <search :show="searchModal" v-on:close="searchModal = false" :callback="openAnalytics" :selected-term-id="latestTermCode"></search>
        <transition name="fade" mode="out-in">
            <div class="overflow-hidden bg-white rounded mb2" v-show="!ready || !graphDataReady">
                <div class="m0 p2">
                    <div class="clearfix">
                        Loading...
                    </div>
                </div>
            </div>
        </transition>
        <div class="overflow-hidden bg-white rounded mb2 clearfix" v-if="ready && graphDataReady && graphData.length > 0">
            <div class="m0 p0">
                <div class="clearfix">
                    <div v-bind:id="canvasId"></div>
                    <graph :canvas-id="canvasId" :graph-data="graphData" :graph-title="'Time v Seats: ' + course.c + ' - ' + course.n"></graph>
                </div>
            </div>
        </div>
        <div class="overflow-hidden bg-white rounded mb2 clearfix" v-for="(section, index) in sectionsData" v-if="ready && graphDataReady && sectionsData.length > 0">
            <div class="m0 p0">
                <div class="clearfix">
                    <div v-bind:id="sectionsCanvasId[index]"></div>
                    <graph :section="true ":canvas-id="sectionsCanvasId[index]" :graph-data="section" :graph-title="'Section ' + section[0].num"></graph>
                </div>
            </div>
        </div>
    </div>
</template>
<script>
var config = require('../../../config')

module.exports = {
    data: function() {
        return {
            ready: false,
            graphDataReady: true,
            searchModal: false,
            dropDeadline: null,
            canvasId: null,
            course: {},
            sectionsData: [],
            sectionsCanvasId: [],
            graphData: [],
            heat: [],
            heatTimer: null
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
        colorMap: function() {
            return this.$store.getters.colorMap;
        },
        termName: function() {
            return this.$store.getters.termName;
        },
        latestTermCode: function() {
            return this.$store.getters.latestTermCode;
        }
    },
    watch: {
        'route': function(val, oldVal) {
            this.$nextTick(function() {
                this.canvasId = null;
                this.graphData = [];
                this.sectionsData = [];
                this.sectionsCanvasId = [];
                this.$nextTick(function() {
                    return this.loadGraph(this.route.params)
                })
            })
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
            this.graphDataReady = false;
            this.$router.push({ name: 'analyticsCourse', params: { termId: this.latestTermCode, courseNum: course.num }})
        },
        makeid: function() {
            var text = "";
            var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

            for( var i=0; i < 5; i++ )
                text += possible.charAt(Math.floor(Math.random() * possible.length));

            return text;
        }, // http://stackoverflow.com/questions/1349404/generate-random-string-characters-in-javascript
        loadGraph: function(params) {
            if (!params.termId || !params.courseNum) return;
            var self = this;
            this.canvasId = this.makeid();
            self.graphData = [];
            return fetch(config.trackingURL + '/fetch/' + params.termId + '/' + params.courseNum).then(function(res) {
                return res.json();
            }).then(function(res) {
                if (typeof self.$store.state.termDates[self.latestTermCode] !== 'undefined') {
                    var start = self.$store.state.termDates[self.latestTermCode].start;
                    var monitorStart = new Date(start);
                    monitorStart.setDate(monitorStart.getDate() - 75);
                }
                if (!res.ok && res.message && res.message.indexOf('not tracked') !== -1) {
                    if (typeof monitorStart === 'undefined') {
                        return self.alert.error('This term is not yet being tracked, please check again later.')
                    }else{
                        return self.alert.error('This term is not yet being tracked, please check again after ' + moment(monitorStart).format('YYYY-MM-DD'))
                    }
                }else if (!res.ok) {
                    return self.alert.error('An error has occurred');
                }
                if (res.results && res.results.length === 0) {
                    if (typeof monitorStart === 'undefined') {
                        return self.alert.error('No data found.')
                    }else{
                        return self.alert.error('No data found, please check again after ' + moment(monitorStart).format('YYYY-MM-DD'))
                    }
                }
                self.graphData = res.results;
                var numOfSections = (res.results[0] ? (res.results[0].seats.sec ? res.results[0].seats.sec.length : 0) : 0);
                if (numOfSections > 0) {
                    for (var i = 0, length = res.results.length; i < length; i++) {
                        for (var j = 0; j < numOfSections; j++) {
                            if (typeof self.sectionsData[j] === 'undefined') {
                                self.sectionsData[j] = [];
                            }
                            if (!res.results[i].seats.sec[j]) continue;
                            self.sectionsCanvasId[j] = self.makeid();
                            self.sectionsData[j].push({
                                num: res.results[i].seats.sec[j].sec,
                                date: res.results[i].date,
                                seats: res.results[i].seats.sec[j]
                            })
                        }
                    }
                }
                self.course = self.flatCourses[params.termId][params.courseNum];
                self.graphDataReady = true;
            });
        },
        fetchHeat: function() {
            var self = this;
            return fetch(config.trackingURL + '/fetch/' + self.latestTermCode + '/heat/3600').then(function(res) {
                return res.json();
            }).then(function(res) {
                if (res && res.ok && res.results && res.results.length > 0) self.heat = res.results.map(function(obj) {
                    return {
                        course: self.flatCourses[self.latestTermCode][obj.group],
                        count: obj.reduction
                    }
                }).slice(0, 10);
            })
        }
    },
    mounted: function() {
        var self = this;
        this.$store.dispatch('setTitle', 'Analytics');
        return self.$store.dispatch('fetchTermCourses', self.latestTermCode)
        .then(function() {
            return self.fetchHeat()
        })
        .then(function() {
            self.$store.commit('setTermName', self.$store.getters.termsList[self.latestTermCode])
            return self.$store.dispatch('calculateDropDeadline', self.latestTermCode)
        })
        .then(function(deadline) {
            self.dropDeadline = moment(deadline).format('YYYY-MM-DD');
            self.ready = true;
            if (!self.route.params.courseNum) return;
            self.graphDataReady = false;
            return self.loadGraph(self.route.params)
        })
    },

}
</script>

<style>
canvas {
    -moz-user-select: none;
    -webkit-user-select: none;
    -ms-user-select: none;
}
</style>
