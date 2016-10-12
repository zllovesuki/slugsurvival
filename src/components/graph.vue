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
            canvas: null
        }
    },
    mounted: function() {
        var self = this;
        $script.ready('Chart.js', function() {
            var ctx = document.getElementById(self.canvasId);
            var graphConfig = {
                type: 'line',
                data: {
                    datasets: []
                },
                options: {
                    responsive: true,
                    title: {
                        display: true,
                        text: self.graphTitle
                    },
                    tooltips: {
                        mode: 'index',
                    },
                    hover: {
                        mode: 'dataset'
                    },
                    scales: {
                        xAxes: [{
                            type: 'time',
                            display: true,
                            scaleLabel: {
                                display: true,
                                labelString: 'Date'
                            }
                        }],
                        yAxes: [{
                            type: 'logarithmic',
                            display: true,
                            scaleLabel: {
                                display: true,
                                labelString: 'Seats'
                            },
                            ticks: {
                                 beginAtZero: true,
                                 callback: function(value) {if (value % 1 === 0) {return value;}}
                             } //http://stackoverflow.com/questions/15751571/how-to-change-the-y-axis-values-from-real-numbers-to-integer-in-chartjs
                        }]
                    }
                }
            }
            var avail = [];
            var enrolled = [];
            var cap = [];
            for (var i = 0, length = self.graphData.length; i < length; i++) {
                if (typeof self.graphData[i].seats.avail !== 'undefined') {
                    avail.push({
                        x: moment(self.graphData[i].date * 1000).format(),
                        y: self.graphData[i].seats.avail
                    });
                }
                cap.push({
                    x: moment(self.graphData[i].date * 1000).format(),
                    y: self.graphData[i].seats.cap
                });
                enrolled.push({
                    x: moment(self.graphData[i].date * 1000).format(),
                    y: self.graphData[i].seats.enrolled
                });
            }
            if (avail.length > 0) {
                graphConfig.data.datasets.push({
                    label: 'Available',
                    data: avail,
                    fill: false,
                    pointBorderWidth: 1,
                    borderColor: 'green',
                    backgroundColor: 'green'
                })
            }
            graphConfig.data.datasets.push({
                label: 'Capacity',
                data: cap,
                fill: false,
                pointBorderWidth: 1,
                borderColor: 'red',
                backgroundColor: 'red'
            })
            graphConfig.data.datasets.push({
                label: 'Enrolled',
                data: enrolled,
                fill: false,
                borderColor: 'blue',
                backgroundColor: 'blue'
            })
            self.canvas = new Chart(ctx, graphConfig);
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
