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
var storage = require('../../lib/vuex/plugins/storage')

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
    },
    created: function() {
        var self = this;
        storage.keys().then(function(keys) {
            Bluebird.map(keys, function(key) {
                return storage.getItem(key).then(function(events) {
                    if (events !== null && events.length > 0) {
                        self.saved.push(key);
                    }
                })
            }, { concurrency: 4 })
        }).then(function() {
            self.$store.dispatch('hideSpinner')
        })
    },
    mounted: function() {
        this.$store.dispatch('setTitle', 'Terms List');
    }
}
</script>
