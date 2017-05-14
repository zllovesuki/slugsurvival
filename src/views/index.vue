<template>
    <div>
        <div class="mt1 mb1">
            <div class="overflow-hidden bg-white rounded mb2">
                <div class="m0 p1">
                    <div class="clearfix">
                        <a class="btn black h4">Quick Search:</a>
                    </div>
                    <div class="clearfix">
                        <span class="ml2 btn black h5 muted not-clickable">
                            Look up classes by code, and the availbility predictions.
                        </span>
                    </div>
                </div>
                <div class="m0 p2 border-top">
                    <div class="clearfix">
                        <input type="text" style="border: 0 !important" class="field black block col col-12 mb2 search-box" v-model="search.string" placeholder="e.g. EE 177, ECON 117B, ..." onmouseover="this.focus()">
                        <div class="ml1 block" v-show="search.insufficient && search.string.length > 0">
                            ...Need three or more characters
                        </div>
                        <div class="ml1 block" v-show="!search.insufficient && search.dirty">
                            ...Typing
                        </div>
                        <div class="overflow-scroll col col-12 block" v-show="search.results.length > 0 && !search.dirty">
                            <table class="table-light">
                                <thead class="bg-darken-1 h6">
                                    <th>Course</th>
                                    <th>Quarter</th>
                                    <th>Likely?</th>
                                    <th>Frequency</th>
                                    <th>Occurence</th>
                                </thead>
                                <tbody class="h5">
                                    <tr v-for="result in search.results" @click="promptShowCourse(result)" class="clickable">
                                        <td class="nowrap">{{ result.code }}</td>
                                        <td>{{ result.qtr }}</td>
                                        <td>{{ result.pos }}</td>
                                        <td>{{ result.fre }}</td>
                                        <td class="nowrap">{{ result.occur }}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <div class="ml1 col col-12 block" v-show="search.string.length >= 3 && search.results.length === 0 && !search.dirty">
                            No results.
                        </div>
                    </div>
                </div>
            </div>
            <div class="overflow-hidden bg-white rounded mb2">
                <div class="m0 p1">
                    <div class="clearfix">
                        <span class="btn black h4">Class Related: </span>
                    </div>
                    <div class="clearfix">
                        <span class="ml1 btn black h5 muted not-clickable">Here are the tools to help you get through registration faster.</span>
                    </div>
                </div>
                <div class="m0 p2 border-top">
                    <div class="clearfix">
                        <div class="md-flex">
                            <router-link class="p2 flex-auto m1 h5 white clickable btn-outline" v-bind:style="{ backgroundColor: colorMap.alert }" :to="{ name: 'termsList' }" tag="div"><i class="fa fa-calendar fa-2x">&nbsp;</i>Interactive Quarter Planner</router-link>
                            <router-link class="p2 flex-auto m1 h5 white clickable btn-outline" v-bind:style="{ backgroundColor: colorMap.regular }" :to="{ name: 'advMenu' }" tag="div"><i class="fa fa-check fa-2x">&nbsp;</i>Academic Career Advisory</router-link>
                            <router-link class="p2 flex-auto m1 h5 white clickable btn-outline" v-bind:style="{ backgroundColor: colorMap.regular }" :to="{ name: 'enrollHelper' }" tag="div"><i class="fa fa-bell fa-2x">&nbsp;</i>Notify Me When My Classes Are Open</router-link>
                        </div>
                    </div>
                </div>
            </div>
            <div class="overflow-hidden bg-white rounded mb2">
                <div class="m0 p1">
                    <div class="clearfix">
                        <span class="btn black h4">Nerd Stats: </span>
                    </div>
                    <div class="clearfix">
                        <span class="ml1 btn black h5 muted not-clickable">Because we all love data.</span>
                    </div>
                </div>
                <div class="m0 p2 border-top">
                    <div class="clearfix">
                        <div class="sm-flex">
                            <router-link class="p2 flex-auto m1 h5 white clickable btn-outline" v-bind:style="{ backgroundColor: colorMap.regular }" :to="{ name: 'analyticsCourse' }" tag="div"><i class="fa fa-line-chart fa-2x">&nbsp;</i>Enrollment Analytics</router-link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
