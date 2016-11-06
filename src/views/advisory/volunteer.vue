<template>
    <div>
        <transition-group name="fade" mode="out-in">
            <div class="overflow-hidden bg-white rounded mb2" key="list" v-show="!showForm">
    			<div class="m0 p1">
    				<div class="clearfix">
    					<span class="btn black h4">Stronger Together: </span>
    				</div>
    				<div class="clearfix">
    					<span class="ml1 btn black h5 muted not-clickable">
                            Because of my incompetence, I cannot provide you with all the major/minor requirements. But, you can help!
                        </span>
    				</div>
    			</div>
                <div class="m0 p1 border-top">
                    <div class="clearfix">
                        <span class="btn black h4">First, select a major which you would like to help out: </span>
                    </div>
                    <div class="m0 p1">
                        <div class="clearfix">
                            <router-link class="btn p1 m1 h6 white bold clickable btn-outline"
                            v-for="major in majorMinor.majors"
                            v-bind:style="{ backgroundColor: colorMap.regular }"
                            :to="{ name: 'reqVolunteerForm', params: { type: 'major', 'name': Object.keys(major)[0] }}"
                            tag="div">
                                {{ Object.keys(major)[0] }}
                            </router-link>
                        </div>
                    </div>
                    <div class="clearfix">
                        <span class="btn black h4">Or, a minor: </span>
                    </div>
                    <div class="m0 p1">
                        <div class="clearfix">
                            <router-link class="btn p1 m1 h6 white bold clickable btn-outline"
                            v-for="minor in majorMinor.minors"
                            v-bind:style="{ backgroundColor: colorMap.regular }"
                            :to="{ name: 'reqVolunteerForm', params: { type: 'minor', 'name': minor }}"
                            tag="div">
                                {{ minor }}
                            </router-link>
                        </div>
                    </div>
                </div>
    		</div>
            <div class="overflow-hidden bg-white rounded mb2" key="form" v-if="showForm">
    			<div class="m0 p1">
    				<div class="clearfix">
    					<span class="btn black h4">Stronger Together: </span>
    				</div>
    				<div class="clearfix">
    					<span class="ml1 btn black h5 muted not-clickable">
                            Because of my incompetence, I cannot provide you with all the major/minor requirements. But, you can help!
                        </span>
    				</div>
    			</div>
    		</div>
        </transition-group>
    </div>
</template>

<script>
module.exports = {
    computed: {
        route: function() {
            return this.$store.getters.route;
        },
        title: function() {
            return this.$store.getters.title;
        },
        colorMap: function() {
            return this.$store.getters.colorMap;
        },
        majorMinor: function() {
            return this.$store.getters.majorMinor;
        },
        'showForm': function() {
            return (this.route && this.route.params && this.route.params.type);
        }
    },
    mounted: function() {
        this.$store.dispatch('setTitle', 'Volunteer')
    }
}
</script>
