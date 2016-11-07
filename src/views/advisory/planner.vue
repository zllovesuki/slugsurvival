<template>
    <transition-group name="fade" mode="in-out">
        <div class="overflow-hidden bg-white mb2 clearfix h5" key="planner" v-show="historicDataLoaded">
            <div class="m0 p1 mb1">
                <div class="clearfix">
                    <span class="btn black h5">Interactive Academic Planner: </span>
                </div>
                <div class="clearfix">
                    <span class="ml1 btn black h6 muted not-clickable block">
                        Classes are shown based on the their statistical frequencies, not a guarantee that the school will offer these classes in the quarter.
                    </span>
                </div>
            </div>
            <div class="m0 p1">
                <div class="clearfix center">
                    <div class="inline-block col col-2">
                        <div class="col col-6">
                            <div @click="addYearAndFull"
                            class="h5 black clickable"
                            v-bind:style="{ backgroundColor: colorMap.blank }">
                                <i class="fa fa-plus-square-o fa-lg"></i>
                            </div>
                        </div>
                        <div class="col col-6" v-show="Object.keys(table).length > 1">
                            <div @click="delYear"
                            class="h5 black clickable"
                            v-bind:style="{ backgroundColor: colorMap.blank }">
                                <i class="fa fa-minus-square-o fa-lg"></i>
                            </div>
                        </div>
                    </div>
                    <div class="inline-block col col-10">
                        <div class="col col-12 h4 bold">
                            <div class="inline-block col col-3" v-for="quarter in quarters" style="text-transform: capitalize;">
                                {{ quarter }}
                            </div>
                        </div>
                    </div>
                </div>
                <div class="clearfix border-top" v-for="(matrix, year) in table">
                    <div class="inline-block col col-2">
                        <div style="width: 100%; height: 100%; text-align: center; vertical-align: middle;">
                            {{ year }}
                        </div>
                    </div>
                    <div class="inline-block col col-10">
                        <div class="inline-block col col-3" v-for="quarter in quarters">
                            <template v-for="(item, index) in table[year][quarter]">
                                <div class="p1 col col-12">
                                    <select style="width: 100%" v-model="table[year][quarter][index]" v-bind:id="year + '-' + quarter + '-' + index">
                                        <!--<option :value="code" v-for="code in Object.keys(historicData[quarter])">{{ code }} ({{ (historicData[quarter][code] * 100).toPrecision(4) }}%)</option>-->
                                        <option :value="code" v-for="code in historicData[quarter]" track-by="code">{{ code }}</option>
                                    </select>
                                </div>
                            </template>
                            <div class="p1 col col-12 center">
                                <div class="col col-6">
                                    <div @click="addCourse(year, quarter)"
                                    class="h5 black clickable"
                                    v-bind:style="{ backgroundColor: colorMap.blank }">
                                        <i class="fa fa-plus-square-o fa-lg"></i>
                                    </div>
                                </div>
                                <div class="col col-6" v-show="Object.keys(table[year][quarter]).length > 1">
                                    <div @click="delCourse(year, quarter)"
                                    class="h5 black clickable"
                                    v-bind:style="{ backgroundColor: colorMap.blank }">
                                        <i class="fa fa-minus-square-o fa-lg"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="overflow-hidden bg-white rounded mb2" key="loading" v-show="!historicDataLoaded">
            <div class="m0 p1">
                <div class="clearfix">
                    Loading...
                </div>
            </div>
        </div>
        <div class="overflow-hidden bg-white rounded mb2 h5" key="feature">
            <div class="m0 p1">
                <p>Very soon, you will be able to select classes based on your major/minor, and be able to export this so you can bring the printed version to declare your major.</p>
                <p>Stay tuned.</p>
            </div>
        </div>
    </transition-group>
</template>

