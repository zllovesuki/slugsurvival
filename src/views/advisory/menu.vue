<template>
    <div>
        <div class="overflow-hidden bg-white rounded mb2">
            <div class="m0 p1">
                <div class="clearfix">
                    <span class="btn black h4">Four-Year/Five-Year Planner: </span>
                </div>
                <div class="clearfix">
                    <span class="ml1 btn black h5 muted not-clickable">
                        If you want to declare major/minor, you need to plan your classes throughout your career.
                    </span>
                </div>
            </div>
            <div class="m0 p2 border-top">
                <div class="clearfix">
                    <div class="md-flex">
                        <router-link class="p2 flex-auto m1 h5 white clickable btn-outline" v-bind:style="{ backgroundColor: colorMap.alert }" :to="{ name: 'advPlanner' }" target="_blank" tag="div"><i class="fa fa-book fa-2x">&nbsp;</i>Interactive Academic Planner</router-link>
                    </div>
                </div>
            </div>
        </div>
        <!--<div class="overflow-hidden bg-white rounded mb2 muted">
            <div class="m0 p1">
                <div class="clearfix">
                    <span class="btn black h4">Help Wanted: </span>
                </div>
                <div class="clearfix">
                    <span class="ml1 btn black h5 muted not-clickable">
                        If your intended major is not available, you should help us!
                    </span>
                </div>
            </div>
            <div class="m0 p2 border-top">
                <div class="clearfix">
                    <div class="md-flex">
                        <router-link class="p2 flex-auto m1 h5 white clickable btn-outline" v-bind:style="{ backgroundColor: colorMap.regular }" :to="{ name: 'reqVolunteer' }" target="_blank" tag="div"><i class="fa fa-pencil-square-o fa-2x">&nbsp;</i>Fill Out Requirements for Majors/Minor</router-link>
                    </div>
                </div>
            </div>
        </div>-->
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
        this.$store.dispatch('setTitle', 'Advisory')
    }
}
</script>
