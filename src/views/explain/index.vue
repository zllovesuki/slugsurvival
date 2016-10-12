<template>
    <div>
        <div class="ml1 mt1 mb1">
            <router-link class="btn button-narrow mxn2 muted" :to="{ name: 'explain' }" tag="span">?</router-link>
            <chevron-right></chevron-right>
            <span class="btn button-narrow mxn1">
                Explaining Things
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
