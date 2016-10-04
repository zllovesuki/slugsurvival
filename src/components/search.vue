<template>
    <span>
        <modal :show.sync="show">
            <h4 slot="header">
                <input type="text" class="field block col-12 mb1 search-box" v-model="search.string" debounce="250" placeholder="ECON 197, Design, Mendes, etc...">
            </h4>
            <span slot="body">
                <ul class="list-reset">
                    <li class="overflow-hidden btn h5 block" v-on:click.prevent.stop="cb(result)" v-for="result in search.results" track-by="num">
                        {{ result.c }} - {{ result.s }}  - {{ result.n }}
                    </li>
                    <li v-show="search.string.length > 0 && search.results.length === 0">No results.</li>
                </ul>
            </span>
        </modal>
    </span>
</template>

<script>
var getters = require('../lib/vuex/getters.js')
var actions = require('../lib/vuex/actions.js')

module.exports = {
    vuex: {
        getters: getters,
        actions: actions
    },
    props: {
        show: {
            type: Boolean,
            required: true,
            twoWay: true
        },
        selectedTermId: {
            type: String,
            required: true
        },
        callback: {
            type: Function,
            required: true
        }
    },
    data: function() {
        return {
            search: {
                string: '',
                results: []
            }
        }
    },
    watch: {
        'search.string': function(val, oldVal) {
            if (val.length < 1) return;
            var self = this;
            var options = {
                fields: {
                    c: {
                        boost: 5
                    },
                    n: {
                        boost: 3
                    },
                    f: {
                        boost: 2
                    },
                    la: {
                        boost: 2
                    }
                }
            };
            val = val.split(/(\d+)/).filter(Boolean).map(function(el) { return el.trim(); }).join(" ");
            this.search.results = this.indexSearch[this.selectedTermId].search(val, options).map(function(result) {
                return self.flatCourses[self.selectedTermId][result.ref]
            });
        }
    },
    methods: {
        cb: function(param) {
            this.callback(param)
        }
    }
}
</script>
