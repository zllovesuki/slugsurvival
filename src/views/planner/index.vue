<template>
    <div>
        <div class="ml1 mt1 mb1">
            <router-link class="btn button-narrow mxn2 muted" :to="{ name: 'termsList' }" tag="span">P</router-link>
            <chevron-right></chevron-right>
            <span v-if="route.name === 'termsList'">
                <span class="btn button-narrow mxn1 h5">
                    Terms List
                </span>
            </span>
            <span v-if="route.name === 'term'">
                <span class="btn button-narrow mxn1 h5">
                    <span v-show="showFinal">Final </span>Schedule for {{ termName }}
                </span>
            </span>
            <span v-if="route.name === 'viewList'">
                <span class="btn button-narrow mxn1 h5">
                    All {{ termName }} Classes
                </span>
            </span>
        </div>
        <div class="mt1 mb1">
            <transition name="fade" mode="out-in">
                <router-view></router-view>
            </transition>
        </div>
    </div>
</template>
<script>
module.exports = {
    components: {
        chevronRight: require('../../lib/icons/chevron-right.vue').default
    },
    computed: {
        route: function() {
            return this.$store.getters.route;
        },
        termName: function() {
            return this.$store.getters.termName;
        },
        showFinal: function() {
            return this.$store.getters.showFinal;
        }
    }
}
</script>
