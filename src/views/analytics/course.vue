<template>
    <div>
        <div class="overflow-hidden bg-white rounded mb2 clearfix">
            <div class="m0 p2" v-show="!ready">
                <div class="clearfix">
                    Loading...
                </div>
            </div>
            <div class="m0 p2" v-if="ready">
                <div class="clearfix">
                    <canvas v-bind:id="canvasId"></canvas>
                    <graph :canvas-id="canvasId" :graph-data="graphData" :graph-title="'Course ' + route.params.courseNum"></graph>
                </div>
            </div>
            <div class="m0 p2" v-if="ready">
                <div class="clearfix">
                    <template v-for="section in sectionsData">
                        <canvas v-bind:id="sectionsCanvasId[$index]"></canvas>
                        <graph :canvas-id="sectionsCanvasId[$index]" :graph-data="section" :graph-title="'Section ' + section[0].num"></graph>
                    </template>
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
            canvasId: this.makeid(),
            sectionsData: [],
            sectionsCanvasId: [],
            graphData: []
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
        this.setTitle('Analytics');
        $script.ready('Chart.js', function() {
            fetch(config.trackingURL + '/fetch/' + self.route.params.termId + '/' + self.route.params.courseNum).then(function(res) {
                return res.json();
            }).then(function(res) {
                if (!res.ok) {
                    return self.alert().error('An error has occurred');
                }
                if (res.results && res.results.length === 0) {
                    return self.alert().error('No data found.');
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
