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
                    <!--<div class="right">
                        <span class="btn h6">
                            last updated
                        </span>
                    </div>-->
                </div>
            </div>
            <template v-for="term in flatTermsList" track-by="code">
                <div class="m0 p0 border-top" v-bind:class="{ 'hide': $index > 3 && hidePrior }">
                    <div class="clearfix">
                        <div class="left black">
                            <a v-link="{ name: 'term', params: { termId: term.code } }" class="btn block h5" v-bind:class="{ 'muted': $index > 0 }">
                                {{ term.name }}
                            </a>
                        </div>
                        <!--<div class="right">
                            <a class="btn h6 muted not-clickabble">
                                {{ convertTimestamp(term.timestamp) }}
                            </a>
                        </div>-->
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
    </div>
</template>

<script>
    var getters = require('../../lib/vuex/getters.js')
    var actions = require('../../lib/vuex/actions.js')

    module.exports = {
        vuex: {
            getters: getters,
            actions: actions
        },
        data: function() {
            return {
                hidePrior: true
            }
        },
        methods: {
            convertTimestamp: function(timestamp) {
                var d = new Date(timestamp * 1000), // Convert the passed timestamp to milliseconds
                    yyyy = d.getFullYear(),
                    mm = ('0' + (d.getMonth() + 1)).slice(-2), // Months are zero based. Add leading 0.
                    dd = ('0' + d.getDate()).slice(-2), // Add leading 0.
                    time;

                time = yyyy + '-' + mm + '-' + dd;

                return time;
            }
        },
        ready: function() {
            this.setTitle('Terms List')
        }
    }
</script>
