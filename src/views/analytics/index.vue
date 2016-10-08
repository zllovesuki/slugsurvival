<template>
    <div>
        <div class="ml1 mt1 mb1">
            <span class="btn button-narrow mxn2 muted" v-link="{ name: 'analytics' }">A</span>
            <chevron-right></chevron-right>
            <span class="btn button-narrow mxn1">
                Analytics (alpha)
            </span>
        </div>
        <div class="mt2 mb1">
            <router-view transition="fade"></router-view>
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
    created: function() {
        var self = this;
        $script([dist + 'Chart.js/2.3.0/Chart.bundle.min.js', dist + 'moment/2.14.1/moment.min.js'], 'Chart.js')
    }
}
</script>
