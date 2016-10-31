<template>
    <div>
        <div class="ml1 mt1 mb1">
            <router-link class="btn button-narrow mxn2 muted" :to="{ name: 'termsList' }" tag="span">P</router-link>
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
            <span v-if="route.name === 'termListView'">
                <span class="btn button-narrow mxn1">
                    List of Classes for {{ termName }}
                </span>
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
    computed: {
        route: function() {
            return this.$store.getters.route;
        },
        termName: function() {
            return this.$store.getters.termName;
        }
    }
}
</script>
