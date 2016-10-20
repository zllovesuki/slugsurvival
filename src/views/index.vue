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
                        <router-link class="h6 ml2 mb1 bold btn btn-outline white" v-bind:style="{ backgroundColor: colorMap.regular }" :to="{ name: 'termsList' }">Interactive Planner</router-link>
                        <router-link class="h6 ml2 mb1 bold btn btn-outline white" v-bind:style="{ backgroundColor: colorMap.regular }" :to="{ name: 'enrollHelper' }">Notify Me When My Classes Are Open</router-link>
                        <a class="h6 ml2 mb1 bold btn btn-outline white" v-bind:style="{ backgroundColor: colorMap.regular }" @click="$store.dispatch('comingSoon')">Major/Minor Requirements</a>
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
                        <router-link class="h6 ml2 mb1 bold btn btn-outline white" v-bind:style="{ backgroundColor: colorMap.regular }" :to="{ name: 'analyticsCourse' }">Enrollment Analytics</router-link>
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
