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
                    <span class="btn black h5 not-clickable block"><i>Currently we have the data until {{ dropDeadline }}: </i></span>
                    <select class="col col-6 p1 ml1 h6 block" id="quarters"></select>
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
        <hr class="mb2" v-show="ready"/>
        <div class="overflow-hidden bg-white rounded mb2" v-show="ready && !route.params.termId && !route.params.courseNum">
			<div class="m0 p1">
				<div class="clearfix">
					<span class="btn black h4">Most Compacted Classes: </span>
				</div>
				<div class="clearfix">
					<span class="ml1 btn black h5 muted not-clickable">
                        "Make Enrollment Great Again" - Show Recent Top:
                        <template v-for="num in tops">
                            <a class="clickable" v-bind:class="{ 'black': top === num }" @click="top = num" >{{ num }}</a>&nbsp;
                        </template>
                    </span>
				</div>
			</div>
			<div class="m0 p1 border-top">
                <div class="clearfix">
                    <span class="btn black h5 not-clickable"><i>Data for {{ termName }}: </i></span>
				</div>
                <div class="m0 p1">
    				<div class="clearfix">
                        <div class="overflow-hidden" v-show="compacted.length > 0">
                            <table class="table-light">
                                <thead class="bg-silver h6">
                                    <th>Course</th>
                                    <th>Excess Demand</th>
                                    <th>Waitlisted</th>
                                    <th>Enrolled / Capacity</th>
                                </thead>
                                <tbody class="h5">
                                    <tr class="clickable" v-on:click.prevent.stop="openAnalytics(result.course)" v-for="result in compacted.slice(0, top)">
                                        <td class="nowrap">{{ result.course.c }} - {{ result.course.s }}</td>
                                        <td class="nowrap bold">{{ (result.ratio * 100).toPrecision(4) + '%' }}</td>
                                        <td class="nowrap italic">{{ result.seats.waitTotal }}</td>
                                        <td class="nowrap">{{ result.seats.enrolled }} / {{ result.seats.cap }}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <div v-show="compacted.length === 0">
                            No results.
                        </div>
    				</div>
                </div>
			</div>
		</div>
        <div class="overflow-hidden bg-white rounded mb2" v-show="ready && !route.params.termId && !route.params.courseNum">
			<div class="m0 p1">
				<div class="clearfix">
					<span class="btn black h4">Top 10 Classes in the Last Hour: </span>
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
                                <thead class="bg-silver h6">
                                    <th>Course</th>
                                    <th>Changes</th>
                                </thead>
                                <tbody class="h5">
                                    <tr class="clickable" v-on:click.prevent.stop="openAnalytics(result.course)" v-for="result in heat">
                                        <td class="nowrap">{{ result.course.c }} - {{ result.course.s }}</td>
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
        <search :show="searchModal" :resetOnShow="true" v-on:close="searchModal = false" :callback="openAnalytics" :selected-term-id="termCode"></search>
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
var helper = require('../../lib/vuex/helper')