<script>
var helper = require('../../lib/vuex/helper')
module.exports = {
    data: function() {
        return {
            quarters: ['fall', 'winter', 'spring', 'summer'],
            table: {},
            historicDataLoaded: false,
            windowSize: 4,
            windowAlpha: 0,
            historicData: {}
        }
    },
    computed: {
        alert: function() {
            return this.$store.getters.alert;
        },
        route: function() {
            return this.$store.getters.route;
        },
        title: function() {
            return this.$store.getters.title;
        },
        colorMap: function() {
            return this.$store.getters.colorMap;
        },
        numOfYears: function() {
            return this.$store.getters.numOfYears;
        },
        academicPlanner: function() {
            return this.$store.getters.academicPlanner;
        }
    },
    methods: {
        addYear: function() {
            var largest = Object.keys(this.table).length === 0 ? 0 : Object.keys(this.table).reduce(function(x,y){
                return (x > y) ? x : y;
            });
            this.$set(this.table, parseInt(largest) + 1, {
                fall: {},
                winter: {},
                spring: {},
                summer: {}
            } )
            return parseInt(largest) + 1;
        },
        select2: function(year, quarter, index) {
            var self = this;
            $('#' + year + '-' + quarter + '-' + index).select2({
                allowClear: true,
                placeholder: 'select...'
            }).on('select2:select', function(evt) {
                self.table[year][quarter][index] = evt.params.data.element.value;
                self.savePlaner();
            }).on('select2:unselect', function(evt) {
                self.table[year][quarter][index] = undefined;
                self.savePlaner();
            })
        },
        addCourse: function(year, quarter) {
            var self = this;
            var largest = Object.keys(this.table[year][quarter]).length === 0 ? 0 : Object.keys(this.table[year][quarter]).reduce(function(x,y){
                return (x > y) ? x : y;
            });
            var index = parseInt(largest) + 1;
            this.$set(this.table[year][quarter], index, undefined)
            this.$nextTick(function() {
                self.select2(year, quarter, index);
            })
        },
        delYear: function() {
            var largest = Object.keys(this.table).length === 0 ? -1 : Object.keys(this.table).reduce(function(x,y){
                return (x > y) ? x : y;
            });
            if (largest === -1) return -1;
            this.$delete(this.table, parseInt(largest))
            this.savePlaner();
            return largest;
        },
        delCourse: function(year, quarter) {
            var self = this;
            var largest = Object.keys(this.table[year][quarter]).length === 0 ? 0 : Object.keys(this.table[year][quarter]).reduce(function(x,y){
                return (x > y) ? x : y;
            });
            var index = parseInt(largest);
            $('#' + year + '-' + quarter + '-' + index).select2('destroy')
            this.$nextTick(function() {
                this.$delete(this.table[year][quarter], index);
                this.savePlaner();
            });
        },
        addYearAndFull: function(blockSave) {
            var self = this;
            var year = this.addYear();
            this.quarters.forEach(function(quarter) {
                self.addCourse(year, quarter)
            })
            if (blockSave !== 'yes') self.savePlaner();
        },
        /*
            As Eric pointed out, a simple frequency is not suitable, as some courses are no longer affered,
            and most importantly, more classes are offered recently. He suggested that I should use
            *Neural Network*, I was like, do we HAVE TO go there?
            Thus, I think that a moving window of frequency makes sense in here
            (Expoential Moving Average, it's the name for that)
        */
        // MA Start
        getYears: function() {
            var terms = this.$store.getters.flatTermsList;
            var tmp;
            var years = {};
            terms.forEach(function(term) {
                tmp = '20' + helper.pad((term.code % 2000).toString().slice(0, -1), 2, 0);
                if (typeof years[tmp] === 'undefined') {
                    years[tmp] = null;
                }
            })
            return Object.keys(years)
        },
        normalizeYears: function(allYears, quarterYears) {
            /*
                we will normalize the years, for example, allYears contains all the years (2004-2017) in an array
                and quarter years is an object of where the value is the number of classes offered in that quarter year
                the normalized obj will have either 1(true) or 0(false) to signify if it was offered or not
            */
            var normalized = {};
            var qYears = Object.keys(quarterYears);
            for (var i = 0, length = allYears.length; i < length; i++) {
                if (typeof normalized[allYears[i]] === 'undefined') normalized[allYears[i]] = 0;
                if (qYears.indexOf(allYears[i]) !== -1) normalized[allYears[i]] += quarterYears[allYears[i]];
            }
            var normalizedLargest = Object.keys(normalized).reduce(function(x,y){
                return (x > y) ? x : y;
            });
            var quarterYearLargest = qYears.reduce(function(x,y){
                return (x > y) ? x : y;
            });
            if (normalizedLargest != quarterYearLargest) {
                // account for quarter mismatch, where winter is jump to 2017, and skewing the results for other quarters
                // though it could introduce errors. we will see when we test this
                delete normalized[normalizedLargest];
            }
            return normalized;
        },
        windowFrequency: function() {
            var self = this;
            var historicData = this.$store.getters.historicData;

            // multipler = (2 / (windowCounter + 1) );
            // instead of using variable k, alpha, multipler, whatever, we will discount more on less recent years.
            self.windowAlpha = 1 / self.windowSize;

            var allYears = this.getYears();
            var normalized = {};
            var years = [];

            var Window = [];
            var windowCounter = 0;
            var frequencies = [];
            var frequency = 0;

            var threshold = {};
            var sum = 0;

            var result = {};

            for (var quarter in historicData){
                for (var code in historicData[quarter]) {
                    if (typeof result[code] === 'undefined') {
                        result[code] = {
                            spring: 0,
                            summer: 0,
                            fall: 0,
                            winter: 0
                        }
                        threshold[code] = {
                            spring: 0,
                            summer: 0,
                            fall: 0,
                            winter: 0
                        }
                    }
                    normalized = this.normalizeYears(allYears, historicData[quarter][code]);
                    // Warning, inefficient code ahead.
                    years = Object.keys(normalized).sort(function(a, b) { return b-a; });
                    for (;; windowCounter++) {
                        // this is moving average
                        Window = years.slice( windowCounter, windowCounter + this.windowSize );
                        if (Window.length < this.windowSize) break;
                    }

                    threshold[code][quarter] = ((1 / self.windowSize) * self.windowAlpha).toPrecision(2)

                    for (var period = 0; period < windowCounter; period++) {
                        Window = years.slice( period * this.windowSize, (period + 1) * this.windowSize );
                        if (Window.length === 0) break;

                        frequency = Window.reduce(function(total, year) {
                            return normalized[year] > 0 ? total + normalized[year] : total;
                        }, 0) / this.windowSize;

                        sum += frequency * Math.pow(1 - self.windowAlpha, period);
                    }

                    result[code][quarter] = (self.windowAlpha * sum).toPrecision(2)

                    windowCounter = 0;
                    frequencies = [];
                    //multipler = 0;
                    sum = 0;
                }
            }
            this.historicData = {
                fall: [],
                winter: [],
                spring: [],
                summer: []
            };
            Object.keys(result).forEach(function(code) {
                //console.log(code);
                Object.keys(result[code]).forEach(function(quarter) {
                    //console.log(quarter, result[code][quarter], threshold[code][quarter], (result[code][quarter] > 0 && result[code][quarter] >= threshold[code][quarter]))
                    if (result[code][quarter] > 0 && result[code][quarter] >= threshold[code][quarter]) {
                        self.historicData[quarter].push(code);
                    }
                })
                //console.log('---')
                //console.log('')
            })
        },
        // MA End
        /*recalculate: function(blockSave) {
            var returnData = {};
            var historicData = this.$store.getters.historicData;
            var keys = [];
            for (var quarter in historicData){
                returnData[quarter] = {};
                for (var code in historicData[quarter]) {
                    keys = Object.keys(historicData[quarter][code]);
                    if (keys.length / this.numOfYears > this.historicThreshold) returnData[quarter][code] = keys.length / this.numOfYears;
                }
            }
            this.historicData = returnData;
            this.$nextTick(function() {
                if (blockSave !== 'yes') this.savePlaner();
            })
        },*/
        savePlaner: function() {
            this.$store.commit('saveAcademicPlanner', this.table)
        },
        initSelect2: function() {
            var self = this;
            Object.keys(self.table).forEach(function(year) {
                Object.keys(self.table[year]).forEach(function(quarter) {
                    Object.keys(self.table[year][quarter]).forEach(function(index) {
                        self.select2(year, quarter, index);
                    })
                })
            })
        }
    },
    mounted: function() {
        var self = this;
        var shouldInitSelect2 = false;
        this.$store.dispatch('setTitle', 'Planner')
        $script.ready('select2', function() {
            self.$store.dispatch('fetchHistoricData').then(function() {
                return self.$store.dispatch('loadLocalAcademicPlanner');
            })
            .then(function() {
                //self.recalculate('yes');
                self.windowFrequency()
                if (Object.keys(self.academicPlanner).length > 0) {
                    self.table = self.academicPlanner;
                }
                if (Object.keys(self.table).length > 0) {
                    shouldInitSelect2 = true;
                    self.alert.okBtn('Cool!').alert('<p>We found a planner saved in your browser!</p>')
                }else{
                    self.addYearAndFull('yes')
                }
                self.$nextTick(function() {
                    self.historicDataLoaded = true;
                    self.$nextTick(function() {
                        if (shouldInitSelect2) self.initSelect2()
                    })
                })
            })
        })
    }
}
</script>

<style>
.select2-selection--single input[type="search"] {
    height: 1rem;
}
.select2-results, .select2-selection__choice {
    font-size: .75rem; /* h6 */
}
</style>
