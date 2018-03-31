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
        section: {
            type: Boolean,
            default: false
        }
    },
    data: function() {
        return {
            canvas: null,
            formatString: 'YYYY-MM-DD HH:mm'
        }
    },
    mounted: function() {
        var self = this;
        var ctx = document.getElementById(self.canvasId);
        var layout = {
            title: self.graphTitle,
            showlegend: true,
            legend: {
                orientation: 'h'
            },
            margin: {
                t: 80,
                l: 60,
                r: 60,
                b: 50
            },
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
            mode: 'markers',
            marker: {
                size: 4
            },
            line: {
                color: 'gray'
            },
            hoverlabel: {
                font: {
                    color: 'white'
                }
            }
        }
        var avail = {
            name: 'Available',
            x: [],
            y: [],
            mode: 'markers',
            marker: {
                size: 4
            },
            line: {
                color: 'green'
            }
        }
        var enrolled = {
            name: 'Enrolled',
            x: [],
            y: [],
            mode: 'markers',
            marker: {
                size: 4
            },
            line: {
                color: 'blue'
            }
        }
        var cap = {
            name: 'Capacity',
            x: [],
            y: [],
            mode: 'markers',
            marker: {
                size: 4
            },
            line: {
                color: 'red'
            }
        }
        var wait = {
            name: 'Waitlist',
            x: [],
            y: [],
            mode: 'markers',
            marker: {
                size: 4
            },
            line: {
                color: 'black'
            }
        }
        for (var i = 0, length = self.graphData.length; i < length; i++) {
            if (typeof self.graphData[i].avail !== 'undefined') {
                avail.x.push(moment(self.graphData[i].date * 1000).format(self.formatString))
                avail.y.push(self.graphData[i].avail)
            }
            if (typeof self.graphData[i].status !== 'undefined') {
                status.x.push(moment(self.graphData[i].date * 1000).format(self.formatString))
                status.y.push(self.graphData[i].status)
            }
            cap.x.push(moment(self.graphData[i].date * 1000).format(self.formatString))
            cap.y.push(self.graphData[i].cap)
            enrolled.x.push(moment(self.graphData[i].date * 1000).format(self.formatString))
            enrolled.y.push(self.graphData[i].enrolled)
            wait.x.push(moment(self.graphData[i].date * 1000).format(self.formatString))
            if (self.section) wait.y.push(self.graphData[i].wait)
            else wait.y.push(self.graphData[i].waitTotal)
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
        graphConfig.push(wait);
        self.canvas = Plotly.newPlot(ctx, graphConfig, layout, {displaylogo: false});
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
