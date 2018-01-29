<template>
    <div>
        <div class="overflow-hidden bg-white rounded mb2">
            <div class="m0 p0">
                <div class="clearfix">
                    <div class="left black">
                        <span class="btn h6 muted not-clickable">
                            click a quarter to open a planner
                        </span>
                    </div>
                </div>
            </div>
            <div class="m0 p0 border-top" v-bind:class="{ 'hide': index > 3 && hidePrior }" v-for="(term, index) in flatTermsList" :key="term.code">
                <div class="clearfix">
                    <div class="left black">
                        <router-link :to="{ name: 'term', params: { termId: term.code } }" class="btn block h5" v-bind:class="{ 'muted': index > 0 }">
                            {{ term.name }}
                        </router-link>
                    </div>
                    <div class="right">
                        <a class="btn h6 muted not-clickabble" v-show="saved.indexOf(term.code) !== -1">
                            &#128190;
                        </a>
                    </div>
                </div>
            </div>
            <div class="m0 p0 border-top">
                <div class="clearfix">
                    <div class="left black">
                        <a class="gray muted btn block h6" @click="hidePrior = !hidePrior">
                            click here to {{ hidePrior ? 'show': 'hide' }} prior quarters
                        </a>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>

module.exports = {
    data: function() {
        return {
            hidePrior: true,
            saved: []
        }
    },
    computed: {
        flatTermsList: function() {
            return this.$store.getters.flatTermsList;
        },
        storage: function() {
            return this.$store.getters.storage;
        }
    },
    created: function() {
        var self = this;
        Bluebird.map(self.flatTermsList, function(term) {
            return self.storage.getItem(term.code).then(function(events) {
                if (events !== null) self.saved.push(term.code)
            })
        }).then(function() {
            self.$store.dispatch('hideSpinner')
        })
    },
    mounted: function() {
        this.$store.dispatch('setTitle', 'Terms List');
    }
}
</script>
