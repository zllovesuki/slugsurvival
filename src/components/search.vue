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
            <span slot="footer">
                <a class="btn h6 blue" v-on:click.prevent.stop="showGE">
                    GE
                </a>
                <a class="btn h6 green" v-on:click.prevent.stop="extraModal = true" v-if="showExtra">
                    add my own schedule
                </a>
            </span>
        </modal>
        <modal :show.sync="extraModal" :do-not-modify-class="true">
            <h4 slot="header">
                Add Your Own Schedule
            </h4>
            <span slot="body">
                <form v-on:submit.prevent="parseAndAddExtra" class="h5">
                    <label for="title" class="mt1 block">
                        <input type="text" class="col-12 field inline-block" v-model="extra.title" placeholder="title">
                    </label>
                    <label for="description" class="mt1 block">
                        <input type="text" class="col-12 field inline-block" v-model="extra.description" placeholder="description">
                    </label>
                    <label for="location" class="mt1 block">
                        <input type="text" class="col-12 field inline-block" v-model="extra.location" placeholder="location">
                    </label>
                    <label for="time" class="mt1 block">
                        <input type="text" class="col-4 field inline-block" v-model="extra.time.start" placeholder="8:00" @focusout="autoFormat('start')">
                        &nbsp; - &nbsp;
                        <input type="text" class="col-4 field inline-block" v-model="extra.time.end" placeholder="13:00" @focusout="autoFormat('end')">
                    </label>
                    <label for="repeat" class="mt1 block">
                        <a class="btn btn-primary h6 mr1" v-bind:class="{ 'bg-green': !extra.repeat.M, 'bg-red': extra.repeat.M }" @click="extra.repeat.M = !extra.repeat.M">
                            M
                        </a>
                        <a class="btn btn-primary h6 mr1" v-bind:class="{ 'bg-green': !extra.repeat.Tu, 'bg-red': extra.repeat.Tu }" @click="extra.repeat.Tu = !extra.repeat.Tu">
                            Tu
                        </a>
                        <a class="btn btn-primary h6 mr1" v-bind:class="{ 'bg-green': !extra.repeat.W, 'bg-red': extra.repeat.W }" @click="extra.repeat.W = !extra.repeat.W">
                            W
                        </a>
                        <a class="btn btn-primary h6 mr1" v-bind:class="{ 'bg-green': !extra.repeat.Th, 'bg-red': extra.repeat.Th }" @click="extra.repeat.Th = !extra.repeat.Th">
                            Th
                        </a>
                        <a class="btn btn-primary h6 mr1" v-bind:class="{ 'bg-green': !extra.repeat.F, 'bg-red': extra.repeat.F }" @click="extra.repeat.F = !extra.repeat.F">
                            F
                        </a>
                    </label>
                    <hr class="mt2 mb1" />
					<span class="block mb1 muted">
                        SlugSurvival allows you to add your own schedule to the planner, so you can plan your courses around other obligations.
                    </span>
					<button type="submit" class="btn btn-outline white" v-bind:style="{ backgroundColor: colorMap.regular }" :disabled="!extraValid">Add</button>
				</form>
            </span>
        </modal>
        <modal :show.sync="GEModal" :do-not-modify-class="true">
            <h4 slot="header">
                How do I search by GE?
            </h4>
            <span slot="body">
                <ul class="list-reset">
                    <p>
                        Just add a plus sign(+) followed by the code, like this:
                    </p>
                    <p>
                        <input type="text" class="field block col-10" disabled value="+CC">
                    </p>
                    <p>
                        <input type="text" class="field block col-10" disabled value="CLTE +C2">
                    </p>
                    <p>
                        Let's give you a reminder of what GEs do we have...
                    </p>
                    <li class="overflow-hidden btn h5 block" v-on:click.prevent.stop="" v-for="(code, desc) in listOfGE">
                        {{ code }} - {{ desc }}
                    </li>
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
        showExtra: {
            type: Boolean,
            default: false
        },
        selectedTermId: {
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
            },
            extraModal: false,
            GEModal: false,
            listOfGE: {},
            extra: {}
        }
    },
    computed: {
        extraValid: function() {
            return this.extra.title.length > 0
                && this.extra.description.length > 0
                && this.extra.location.length > 0
                && this.extra.time.start.length > 0
                && this.extra.time.end.length > 0
                && !(
                    this.extra.repeat.M === false
                    && this.extra.repeat.Tu === false
                    && this.extra.repeat.W === false
                    && this.extra.repeat.Th === false
                    && this.extra.repeat.F === false
                );
        }
    },
    watch: {
        'search.string': function(val, oldVal) {
            if (val.length < 1) return;
            var self = this;
            var geCode = '';
            var courseInfo = this.courseInfo[this.selectedTermId];
            var list = [];
            if (val.indexOf('+') !== -1) {
                geCode = val.substring(val.indexOf('+') + 1).substring(0, 4).trim().toUpperCase();
                val = val.substring(0, val.indexOf('+')).trim();;
                list = Object.keys(courseInfo).filter(function(key) {
                    return courseInfo[key].ge.indexOf(geCode) !== -1;
                })
                list = list.map(function(code) {
                    return parseInt(code);
                })
            }
            if (val.length === 0 && list.length > 0) {
                this.search.results = list.map(function(courseNum) {
                    return self.flatCourses[self.selectedTermId][courseNum];
                })
            }else{
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
                })
                if (list.length > 0) {
                    this.search.results = this.search.results.filter(function(course) {
                        return list.indexOf(course.num) !== -1;
                    })
                }
            }
        }
    },
    methods: {
        cb: function(param) {
            this.callback(param)
        },
        showGE: function() {
            var self = this;
            return this.fetchGE().then(function(ge) {
                self.listOfGE = ge;
                self.GEModal = true;
            })
        },
        resetExtra: function() {
            this.extra = {
                title: '',
                description: '',
                location: '',
                time: {
                    start: '',
                    end: ''
                },
                repeat: {
                    M: false,
                    Tu: false,
                    W: false,
                    Th: false,
                    F: false
                }
            };
        },
        parseAndAddExtra: function() {
            var termId = this.termId;
            var courseNum = this.findNextCourseNum(termId, 100000);
            var course = this.generateCourseObjectFromExtra(termId, courseNum, this.extra);
            var code = this.checkForConflict(course);
            if (code !== false) {
                return this.alert().error('Conflict with ' + code)
            }
            var courseInfo = this.generateCourseInfoObjectFromExtra(termId, courseNum, this.extra);
            this.populateLocalEntriesWithExtra(termId, courseNum, course, courseInfo);
            this.pushToEventSource(course, true);
            this.refreshCalendar();
            this.extraModal = false;
            this.resetExtra();
            this.alert().success('Schedule added to the planner!');
        },
        formatTime: function(string) {
            string = string.replace(/\s/g, '');
            if (string.length === 0) return '';
            var colin = string.indexOf(':');
            var hour, minute;
            if (colin === -1) {
                // it could be 7 - 8
                // or it could be 715 - 850; 1450 - 1540
                if (string.length < 3) {
                    hour = ('0' + string).slice(-2);
                    minute = '00';
                }else{
                    minute = string.slice(-2);
                    hour = ('0' + string.slice(0, -2)).slice(-2);
                }
            }else{
                hour = string.substring(0, colin);
                minute = string.substring(colin + 1);
                hour = ('0' + hour).slice(-2);
                minute = ('0' + minute).slice(-2);
            }

            if (minute > 59) {
                hour++;
                minute = '00';
            }
            if (hour > 23) hour = '00';
            if (hour < 0) hour = '00';
            if (minute < 0) minute = '00';

            return hour + ':' + minute;
        },
        autoFormat: function(type) {
            this.extra.time[type] = this.formatTime(this.extra.time[type]);
        }
    },
    created: function() {
        this.resetExtra();
    }
}
</script>
