<template>
    <div>
        <div class="ml1 mt1 mb1">
            <router-link class="btn button-narrow mxn2 muted" :to="{ name: 'mainPage' }" tag="span">E</router-link>
            <chevron-right></chevron-right>
            <span v-if="route.name === 'enrollHelper'">
                <span class="btn button-narrow mxn1">
                    Course Opening Tracker (beta)
                </span>
            </span>
            <span v-if="route.name === 'enrollManage'">
                <span class="btn button-narrow mxn1">
                    Manage Notification
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
    computed: {
        route: function() {
            return this.$store.getters.route;
        }
    },
    components: {
        chevronRight: require('../../lib/icons/chevron-right.vue')
    }
}
</script>
