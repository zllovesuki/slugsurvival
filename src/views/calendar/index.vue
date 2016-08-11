<template>
    <div>
        <div class="ml1 mt1 mb1">
            <span class="btn button-narrow mxn2 muted" v-link="{ name: 'termsList' }">C</span>
            <chevron-right></chevron-right>
            <span v-if="route.name === 'termsList'">
                <span class="btn button-narrow mxn1">
                    Terms List
                </span>
            </span>
            <span v-if="route.name === 'term'">
                <span class="btn button-narrow mxn1">
                    Schedule for {{ termName }}
                </span>
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
    }
}
</script>