module.exports = {
    data: function() {
        return {
            ready: false,
            graphDataReady: true,
            searchModal: false,
            dropDeadline: null,
            canvasId: null,
            course: {},
            availableTerms: [],
            sectionsData: [],
            sectionsCanvasId: [],
            graphData: [],
            heat: [],
            compacted: [],
            selectizeRef: null,
            top: 10,
            tops: [
                10,
                20,
                50
            ],
            heatTimer: null,
            termCode: null
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
    watch: {
        'route': function(val, oldVal) {
            if (!this.ready) return;
            this.$nextTick(function() {
                this.canvasId = null;
                this.graphData = [];
                this.sectionsData = [];
                this.sectionsCanvasId = [];
                this.$store.dispatch('hideSpinner')
                this.$nextTick(function() {
                    return this.loadGraph({
                        termId: this.route.params.termId || this.termCode,
                        courseNum: this.route.params.courseNum
                    })
                })
            })
        },
        'termCode': function(val, oldVal) {
            if (!this.ready) return;
            this.termCode = val;
            this.$router.push({ name: 'analyticsCourse' })
            this.switchTerm(oldVal);
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
            this.$router.push({ name: 'analyticsCourse', params: { termId: this.termCode, courseNum: course.num }})
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
            self.$store.dispatch('showSpinner')
            self.graphDataReady = false;
            this.canvasId = this.makeid();
            self.graphData = [];
            return fetch(config.trackingURL + '/fetch/' + params.termId + '/' + params.courseNum).then(function(res) {
                return res.json();
            }).then(function(res) {
                if (typeof self.$store.state.termDates[self.termCode] !== 'undefined') {
                    var start = self.$store.state.termDates[self.termCode].start;
                    var monitorStart = new Date(start);
                    monitorStart.setDate(monitorStart.getDate() - helper.delta(self.termCode).enrollment);
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
                            if (!res.results[i] ||
                                !res.results[i].seats ||
                                !res.results[i].seats.sec ||
                                !res.results[i].seats.sec[j]) continue;
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
            })
            .then(function() {
                self.graphDataReady = true;
                self.$store.dispatch('hideSpinner')
            })
        },
        fetchHeat: function() {
            var self = this;
            return fetch(config.trackingURL + '/fetch/' + self.termCode + '/heat/3600').then(function(res) {
                return res.json();
            }).then(function(res) {
                if (res && res.ok && res.results && res.results.length > 0) self.heat = res.results.map(function(obj) {
                    if (!self.flatCourses[self.termCode]) return;
                    if (!self.flatCourses[self.termCode][obj.group]) return;
                    return {
                        course: self.flatCourses[self.termCode][obj.group],
                        count: obj.reduction
                    }
                }).slice(0, 10);
                else self.heat = [];
            })
        },
        fetchCompacted: function(showMax) {
            showMax = showMax || false;
            var self = this;
            return fetch(config.trackingURL + '/fetch/' + self.termCode + '/compacted' + (showMax ? 'Max': '')).then(function(res) {
                return res.json();
            }).then(function(res) {
                if (res && res.ok && res.results && res.results.length > 0) self.compacted = res.results.map(function(obj) {
                    if (!self.flatCourses[self.termCode]) return;
                    if (!self.flatCourses[self.termCode][obj.group]) return;
                    return {
                        course: self.flatCourses[self.termCode][obj.group],
                        seats: obj.reduction.seats,
                        ratio: obj.reduction.ratio
                    }
                })
                else self.compacted = [];
            })
        },
        switchTerm: function(oldTermCode) {
            var self = this;
            self.dropDeadline = '...'
            self.$store.commit('setTermName', null)
            if (!!oldTermCode) self.$store.commit('emptyTerm', oldTermCode)

            self.$store.dispatch('showSpinner')
            self.graphDataReady = true;
            return self.$store.dispatch('fetchTermCourses', self.termCode)
            .then(self.fetchHeat)
            .then(self.fetchCompacted)
            .then(function() {
                self.$store.commit('setTermName', self.$store.getters.termsList[self.termCode])
                var startDate = self.termDates[self.termCode]
                if (startDate.start === null) return false;
                else return self.$store.dispatch('calculateDropDeadline', self.termCode)
            })
            .then(function(deadline) {
                if (deadline === false) {
                    self.dropDeadline = '(Not Available)'
                }else{
                    self.dropDeadline = moment(deadline).format('YYYY-MM-DD');
                }
                self.ready = true;
                if (!self.route.params.courseNum) return;
                return self.loadGraph({
                    termId: self.termCode,
                    courseNum: self.route.params.courseNum
                })
            })
            .then(function() {
                self.$store.dispatch('hideSpinner')
            })
        },
        initSelectize: function() {
            var self = this;
            this.selectizeRef = $('#quarters').selectize({
                options: self.availableTerms.map(function(term) {
                    return { text: term.name, value: term.code }
                }),
                placeholder: 'select a quarter...',
                dropdownParent: "body",
                hideSelected: true,
                onChange: function(val) {
                    self.termCode = val;
                },
                render: {
                    option: function(item, escape) {
                        return '<div class="h6">' + escape(item.text) + '</div>';
                    },
                    item: function(item, escape) {
                        return '<div class="h6 inline-block">' + escape(item.text) + '</div>';
                    }
                }
            })
        }
    },
    mounted: function() {
        var self = this;
        this.$store.dispatch('setTitle', 'Analytics');
        return this.$store.dispatch('fetchAvailableTerms')
        .then(function(list) {
            self.availableTerms = list.filter(function(term) {
                return !!self.termDates[term.code] && self.termDates[term.code].start !== null;
            });
            self.termCode = self.route.params.termId || self.availableTerms[self.availableTerms.length - 1].code;
            return self.switchTerm();
        })
        .then(function() {
            self.initSelectize()
            // TODO: don't hard code this
            $('#quarters-selectized').prop('readonly', true)
            self.selectizeRef[0].selectize.setValue(self.termCode)
            self.$store.dispatch('hideSpinner')
        })
    },
    beforeDestroy: function() {
        // garbage collection
        this.selectizeRef[0].selectize.destroy()
        if (this.canvasId !== null) {
            Plotly.purge(document.getElementById(this.canvasId))
        }
        this.sectionsCanvasId.forEach(function(canvasId) {
            Plotly.purge(document.getElementById(canvasId))
        })
        this.sectionsCanvasId = []
        this.$store.commit('setTermName', null)
        this.$store.commit('emptyTerm', this.termCode)
    }

}
</script>

<style>
canvas {
    -moz-user-select: none;
    -webkit-user-select: none;
    -ms-user-select: none;
}
</style>
