<template>
    <div>
        <transition name="fade" mode="out-in">
            <div class="overflow-hidden bg-white rounded mb2" v-show="!initialized">
                <div class="m0 p1">
                    <div class="clearfix">
                        Loading...
                    </div>
                </div>
            </div>
        </transition>
        <transition name="fade" mode="out-in">
            <div class="bar-mask" @click="flip" v-show="ready && show && initialized">
            </div>
        </transition>
        <div id="top-bar" class="rounded fixed top-0" v-bind:class="{ 'bg-white': show, 'bg-black-transparent': !show }" v-if="ready">
            <transition-group name="list-complete" appear>
                <div class="m0 p0 rounded" key="title">
                    <div class="clearfix">
                        <div class="left rounded">
                            <div class="inline-block m1 p1 h6 bold clickable btn-outline" @click="flip" v-bind:class="{ 'white': !show, 'black': show }"><i class="fa fa-filter fa-lg">&nbsp;</i>Filter...</div>
                        </div>
                        <div class="right rounded">
                            <div v-show="!show" class="inline-block m1 p1 h6 white bold clickable btn-outline" v-bind:style="{ backgroundColor: colorMap.searchAnything }" v-on:click.prevent.stop="showSearchModal"><i class="fa fa-search fa-lg">&nbsp;</i>search anything</div>
                            <router-link v-show="!show" class="inline-block m1 p1 h6 white bold clickable btn-outline" v-bind:style="{ backgroundColor: colorMap.alert }" :to="{ name: 'term', params: { termId: termId } }" tag="div"><i class="fa fa-calendar fa-lg"></i></router-link>
                            <div @click="flip" v-show="show" class="inline-block m1 p1 h6 black bold clickable btn-outline" v-bind:style="{ backgroundColor: colorMap.blank }"><i class="fa fa-arrow-up fa-lg"></i></div>
                        </div>
                    </div>
                </div>
                <div class="m0 p1 h5" v-show="show" key="selects">
                    <div class="clearfix">
                        <span class="sm-col sm-col-4">
                            <select multiple v-bind:id="IDs.subject" class="m1" style="width: 100%">
                                <option :value="code" v-for="(name, code) in subjectList" v-if="typeof courses[code] !== 'undefined'">({{ code }}) {{ name }}</option>
                            </select>
                        </span>
                        <span class="sm-col sm-col-2">
                            <select multiple v-bind:id="IDs.ge" class="m1" style="width: 100%">
                                <option :value="code" v-for="(desc, code) in listOfGE">({{ code }}) {{ desc }}</option>
                            </select>
                        </span>
                        <span class="sm-col sm-col-2">
                            <select multiple v-bind:id="IDs.unit" class="m1" style="width: 100%">
                                <option :value="cr" v-for="cr in credits">{{ cr }}</option>
                            </select>
                        </span>
                        <span class="sm-col sm-col-2">
                            <select multiple v-bind:id="IDs.timeblock" class="m1" style="width: 100%">
                                <option :value="timeblock" v-for="timeblock in timeblocks">{{ timeblock }}</option>
                            </select>
                        </span>
                        <span class="sm-col sm-col-2">
                           <select multiple v-bind:id="IDs.location" class="m1" style="width: 100%">
                               <option :value="location" v-for="location in locations">{{ location }}</option>
                           </select>
                       </span>
                    </div>
                </div>
            </transition-group>
        </div>
        <search :show="searchModal" v-on:close="closeSearchModal" :callback="promptAddClass" :selected-term-id="termId" :do-not-modify-class="true"></search>
        <div class="bg-white rounded border mb3" v-for="(subjectCourses, subject) in courses" track-by="subject" v-show="initialized && hideSubject[subject] !== true">
            <div class="m0 p1">
                <div class="clearfix">
                    <span class="btn black h4" @click="collapseSubject[subject] = !collapseSubject[subject]">{{ subject }}</span>
                </div>
                <div class="clearfix">
                    <span class="ml1 btn black h5 muted clickable" @click="collapseSubject[subject] = !collapseSubject[subject]">{{ subjectList[subject] }}&nbsp;&nbsp;&nbsp;<i class="right fa fa-lg" v-bind:class="{ 'fa-angle-down': collapseSubject[subject], 'fa-angle-up': !collapseSubject[subject]}"></i></span>
                </div>
            </div>
            <transition name="fade" mode="out-in">
                <div class="m0 p0 border-top" v-show="!collapseSubject[subject]">
                    <div class="italic h5 clearfix" v-bind:class="{ 'bg-darken-1': md.phone() }">
                        <div class="underline p1 sm-col sm-col-2 nowrap">
                            Class
                        </div>
                        <div class="underline p1 sm-col sm-col-3 nowrap bold">
                            (Units) Title
                        </div>
                        <div class="underline p1 sm-col sm-col-2 nowrap">
                            Instructor(s)
                        </div>
                        <div class="underline p1 sm-col sm-col-5 nowrap bold">
                            Time and Location
                        </div>
                    </div>
                    <div class="h5 clearfix border clickable" @click="promptAddClass(course)" v-for="course in subjectCourses" track-by="course.num" v-show="hideCourses[course.num] !== true">
                        <div class="p1 sm-col sm-col-2 overflow-hidden nowrap">
                            {{ course.c }} - {{ course.s }}
                        </div>
                        <div class="p1 sm-col sm-col-3 overflow-hidden nowrap bold">
                            ({{ courseInfo[termId][course.num].cr }}) {{ course.n }}
                        </div>
                        <div class="p1 sm-col sm-col-2 overflow-hidden nowrap">
                            {{ course.ins.d.join(', ') }}
                        </div>
                        <div class="p1 sm-col sm-col-5 overflow-hidden nowrap bold">
                            {{
                                course.loct.map(function(el) {
                                    if (el.t === false) {
                                        return 'Cancelled';
                                    }else if (el.t === null) {
                                         return 'TBA';
                                    }else{
                                        return [el.t.day.length === 0 ? 'Tentative' : el.t.day.map(long2short).join(', '), helper.tConvert(el.t.time.start) == 'Tentative' ? 'Tentative' : helper.tConvert(el.t.time.start) + '-' + helper.tConvert(el.t.time.end), el.loc === null ? 'TBA' : el.loc].join(' / ')
                                    }
                                }).join(', ')
                            }}
                        </div>
                    </div>
                </div>
            </transition>
        </div>
    </div>