<script>
var debounce = require('lodash.debounce')
var helper = require('../lib/vuex/helper')
module.exports = {
    data: function() {
        return {
            search: {
                string: '',
                results: [],
                insufficient: false,
                dirty: false
            }
        }
    },
    computed: {
        alert: function() {
            return this.$store.getters.alert;
        },
        title: function() {
            return this.$store.getters.title;
        },
        colorMap: function() {
            return this.$store.getters.colorMap;
        },
        numOfYears: function() {
            return this.$store.getters.numOfYears
        },
        historicData: function() {
            return this.$store.getters.historicData;
        },
        historicFrequency: function() {
            return this.$store.getters.historicFrequency;
        },
        sortedCourses: function() {
            return this.$store.getters.sortedCourses;
        },
        flatCourses: function() {
            return this.$store.getters.flatCourses;
        }
    },
    methods: {
        promptShowCourse: function(result) {
            var self = this;
            self.$store.dispatch('showSpinner')
            var quarter = result.qtr;
            var year = result.occur.indexOf(',') === -1 ? result.occur : result.occur.slice(0, result.occur.indexOf(','))
            var termId = helper.nameToCode([year, quarter].join(' '))

            var department = result.code.slice(0, result.code.indexOf(' '))
            var number = result.code.slice(result.code.indexOf(' ') + 1)

            return self.$store.dispatch('fetchTermCourses', termId)
            .then(function() {
                try {
                    console.log(self.sortedCourses)
                    var course = self.sortedCourses[termId][department].filter(function(course) {
                        return course.c === result.code;
                    })[0];
                }catch (e) {
                    console.log(e)
                    self.$store.dispatch('hideSpinner')
                    return;
                }

                return self.$store.dispatch('getCourseDom', {
                    termId: termId,
                    courseNum: course.num,
                    courseObj: course,
                    isSection: false,
                    showQuarterYear: true
                }).then(function(html) {
                    self.$store.dispatch('hideSpinner')
                    return self.alert
                    .okBtn('OK')
                    .alert(html)
                    .then(function(resolved) {
                        resolved.event.preventDefault();
                    })
                })
            })

        },
        groupBy: function(xs, key) {
            return xs.reduce(function(rv, x) {
                (rv[x[key]] = rv[x[key]] || []).push(x);
                return rv;
            }, {});
        },
        findHistorical: debounce(function() {
            var self = this;
            var results = [];
            if (this.search.insufficient) return;
            // TODO: let's not brute force it
            for (var quarter in this.historicData){
                for (var code in this.historicData[quarter]) {
                    if (code.toLowerCase().replace(/\s/g, '').indexOf(this.search.string.toLowerCase().replace(/\s/g, '')) !== -1) {
                        var keys = Object.keys(this.historicData[quarter][code]);
                        results.push({
                            code: code,
                            qtr: quarter.charAt(0).toUpperCase() + quarter.slice(1),
                            pos: self.historicFrequency[quarter].indexOf(code) !== -1 ? 'Yes' : 'No',
                            fre: keys.length + '/' + this.numOfYears,
                            occur: keys.length > 4 ? keys.reverse().slice(0, 4).join(', ') + '...' : keys.reverse().join(', ')
                        })
                    }
                }
            }
            results = this.groupBy(results, 'code');
            var _results = [];
            for (var code in results) {
                _results = _results.concat(results[code]);
            }
            this.search.results = _results;
            this.search.dirty = false;
            if (this.$store.getters.Tracker !== null) {
                this.$store.getters.Tracker.trackSiteSearch(this.search.string, 'findHistorical', this.search.results.length)
            }
        }, 750)
    },
    watch: {
        'search.string': function(val, oldVal) {
            if (val.length < 3) {
                this.search.results = [];
                this.search.insufficient = true;
                this.search.dirty = false;
                return;
            }
            this.search.insufficient = false;
            this.search.dirty = true;
            this.findHistorical();
        }
    },
    mounted: function() {
        this.$store.dispatch('setTitle', 'Main')
        this.$nextTick(function() {
            this.$store.dispatch('hideSpinner')
        })
    }
}
</script>
