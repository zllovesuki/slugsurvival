<template>
    <div>
        <div class="ml1 mt1 mb1">
            <router-link class="btn button-narrow mxn2 muted" :to="{ name: 'advMenu' }" tag="span">R</router-link>
            <chevron-right></chevron-right>
            <span v-if="route.name === 'advMenu'">
                <span class="btn button-narrow mxn1">
                    Academic Advisory
                </span>
            </span>
            <span v-if="route.name === 'advPlanner'">
                <span class="btn button-narrow mxn1">
                    Career Planner
                </span>
            </span>
            <!--<span v-if="route.name === 'reqVolunteer'">
                <span class="btn button-narrow mxn1">
                    Crowdsourcing
                </span>
            </span>
            <span v-if="route.name === 'reqVolunteerForm'">
                <span class="btn button-narrow mxn1">
                    Fill Them Out
                </span>
            </span>-->
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
        }
    },
    created: function() {
        $script([dist + 'jquery/3.1.0/jquery-3.1.0.min.js', dist + 'lz-string/1.4.4/lz-string.min.js'], 'bundle', function() {
            $script(dist + 'selectize/0.12.4/standalone/selectize.min.js', 'selectize')
        })
    }
}
</script>
