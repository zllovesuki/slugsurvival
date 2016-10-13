<template>
    <div>
        <div class="ml1 mt1 mb1">
            <router-link class="btn button-narrow mxn2 muted" :to="{ name: 'analyticsHelper' }" tag="a">A</router-link>
            <chevron-right></chevron-right>
            <span class="btn button-narrow mxn1">
                Analytics (alpha)
            </span>
        </div>
        <div class="mt2 mb1">
            <transition name="fade" mode="out-in">
                <router-view></router-view>
            </transition>
        </div>
    </div>
</template>
<script>
module.exports = {
    components: {
        chevronRight: require('../../lib/icons/chevron-right.vue')
    },
    mounted: function() {
        var self = this;
        $script(dist + 'plotly.js/1.17.3-no-promise-polyfill/plotly-basic.min.js', 'plotly.js')
    }
}
</script>
