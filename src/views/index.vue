<template>
    <div>
        <div class="mt2 mb1">
            <div class="overflow-hidden bg-white rounded mb2">
                <div class="m0 p1">
                    <div class="clearfix">
                        <span class="btn black h4">Class Related: </span>
                    </div>
                    <div class="clearfix">
                        <span class="ml1 btn black h5 muted not-clickable">Here are the tools to help you get through registration faster.</span>
                    </div>
                </div>
                <div class="m0 p2 border-top">
                    <div class="clearfix">
                        <div class="md-flex">
                            <router-link class="p2 flex-auto m1 h5 white clickable btn-outline" v-bind:style="{ backgroundColor: colorMap.alert }" :to="{ name: 'termsList' }" tag="div"><i class="fa fa-calendar fa-2x">&nbsp;</i>Interactive Quarter Planner</router-link>
                            <router-link class="p2 flex-auto m1 h5 white clickable btn-outline" v-bind:style="{ backgroundColor: colorMap.regular }" :to="{ name: 'advMenu' }" tag="div"><i class="fa fa-check fa-2x">&nbsp;</i>Academic Career Advisory</router-link>
                            <router-link class="p2 flex-auto m1 h5 white clickable btn-outline" v-bind:style="{ backgroundColor: colorMap.regular }" :to="{ name: 'enrollHelper' }" tag="div"><i class="fa fa-bell fa-2x">&nbsp;</i>Notify Me When My Classes Are Open</router-link>
                        </div>
                    </div>
                </div>
            </div>
            <div class="overflow-hidden bg-white rounded mb2">
                <div class="m0 p1">
                    <div class="clearfix">
                        <span class="btn black h4">Nerd Stats: </span>
                    </div>
                    <div class="clearfix">
                        <span class="ml1 btn black h5 muted not-clickable">Because we all love data.</span>
                    </div>
                </div>
                <div class="m0 p2 border-top">
                    <div class="clearfix">
                        <div class="sm-flex">
                            <router-link class="p2 flex-auto m1 h5 white clickable btn-outline" v-bind:style="{ backgroundColor: colorMap.regular }" :to="{ name: 'analyticsCourse' }" tag="div"><i class="fa fa-line-chart fa-2x">&nbsp;</i>Enrollment Analytics</router-link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
<script>
module.exports = {
    computed: {
        title: function() {
            return this.$store.getters.title;
        },
        colorMap: function() {
            return this.$store.getters.colorMap;
        }
    },
    mounted: function() {
        this.$store.dispatch('setTitle', 'Main')
    }
}
</script>
