<template>
    <transition-group name="fade" mode="in-out">
        <div class="overflow-hidden bg-white mb2 clearfix h5" key="planner" v-show="historicDataLoaded">
            <div class="m0 p1 mb1">
                <div class="clearfix">
                    <span class="btn black h5">Interactive Academic Planner: <a @click="share">string</a> <a @click="fillPDF">fill</a></span>
                </div>
                <div class="clearfix">
                    <span class="ml1 btn black h6 muted not-clickable block">
                        Classes are shown based on the their statistical frequencies, not a guarantee that the school will offer these classes in the quarter.
                    </span>
                    <span class="ml1 btn black h6 muted not-clickable block">
                        We also recommend that you use this planner on a larger screen.
                    </span>
                </div>
                <form class="hide" action="/fillAcademicPlannerPDF" target="_blank" method="post" id="fillPDF">
                    <input type="hidden" :name="name" :value="value" v-for="(value, name) in pdfFormData"/>
                </form>
            </div>
            <div class="m0 p1">
                <div class="clearfix center">
                    <div class="inline-block col col-2">
                        <div class="col col-6">
                            <div @click="addYear"
                            v-show="!modifyingTable"
                            class="h5 black clickable"
                            v-bind:style="{ backgroundColor: colorMap.blank }">
                                <i class="fa fa-plus-square-o fa-lg"></i>
                            </div>
                            <div v-show="modifyingTable"
                            class="h5 black non-clickable">
                                <i class="fa fa-spinner fa-pulse fa-lg fa-fw"></i>
                            </div>
                        </div>
                        <div class="col col-6" v-show="Object.keys(table).length > 1">
                            <div @click="delYear"
                            v-show="!modifyingTable"
                            class="h5 black clickable"
                            v-bind:style="{ backgroundColor: colorMap.blank }">
                                <i class="fa fa-minus-square-o fa-lg"></i>
                            </div>
                            <div v-show="modifyingTable"
                            class="h5 black non-clickable">
                                <i class="fa fa-spinner fa-pulse fa-lg fa-fw"></i>
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
                        <div class="p1 col col-12 parent-cell">
                            <div class="child-cell h6" @click="focusEdit">
                                <span v-if="year == 1 && editingYear === true">
                                    <input id="editingYear" class="inline-block field" size="4" v-model.lazy="plannerYear" v-on:blur="finishEdit" /> - {{ parseInt(plannerYear) + parseInt(year) }}
                                </span>
                                {{ (year > 1 || (year == 1 && editingYear === false)) ? !(plannerYear > 0) ?
                                    '...' :
                                    (parseInt(plannerYear) + parseInt(year) - 1) + ' - ' + (parseInt(plannerYear) + parseInt(year))
                                    : ''
                                }}
                            </div>
                        </div>
                    </div>
                    <div class="inline-block col col-10">
                        <div class="inline-block col col-3" v-for="(courses, quarter) in table[year]">
                            <div class="p1 col col-12">
                                <select multiple style="width: 100%" v-model="table[year][quarter]" v-bind:id="year + '-' + quarter">
                                    <!--<option :value="code" v-for="code in Object.keys(historicData[quarter])">{{ code }} ({{ (historicData[quarter][code] * 100).toPrecision(4) }}%)</option>-->
                                    <option :value="code" v-for="code in historicData[quarter]" track-by="code">{{ code }}</option>
                                </select>
                            </div>
                            <!--<div class="p1 col col-12 center">
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
                            </div>-->
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="overflow-hidden bg-white rounded mb2 clearfix" key="export" v-show="historicDataLoaded">
            <div class="m0 p2">
                <div class="clearfix">
                    <div class="right">
                        <a class="btn btn-outline white h6" v-bind:style="{ backgroundColor: colorMap.TBA }" @click="fillPDF">
                            Export to PDF
                        </a>
                    </div>
                </div>
            </div>
        </div>
        <div class="overflow-hidden bg-white rounded mb2" key="loading" v-show="!historicDataLoaded">
            <div class="m0 p2">
                <div class="clearfix">
                    {{ loadingMessage }}
                </div>
            </div>
        </div>
        <div class="overflow-hidden bg-white rounded mb2 h5" key="feature">
            <div class="m0 p1">
                <p>Very soon, you will be able to select classes based on your major/minor, <strike>and be able to export this so you can bring the printed version to declare your major.</strike></p>
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
            historicData: {},
            selectizeRef: {},
            modifyingTable: false,
            loadingMessage: '',
            plannerYear: '2016',
            editingYear: false,
            pdfFormData: {}
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
        addYear: function(string) {
            this.modifyingTable = true;
            var self = this;
            this.$nextTick(function() {
                // add some delay so it doesn't lag the user
                setTimeout(function() {
                    var largest = Object.keys(self.table).length === 0 ? 0 : Object.keys(self.table).reduce(function(x,y){
                        return (x > y) ? x : y;
                    });
                    self.$set(self.table, parseInt(largest) + 1, {
                        fall: [],
                        winter: [],
                        spring: [],
                        summer: []
                    } )
                    self.$nextTick(function() {
                        self.quarters.forEach(function(quarter) {
                            self.Selectize(parseInt(largest) + 1, quarter)
                        })
                        self.modifyingTable = false;
                        if (string !== 'skipSave') self.savePlaner();
                    })
                }, 500)
            })
        },
        Selectize: function(year, quarter) {
            var self = this;
            this.selectizeRef[year + '-' + quarter] = $('#' + year + '-' + quarter).selectize({
                placeholder: 'select...',
                dropdownParent: "body",
                onItemAdd: function(value, $item) {
                    self.table[year][quarter].push(value);
                    self.savePlaner();
                },
                onItemRemove: function(value) {
                    self.table[year][quarter] = self.table[year][quarter].filter(function(el) {
                        return el != value;
                    });
                    self.savePlaner();
                },
                render: {
                    item: function(item, escape) {
                        return '<div class="h6">' + escape(item.value) + '</div>';
                    }
                }
            })
        },
        unSelectize: function(year, quarter) {
            this.selectizeRef[year + '-' + quarter][0].selectize.destroy()
        },
        delYear: function() {
            this.modifyingTable = true;
            var self = this;
            this.$nextTick(function() {
                // add some delay so it doesn't lag the user
                setTimeout(function() {
                    var largest = Object.keys(self.table).length === 0 ? -1 : Object.keys(self.table).reduce(function(x,y){
                        return (x > y) ? x : y;
                    });
                    if (largest === -1) return -1;
                    Object.keys(self.table[largest]).forEach(function(quarter) {
                        self.unSelectize(largest, quarter);
                        self.$delete(self.table[largest], quarter);
                    })
                    self.$delete(self.table, parseInt(largest));
                    self.modifyingTable = false;
                    self.savePlaner();
                }, 500)
            })
        },
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
            result = null;
            threshold = null;
        },
        // MA End
        savePlaner: function() {
            var self = this;
            Object.keys(self.table).forEach(function(year) {
                Object.keys(self.table[year]).forEach(function(quarter) {
                    self.table[year][quarter] = self.table[year][quarter].filter(function(v, i, s) {
                        return s.indexOf(v) === i;
                    });
                })
            })
            this.$store.commit('saveAcademicPlanner', {
                plannerYear: this.plannerYear,
                table: this.table
            })
        },
        initSelectize: function() {
            var self = this;
            Object.keys(self.table).forEach(function(year) {
                Object.keys(self.table[year]).forEach(function(quarter) {
                    self.Selectize(year, quarter);
                })
            })
        },
        focusEdit: function() {
            this.editingYear = true
            this.$nextTick(function() {
                $('#editingYear').focus()
            })
        },
        finishEdit: function() {
            this.editingYear = false;
            this.savePlaner();
        },
        share: function() {
            var json = JSON.stringify({
                y: this.plannerYear,
                t: this.table
            });
            console.log(json)
            console.log(json.length);
            var compress = LZString.compressToEncodedURIComponent(json);
            console.log(compress)
            console.log(compress.length)
        },
        fillPDF: function() {
            var self = this;
            var offset = {
                fall: 3,
                winter: 2,
                spring: 1,
                summer: 0
            };
            Object.keys(self.table).forEach(function(year) {
                if (year == '1') {
                    self.$set(self.pdfFormData, '20', self.plannerYear.slice(-2))
                    self.$set(self.pdfFormData, '20_' + (1 + parseInt(year)), (parseInt(self.plannerYear.slice(-2)) + 1))
                }else{
                    self.$set(self.pdfFormData, '20_' + (2 * parseInt(year) - 1),  (parseInt(self.plannerYear.slice(-2)) + parseInt(year - 1)))
                    self.$set(self.pdfFormData, '20_' + (2 * parseInt(year)), (parseInt(self.plannerYear.slice(-2)) +  parseInt(year)))
                }
                Object.keys(self.table[year]).forEach(function(quarter) {
                    for (var i = 0, length = self.table[year][quarter].length; i < length; i++) {
                        if (year == '1' && quarter == 'fall') {
                            self.$set(self.pdfFormData, i + 1, self.table[year][quarter][i]);
                        }else{
                            self.$set(self.pdfFormData, (i + 1) + '_' + ((year * 4) - offset[quarter]), self.table[year][quarter][i]);
                        }
                    }
                })
            })
            self.$nextTick(function() {
                $('#fillPDF').submit();
                Object.keys(self.pdfFormData).forEach(function(key) {
                    self.$delete(self.pdfFormData, key);
                })
            })
        }
    },
    mounted: function() {
        var self = this;
        var shouldInitSelectize = false;
        this.$store.dispatch('setTitle', 'Planner')
        $script.ready('selectize', function() {
            self.loadingMessage = 'Loading historical data...'
            self.$store.dispatch('fetchHistoricData').then(function() {
                self.loadingMessage = 'Calculating available courses...'
                self.windowFrequency()
            })
            .then(function() {
                self.loadingMessage = 'Loading GUI...'
                return self.$store.dispatch('loadLocalAcademicPlanner');
            })
            .then(function() {
                if (self.academicPlanner !== null) {
                    if (typeof self.academicPlanner.plannerYear !== 'undefined') {
                        self.plannerYear = self.academicPlanner.plannerYear;
                        self.table = self.academicPlanner.table;
                    }else{
                        // backward compatibility
                        self.table = self.academicPlanner
                    }
                }
                if (Object.keys(self.table).length > 0) {
                    shouldInitSelectize = true;
                    self.alert.okBtn('Cool!').alert('<p>We found a planner saved in your browser!</p>')
                }else{
                    //self.addYearAndFull('yes')
                    self.addYear('skipSave');
                    self.editingYear = true;
                }
                self.$nextTick(function() {
                    self.historicDataLoaded = true;
                    self.$nextTick(function() {
                        if (shouldInitSelectize) self.initSelectize()
                    })
                })
            })
        })
    },
    beforeDestroy: function() {
        // garbage collection
        var self = this;
        Object.keys(self.table).forEach(function(year) {
            Object.keys(self.table[year]).forEach(function(quarter) {
                self.unSelectize(year, quarter);
            })
        })
    }
}
</script>

<style>
.parent-cell {
    position: relative;
    transform-style: preserve-3d;
}
.child-cell {
    position: absolute;;
    top: 50%;
    left: 50%;
    transform: translate(-50%, 50%);
}
</style>
