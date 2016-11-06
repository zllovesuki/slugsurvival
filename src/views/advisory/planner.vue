<template>
    <transition-group name="fade" mode="in-out">
        <div class="overflow-hidden bg-white mb2 clearfix h5" key="planner" v-show="historicDataLoaded">
            <div class="m0 p1 mb1">
                <div class="clearfix">
                    <span class="btn black h5">Interactive Academic Planner: </span>
                </div>
                <div class="clearfix">
                    <span class="ml1 btn black h6 not-clickable block">
                        Classes are shown based on the their frequency. Change the threshold: &nbsp;
                        <select v-model="historicThreshold">
                            <option value="0.9">0.9</option>
                            <option value="0.8">0.8</option>
                            <option value="0.7">0.7</option>
                            <option value="0.6">0.6</option>
                        </select>
                    </span>
                    <span class="ml1 btn black h6 muted not-clickable block">
                        A higher threshold means <i>higher confidence</i>, which gives you more accurate results.
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
                                        <option :value="code" v-for="code in Object.keys(historicData[quarter])">{{ code }} ({{ (historicData[quarter][code] * 100).toPrecision(4) }}%)</option>
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
module.exports = {
    data: function() {
        return {
            quarters: ['fall', 'winter', 'spring', 'summer'],
            table: {},
            historicDataLoaded: false,
            historicThreshold: "0.8",
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
    watch: {
        'historicThreshold': function() {
            this.recalculate();
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
                placeholder: 'select...',
                templateSelection: function(d) {
                    return d.id;
                }
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
        recalculate: function(blockSave) {
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
        },
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
                self.recalculate('yes');
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
