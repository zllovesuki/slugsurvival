<template>
    <div>
        <div class="ml1 mt1 mb1">
            <router-link class="btn button-narrow mxn2 muted" :to="{ name: 'bugzilla' }" tag="span">&#9785;</router-link>
            <chevron-right></chevron-right>
            <span class="btn button-narrow mxn1 h5">
                Please exit this page unless instructed otherwise
            </span>
        </div>
        <div class="mt1 mb1">
            <div class="overflow-hidden bg-white rounded mb4 border">
                <div class="m0 p0">
                    <div class="clearfix">
                        <div class="left black">
                            <span class="btn h6 muted not-clickable">
                                Storage Keys
                            </span>
                        </div>
                    </div>
                </div>
                <div class="m0 p0 border-top" v-bind:class="{ 'bg-darken-1': index % 2 == 0 }" v-for="(key, index) in storageKeys">
                    <div class="clearfix">
                        <div class="left black">
                            <p class="btn block h5">
                                {{ key }}
                            </p>
                        </div>
                        <div class="right">
                            <a class="btn h6 not-clickabble" @click="removeKey(key)">
                                &#10006;
                            </a>
                        </div>
                    </div>
                </div>
            </div>
            <div class="overflow-hidden bg-white rounded mb4 border">
                <div class="m0 p0">
                    <div class="clearfix">
                        <div class="left black">
                            <span class="btn h6 muted not-clickable">
                                States
                            </span>
                        </div>
                        <div class="right">
                            <span class="btn h6 not-clickable">
                                Info
                            </span>
                        </div>
                    </div>
                </div>
                <div class="m0 p0 border-top" v-bind:class="{ 'bg-darken-1': index % 2 == 0 }" v-for="(value, key) in $store.state">
                    <div class="clearfix">
                        <div class="left black">
                            <p class="btn block h5">
                                {{ key }}
                            </p>
                        </div>
                        <div class="right">
                            <a class="btn h6 muted not-clickabble">
                                {{
                                    parse(value)
                                }}
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
<script>
module.exports = {
    components: {
        chevronRight: require('../lib/icons/chevron-right.vue')
    },
    data: function() {
        return {
            storageKeys: []
        }
    },
    computed: {
        storage: function() {
            return this.$store.getters.storage;
        }
    },
    methods: {
        parse: function(value) {
            if (value === null) return 'null'
            switch (typeof value) {
                case 'boolean':
                return 'boolean: ' + (value === true ? 'true' : 'false')
                break;
                case 'string':
                return 'string: ' + (value ? value : 'null')
                break;
                case 'number':
                return 'number: ' + (value ? value : 'null')
                break;
                case 'object':
                return 'object: ' + (value ? Object.keys(value).length : 'null')
                break;
                default:
                return typeof value;
                break;
            }
        },
        getKeys: function() {
            var self = this
            this.storage.keys().then(function(keys) {
                self.storageKeys = keys
            })
        },
        removeKey: function(key) {
            var self = this
            this.storage.removeItem(key)
            .then(function() {
                self.getKeys()
            })
        }
    },
    mounted: function() {
        this.getKeys();
        this.$store.dispatch('hideSpinner')
        this.$store.dispatch('setTitle', 'Bugzilla');
    },
    beforeDestroy: function() {
        window.location = '/'
    }
}
</script>
