<template>
    <div>
        <div class="ml1 mt1 mb1">
            <span class="btn button-narrow mxn2 muted" v-link="{ name: 'enrollHelper' }">E</span>
            <chevron-right></chevron-right>
            <span v-if="route.name === 'enrollHelper'">
                <span class="btn button-narrow mxn1">
                    Enrollment Tracker
                </span>
            </span>
            <span v-if="route.name === 'enrollManage'">
                <span class="btn button-narrow mxn1">
                    Manage Tracker
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