</template>
<script>
var debounce = require('lodash.debounce')
var helper = require('../../lib/vuex/helper')
var MobileDetect = require('mobile-detect')
module.exports = {
    data: function() {
        return {
            md: null,
            searchModal: false,
            ready: false,
            show: true,
            initialized: false,
            courses: {},
            locations: [],
            timeblocks: [],
            credits: [],
            helper: helper,
            fixedToTop: false,
            filter: {
                subject: [],
                ge: [],
                unit: [],
                location: [],
                timeblock: []
            },
            collapseSubject: {},
            hideSubject: {},
            hideCourses: {},
            IDs: {
                subject: '',
                ge: '',
                unit: '',
                location: '',
                timeblock: '',
            },
            listOfGE: {}
        }
    },
    computed: {
        alert: function() {
            return this.$store.getters.alert;
        },
        termId: function() {
            return this.$store.getters.termId;
        },
        dateMap: function() {
            return this.$store.getters.dateMap;
        },
        colorMap: function () {
            return this.$store.getters.colorMap;
        },
        subjectList: function() {
            return this.$store.getters.subjectList;
        },
        courseInfo: function() {
            return this.$store.getters.courseInfo;
        }
    },
    methods: {
        showSearchModal: function() {
            this.$store.dispatch('blockScroll', true);
            this.searchModal = true;
            setTimeout(function() {
                document.getElementsByClassName('search-box')[0].focus();
            }, 75);
        },
        closeSearchModal: function() {
            if (!this.show) this.$store.dispatch('blockScroll', false);
            this.searchModal = false;
        },
        makeid: function() {
            var text = "";
            var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

            for( var i=0; i < 5; i++ )
                text += possible.charAt(Math.floor(Math.random() * possible.length));

            return text;
        }, // http://stackoverflow.com/questions/1349404/generate-random-string-characters-in-javascript
        long2short: function(el) {
            if (el == 'Monday') return 'M';
            if (el == 'Tuesday') return 'Tu';
            if (el == 'Wednesday') return 'W';
            if (el == 'Thursday') return 'Th';
            if (el == 'Friday') return 'F';
            if (el == 'Saturday') return 'Sa';
            if (el == 'Sunday') return 'Su';
        },
        promptAddClass: function(course) {
            var self = this;
            if (!this.initialized) return;
            var termId = this.termId;
            var code = helper.checkForConflict(this.dateMap, this.$store.getters.eventSource[termId], course);
            var alertHandle = function() {};

            return this.$store.dispatch('getCourseDom', {
                termId: termId,
                courseObj: course,
                isSection: false
            }).then(function(html) {
                if (code !== false || code === null) {
                    alertHandle = function() {
                        return self.alert
                        .okBtn(code === null ? 'Taking the same class twice?' : 'Conflict with ' + code)
                        .alert(html)
                    }
                }else{
                    alertHandle = function() {
                        return self.alert
                        .okBtn('Add to Planner')
                        .cancelBtn("Go Back")
                        .confirm(html)
                        .then(function(resolved) {
                            resolved.event.preventDefault();
                            if (resolved.buttonClicked !== 'ok') return;

                            return self.$store.dispatch('pushToEventSource', {
                                termId: termId,
                                courseObj: course
                            }).then(function() {
                                self.alert.success(course.c + ' added to the planner!');
                            })
                        });
                    }
                }
                return alertHandle()
            })
        },
        getCredits: function() {
            var courseInfo = this.courseInfo[this.termId];
            return Object.keys(courseInfo).map(function(courseNum) {
                return courseInfo[courseNum].cr;
            }).filter(function(value, index, self) {
                return self.indexOf(value) === index;
            }).sort(helper.naturalSorter)
        },
        getTimeblocks: function() {
            var flatCourses = this.$store.getters.flatCourses[this.termId];
            return Object.keys(flatCourses).map(function(courseNum) {
                return flatCourses[courseNum].loct.map(function(loct) {
                    if (loct.t === false) {
                        return 'Cancelled'
                    }else if (loct.t === null) {
                        return 'TBA'
                    }else{
                        return helper.tConvert(loct.t.time.start)
                    }
                })
            }).reduce(function(a, b) {
                return a.concat(b);
            }).filter(function(value, index, self) {
                return self.indexOf(value) === index;
            }).sort(function(a, b) {
                return moment((a == 'TBA' || a == 'Cancelled' || a == 'Tentative') ? '12:00AM' : a, ['h:ma', 'H:m']) - moment((b == 'TBA' || b == 'Cancelled' || b == 'Tentative') ? '12:00AM' : b, ['h:ma', 'H:m'])
            });
        },
        getLocations: function() {
            var flatCourses = this.$store.getters.flatCourses[this.termId];
            return Object.keys(flatCourses).map(function(courseNum) {
                return flatCourses[courseNum].loct.map(function(loct) {
                    if (loct.t === false) {
                        return 'Cancelled'
                    }else if (loct.loc === null) {
                        return 'TBA'
                    }else {
                        return loct.loc
                    }
                })
            }).reduce(function(a, b) {
                return a.concat(b);
            }).filter(function(value, index, self) {
                return self.indexOf(value) === index;
            }).sort(helper.naturalSorter);
        },
        doFilter: function() {
            var self = this;
            var courseInfo = self.courseInfo[self.termId];
            for (var subject in this.courses) {
                if (this.filter.subject.length === 0 || this.filter.subject.indexOf(subject) !== -1) {
                    self.hideSubject[subject] = false;
                }else{
                    self.hideSubject[subject] = true;
                }
            }
            for (var subject in this.courses) {
                this.courses[subject].forEach(function(course) {
                    if (
                        (self.filter.ge.length === 0 || helper.intersect(courseInfo[course.num].ge, self.filter.ge).length > 0) &&
                        (self.filter.unit.length === 0 || self.filter.unit.indexOf(courseInfo[course.num].cr) !== -1) &&
                        (self.filter.timeblock.length === 0 || course.loct.filter(function(loct) {
                            return self.filter.timeblock.indexOf((loct.t === false ? 'Cancelled' : loct.t === null ? 'TBA' : helper.tConvert(loct.t.time.start))) !== -1
                        }).length > 0) &&
                        (self.filter.location.length === 0 || course.loct.filter(function(loct) {
                            return self.filter.location.indexOf((loct.t === false ? 'Cancelled' : loct.loc === null ? 'TBA' : loct.loc)) !== -1
                        }).length > 0)
                    ) {
                        self.hideCourses[course.num] = false
                    }else{
                        self.hideCourses[course.num] = true
                    }
                })
            }
            for (var subject in this.courses) {
                if (this.courses[subject].reduce(function(total, course) {
                    return self.hideCourses[course.num] === true ? total : total + 1;
                }, 0) === 0) {
                    self.hideSubject[subject] = true;
                }
            }
            self.autoUncollapse();
            self.alert.success('Class list updated!')
            if (self.$store.getters.Tracker !== null) {
                self.$store.getters.Tracker.trackSiteSearch(this.filter.subject.join(',') + ';'
                + this.filter.ge.join(',') + ';'
                + this.filter.unit.join(',') + ';'
                + this.filter.timeblock.join(',') + ';'
                + this.filter.location.join(',') + ';', 'list')
            }
        },
        autoUncollapse: function() {
            var counter = {};
            var self = this;
            for (var subject in this.courses) {
                counter[subject] = Object.keys(this.courses).reduce(function(total, subject) {
                    return self.hideSubject[subject] === true ? total : total + 1;
                }, 0)
                if (counter[subject] === 1) {
                    self.collapseSubject[subject] = false;
                }else{
                    self.collapseSubject[subject] = true;
                }
            }
        },
        initSelect2: function() {
            var self = this;
            Object.keys(this.IDs).forEach(function(id) {
                self.IDs[id] = self.makeid();
            })
            this.$nextTick(function() {
                Object.keys(self.IDs).forEach(function(id) {
                    $('#' + self.IDs[id]).select2({
                        placeholder: id + '...',
                        closeOnSelect: false,
                        templateSelection: function(d) {
                            return d.id;
                        }
                    }).on('select2:select', function(evt) {
                        self.filter[id].push(evt.params.data.element.value);
                    }).on('select2:unselect', function(evt) {
                        self.filter[id] = self.filter[id].filter(function(el) {
                            return el != evt.params.data.element.value;
                        })
                    });
                })
                setTimeout(function() {
                    self.$store.commit('shouldAddMargin', true);
                    self.initialized = true;
                    self.show = false;
                    self.alert.delay(5000).success('Click on a subject to expand')
                }, 500)
            })
        },
        initReactive: function() {
            var self = this;
            for (var subject in self.courses) {
                self.$set(self.collapseSubject, subject, true);
                self.$set(self.hideSubject, subject, false);
            }
            for (var subject in this.courses) {
                this.courses[subject].forEach(function(course) {
                    self.$set(self.hideCourses, course.num, false);
                })
            }
        },
        flip: function() {
            var self = this;
            Object.keys(this.IDs).forEach(function(id) {
                $('#' + self.IDs[id]).select2('close')
            })
            this.show = !this.show;
            this.$nextTick(function() {
                if (this.show === false) this.$store.dispatch('blockScroll', false);
                else this.$store.dispatch('blockScroll', true);

                if (this.show === false) this.doFilter();
            })
        }
    },
    created: function() {
        this.md = new MobileDetect(window.navigator.userAgent);
    },
    mounted: function() {
        this.$store.dispatch('setTitle', 'All Classes');
        var self = this;
        Bluebird.all([
            this.$store.dispatch('fetchGE'),
            self.$store.dispatch('fetchTermCourses')
        ])
        .spread(function(ge) {
            self.courses = self.$store.getters.sortedCourses[self.termId];
            self.initReactive();
            //cself.doFilter();
            self.listOfGE = ge;
            self.timeblocks = self.getTimeblocks();
            self.locations = self.getLocations();
            self.credits = self.getCredits();
            $script.ready('select2', function() {
                self.ready = true;
                self.$nextTick(function() {
                    self.initSelect2();
                })
            })
        })
    }
}
</script>

<style>
.bar-mask {
    position: fixed;
    z-index: 9;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: table;
    transition: opacity .3s ease;
}
.select2-selection--multiple {
    margin: 0.1rem;
}
.select2-selection--multiple input[type="search"] {
    height: 1rem;
}
.select2-results, .select2-selection__choice {
    font-size: .75rem; /* h6 */
}
</style>
