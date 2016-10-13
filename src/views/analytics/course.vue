<template>
    <div>
        <div class="overflow-hidden bg-white rounded mb2 clearfix">
            <div class="m0 p2" v-show="!ready">
                <div class="clearfix">
                    Loading...
                </div>
            </div>
        </div>
        <div class="overflow-hidden bg-white rounded mb2 clearfix" v-if="ready">
            <div class="m0 p0">
                <div class="clearfix">
                    <div v-bind:id="canvasId"></div>
                    <graph :canvas-id="canvasId" :graph-data="graphData" :graph-title="'Time v Seats: ' + course.c + ' - ' + course.s"></graph>
                </div>
            </div>
        </div>
        <template v-for="(section, index) in sectionsData" v-if="ready">
            <div class="overflow-hidden bg-white rounded mb2 clearfix">
                <div class="m0 p0">
                    <div class="clearfix">
                        <div v-bind:id="sectionsCanvasId[index]"></div>
                        <graph :canvas-id="sectionsCanvasId[index]" :graph-data="section" :graph-title="'Section ' + section[0].num"></graph>
                    </div>
                </div>
            </div>
        </template>
    </div>
</template>
<script>
var config = require('../../../config')

module.exports = {
    data: function() {
        return {
            ready: false,
            canvasId: null,
            sectionsData: [],
            sectionsCanvasId: [],
            graphData: [],
            monitoredTerm: config.monitoredTerm
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
        course: function() {
            return this.flatCourses[this.monitoredTerm][this.route.params.courseNum]
        }
    },
    methods: {
        makeid: function() {
            var text = "";
            var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

            for( var i=0; i < 5; i++ )
                text += possible.charAt(Math.floor(Math.random() * possible.length));

            return text;
        } // http://stackoverflow.com/questions/1349404/generate-random-string-characters-in-javascript
    },
    mounted: function() {
        var self = this;
        this.canvasId = this.makeid();
        this.$store.dispatch('setTitle', 'Analytics');
        return self.$store.dispatch('fetchTermCourses', self.monitoredTerm)
        .then(function() {
            $script.ready('plotly.js', function() {
                return fetch(config.trackingURL + '/fetch/' + self.$store.getters.route.params.termId + '/' + self.$store.getters.route.params.courseNum).then(function(res) {
                    return res.json();
                }).then(function(res) {
                    if (!res.ok) {
                        return self.alert.error('An error has occurred');
                    }
                    if (res.results && res.results.length === 0) {
                        return self.alert.error('No data found.');
                    }
                    self.graphData = res.results;
                    var numOfSections = (res.results[0] ? (res.results[0].seats.sec ? res.results[0].seats.sec.length : 0) : 0);
                    if (numOfSections > 0) {
                        for (var i = 0, length = res.results.length; i < length; i++) {
                            for (var j = 0; j < numOfSections; j++) {
                                if (typeof self.sectionsData[j] === 'undefined') {
                                    self.sectionsData[j] = [];
                                }
                                self.sectionsCanvasId[j] = self.makeid();
                                self.sectionsData[j].push({
                                    num: res.results[i].seats.sec[j].sec,
                                    date: res.results[i].date,
                                    seats: res.results[i].seats.sec[j]
                                })
                            }
                        }
                    }
                    self.ready = true;
                });
            })
        })
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
