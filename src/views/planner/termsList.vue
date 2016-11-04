<template>
    <div>
        <div class="overflow-hidden bg-white rounded mb2">
            <div class="m0 p0">
                <div class="clearfix">
                    <div class="left black">
                        <span class="btn h6 muted not-clickable">
                            click a quarter to open a planner
                        </span>
                    </div>
                </div>
            </div>
            <template v-for="(term, index) in flatTermsList" track-by="term.code">
                <div class="m0 p0 border-top" v-bind:class="{ 'hide': index > 3 && hidePrior }">
                    <div class="clearfix">
                        <div class="left black">
                            <router-link :to="{ name: 'term', params: { termId: term.code } }" class="btn block h5" v-bind:class="{ 'muted': index > 0 }">
                                {{ term.name }}
                            </router-link>
                        </div>
                        <div class="right">
                            <a class="btn h6 muted not-clickabble" v-show="saved.indexOf(term.code) !== -1">
                                &#128190;
                            </a>
                        </div>
                    </div>
                </div>
            </template>
            <div class="m0 p0 border-top">
                <div class="clearfix">
                    <div class="left black">
                        <a class="gray muted btn block h6" @click="hidePrior = !hidePrior">
                            click here to {{ hidePrior ? 'show': 'hide' }} prior quarters
                        </a>
                    </div>
                </div>
            </div>
        </div>
        <div class="overflow-hidden bg-white rounded mb2" v-show="historicDataLoaded">
            <div class="m0 p1">
                <div class="clearfix">
                    <a class="btn black h5" v-on:click="hideHistoric = !hideHistoric">Wondering what classes will be offered next? </a>
                </div>
                <div class="clearfix" v-bind:class="{ 'hide': hideHistoric }">
                    <span class="ml1 btn black h6 muted not-clickable">
                        Look up the frequency of classes offered historically.
                    </span>
                </div>
            </div>
            <div class="m0 p2 border-top" v-bind:class="{ 'hide': hideHistoric }">
                <div class="clearfix">
                    <input type="text" class="field block mb2 search-box" v-model="search.string" placeholder="EE 177, ECON 117B, ..." onmouseover="this.focus()">
                    <div class="overflow-scroll" v-show="search.results.length > 0">
                        <table class="table-light">
                            <thead class="bg-darken-1 h6">
                                <th>Course</th>
                                <th>Quarter</th>
                                <th>Frequency</th>
                                <th>Occurence</th>
                            </thead>
                            <tbody class="h5">
                                <tr v-for="result in search.results">
                                    <td>{{ result.code }}</td>
                                    <td>{{ result.qtr }}</td>
                                    <td>{{ result.fre }}</td>
                                    <td>{{ result.occur }}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <div v-show="search.string.length > 0 && search.results.length === 0">
                        No results.
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
var debounce = require('lodash.debounce')
var storage = require('../../lib/vuex/plugins/storage')

module.exports = {
    data: function() {
        return {
            historicDataLoaded: false,
            hideHistoric: true,
            hidePrior: true,
            saved: [],
            search: {
                years: ['2004', '2005', '2006', '2007', '2008', '2009', '2010', '2011', '2012', '2013', '2014', '2015', '2016'],
                string: '',
                results: []
            }
        }
    },
    computed: {
        historicData: function() {
            return this.$store.getters.historicData;
        },
        flatTermsList: function() {
            return this.$store.getters.flatTermsList;
        }
    },
    methods: {
        groupBy: function(xs, key) {
            return xs.reduce(function(rv, x) {
                (rv[x[key]] = rv[x[key]] || []).push(x);
                return rv;
            }, {});
        },
        findHistorical: debounce(function() {
            var self = this;
            var results = [];
            // TODO: let's not brute force it
            for (var quarter in this.historicData){
                for (var code in this.historicData[quarter]) {
                    if (code.toLowerCase().replace(/\s/g, '').indexOf(this.search.string.toLowerCase().replace(/\s/g, '')) !== -1) {
                        var keys = Object.keys(this.historicData[quarter][code]);
                        results.push({
                            code: code,
                            qtr: quarter,
                            fre: keys.length + '/' + this.search.years.length,
                            occur: keys.join(', ')
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
            if (this.$store.getters.Tracker !== null) {
                this.$store.getters.Tracker.trackSiteSearch(this.search.string, 'findHistorical', this.search.results.length)
            }
        }, 750)
    },
    watch: {
        'search.string': function(val, oldVal) {
            if (val.length < 1) {
                this.search.results = [];
                return;
            }
            this.findHistorical();
        }
    },
    created: function() {
        var self = this;
        storage.keys().then(function(keys) {
            keys.forEach(function(key) {
                storage.getItem(key).then(function(events) {
                    if (events !== null && events.length > 0) {
                        self.saved.push(key);
                    }
                })
            })
        })
        this.$store.dispatch('fetchHistoricData').then(function() {
            self.historicDataLoaded = true;
        })
    },
    mounted: function() {
        this.$store.dispatch('setTitle', 'Terms List');
    }
}
</script>
