<template>
</template>

<script>
var config = require('../../config')

module.exports = {
    props: {
        graphTitle: {
            type: String,
            require: true
        },
        canvasId: {
            type: String,
            require: true
        },
        graphData: {
            type: Array,
            required: true
        },
    },
    data: function() {
        return {
            canvas: null,
            formatString: 'MMM Do YYYY, h:mm a'
        }
    },
    mounted: function() {
        var self = this;
        $script.ready('plotly.js', function() {
            var ctx = document.getElementById(self.canvasId);
            var layout = {
                title: self.graphTitle,
                yaxis: {
                    title: 'Seats'
                },
                xaxis: {
                    title: 'Time'
                },
                font: {
                    family: 'Lato',
                    size: 10
                }
            }
            var graphConfig = [];
            var status = {
                name: 'Status',
                x: [],
                y: [],
                yaxis: 'y2',
                mode: '',
                line: {
                    color: 'gray'
                }
            }
            var avail = {
                name: 'Available',
                x: [],
                y: [],
                mode: 'scatter',
                line: {
                    color: 'green'
                }
            }
            var enrolled = {
                name: 'Enrolled',
                x: [],
                y: [],
                mode: 'scatter',
                line: {
                    color: 'blue'
                }
            }
            var cap = {
                name: 'Capacity',
                x: [],
                y: [],
                mode: 'scatter',
                line: {
                    color: 'red'
                }
            }
            for (var i = 0, length = self.graphData.length; i < length; i++) {
                if (typeof self.graphData[i].seats.avail !== 'undefined') {
                    avail.x.push(moment(self.graphData[i].date * 1000).format(self.formatString))
                    avail.y.push(self.graphData[i].seats.avail)
                }
                if (typeof self.graphData[i].seats.status !== 'undefined') {
                    status.x.push(moment(self.graphData[i].date * 1000).format(self.formatString))
                    status.y.push(self.graphData[i].seats.status)
                }
                cap.x.push(moment(self.graphData[i].date * 1000).format(self.formatString))
                cap.y.push(self.graphData[i].seats.cap)
                enrolled.x.push(moment(self.graphData[i].date * 1000).format(self.formatString))
                enrolled.y.push(self.graphData[i].seats.enrolled)
            }
            if (avail.x.length > 0) {
                graphConfig.push(avail);
            }
            if (status.x.length > 0) {
                graphConfig.push(status);
                layout.yaxis2 = {
                    title: 'Status',
                    overlaying: 'y',
                    side: 'right'
                };
            }
            graphConfig.push(enrolled);
            graphConfig.push(cap);
            self.canvas = Plotly.newPlot(ctx, graphConfig, layout);
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
