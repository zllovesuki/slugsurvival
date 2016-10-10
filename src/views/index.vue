<template>
    <div>
        <div class="mt2 mb1">
            <div class="overflow-hidden bg-white rounded mb2">
                <div class="m0 p1">
                    <div class="clearfix">
                        <span class="btn black h4">Class Related: </span>
                    </div>
                    <div class="clearfix">
                        <span class="ml1 btn black h5 muted not-clickable">Here are the tools to save you from my.ucsc.edu</span>
                    </div>
                </div>
                <div class="m0 p2 border-top">
                    <div class="clearfix">
                        <a class="h6 ml2 mb1 bold btn btn-outline {{ color }}" v-link="{ name: 'termsList' }">Interactive Planner</a>
                        <a class="h6 ml2 mb1 bold btn btn-outline {{ color }}"  v-link="{ name: 'enrollHelper' }">Notify Me When My Classes Are Open</a>
                        <a class="h6 ml2 mb1 bold btn btn-outline {{ color }}"  v-link="{ name: 'analyticsHelper' }">Enrollment Analytics</a>
                        <a class="h6 ml2 mb1 bold btn btn-outline {{ color }}" @click="comingSoon">Major/Minor Requirements</a>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
<script>

var getters = require('../lib/vuex/getters.js')
var actions = require('../lib/vuex/actions.js')

module.exports = {
    vuex: {
        getters: getters,
        actions: actions
    },
    ready: function() {
        this.setTitle('Main')
    }
}
</script>
