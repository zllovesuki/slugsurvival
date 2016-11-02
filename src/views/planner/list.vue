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
        <div id="filter-bar" class="bg-white rounded fixed bottom-0" v-if="ready">
            <transition-group name="list-complete" appear>
                <div class="m0 p0" v-bind:class="{ 'bg-black': !show }" v-show="!show" key="title">
                    <div class="clearfix">
                        <span class="m1 btn white h5 left" @click="flip">Filter By: </span>
                        <router-link class="m1 p1 h6 black bold clickable right" v-bind:style="{ backgroundColor: colorMap.blank }" :to="{ name: 'term', params: { termId: termId } }" tag="div"><i class="fa fa-calendar fa-lg">&nbsp;</i>Calender View</router-link>
                    </div>
                </div>
                <div class="m0 p1 h5" v-show="show" key="selects">
                    <div class="clearfix">
                        <span class="inline-block col col-3">
                            <select multiple v-bind:id="IDs.subjectID" class="col col-12">
                                <option :value="code" v-for="(name, code) in subjectList" v-show="typeof courses[code] !== 'undefined'">({{ code }}) {{ name }}</option>
                            </select>
                        </span>
                        <span class="inline-block col col-3">
                            <select v-bind:id="IDs.geID" class="col col-12">
                                <option></option>
                                <option value="all">(All Classes)</option>
                                <option :value="code" v-for="(desc, code) in listOfGE">({{ code }}) {{ desc }}</option>
                            </select>
                        </span>
                        <span class="inline-block col col-3">
                            <select v-bind:id="IDs.timeblockID" class="col col-12">
                                <option></option>
                                <option value="all">(All Timeblocks)</option>
                                <option :value="timeblock" v-for="timeblock in timeblocks">{{ timeblock }}</option>
                            </select>
                        </span>
                        <span class="inline-block col col-3">
                           <select v-bind:id="IDs.locationID" class="col col-12">
                               <option></option>
                               <option value="all">(All Locations)</option>
                               <option :value="location" v-for="location in locations">{{ location }}</option>
                           </select>
                       </span>
                    </div>
                </div>
            </transition-group>
        </div>
        <div class="bg-white rounded border mb2" v-for="(subjectCourses, subject) in courses" track-by="subject" v-show="initialized && hideSubject[subject] !== true">
            <div class="m0 p1">
                <div class="clearfix">
                    <span class="btn black h4">{{ subject }}</span>
                </div>
                <div class="clearfix">
                    <span class="ml1 btn black h5 muted not-clickable">{{ subjectList[subject] }}</span>
                </div>
            </div>
            <div class="m0 p0 border-top">
                <div class="h5 clearfix bg-darken-1">
                    <div class="p1 sm-col sm-col-2 nowrap">
                        Class
                    </div>
                    <div class="p1 sm-col sm-col-3 nowrap bold">
                        Title
                    </div>
                    <div class="p1 sm-col sm-col-2 nowrap">
                        Instructor(s)
                    </div>
                    <div class="p1 sm-col sm-col-5 nowrap bold">
                        Time and Location
                    </div>
                </div>
                <div class="h5 clearfix border clickable" @click="promptAddClass(course)" v-for="course in subjectCourses" track-by="course.num" v-show="hideGE[course.num] !== true && hideTimeblocks[course.num] !== true && hideCourses[course.num] !== true">
                    <div class="p1 sm-col sm-col-2 overflow-hidden nowrap">
                        {{ course.c }} - {{ course.s }}
                    </div>
                    <div class="p1 sm-col sm-col-3 overflow-hidden nowrap bold">
                        {{ course.n }}
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
        </div>
    </div>
</template>
<script>
var debounce = require('lodash.debounce')
var helper = require('../../lib/vuex/helper')
module.exports = {
    data: function() {
        return {
            ready: false,
            show: true,
            initialized: false,
            courses: {},
            locations: [],
            timeblocks: [],
            helper: helper,
            fixedToTop: false,
            filter: {
                subject: [],
                ge: '',
                location: '',
                timeblock: ''
            },
            hideSubject: {},
            hideGE: {},
            hideTimeblocks: {},
            hideCourses: {},
            IDs: {
                subjectID: '',
                geID: '',
                locationID: '',
                timeblockID: '',
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
                    if (self.filter.ge != 'all' && self.filter.ge != '' && courseInfo[course.num].ge.indexOf(self.filter.ge) === -1) {
                        self.hideGE[course.num] = true
                    }else{
                        self.hideGE[course.num] = false
                    }
                    if (self.filter.timeblock != 'all' && self.filter.timeblock != '' && course.loct.filter(function(loct) {
                        return ( (loct.t === false ? 'Cancelled' : loct.t === null ? 'TBA' : helper.tConvert(loct.t.time.start)) == self.filter.timeblock);
                    }).length === 0) {
                        self.hideTimeblocks[course.num] = true
                    }else{
                        self.hideTimeblocks[course.num] = false
                    }
                    if (self.filter.location != 'all' && self.filter.location != '' && course.loct.filter(function(loct) {
                        return (loct.t === false ? 'Cancelled' : loct.loc === null ? 'TBA' : loct.loc) == self.filter.location;
                    }).length === 0) {
                        self.hideCourses[course.num] = true
                    }else{
                        self.hideCourses[course.num] = false
                    }
                })
            }
            for (var subject in this.courses) {
                if (this.courses[subject].reduce(function(total, course) {
                    return (self.hideGE[course.num] === true || self.hideTimeblocks[course.num] === true || self.hideCourses[course.num] === true) ? total : total + 1;
                }, 0) === 0) {
                    self.hideSubject[subject] = true;
                }
            }
        },
        initSelect2: function() {
            var self = this;
            this.IDs.subjectID = this.makeid();
            this.IDs.geID = this.makeid();
            this.IDs.locationID = this.makeid();
            this.IDs.timeblockID = this.makeid();
            this.$nextTick(function() {
                $('#' + this.IDs.subjectID).select2({
                    placeholder: 'Subject...',
                    closeOnSelect: false,
                    minimumResultsForSearch: Infinity,
                    templateSelection: function(d) {
                        return d.id;
                    }
                }).on('select2:select', function(evt) {
                    self.filter.subject.push(evt.params.data.element.value);
                    self.doFilter();
                }).on('select2:unselect', function(evt) {
                    self.filter.subject = self.filter.subject.filter(function(el) {
                        return el != evt.params.data.element.value;
                    })
                    self.doFilter();
                });
                $('#' + this.IDs.geID).select2({
                    placeholder: 'GE...',
                    minimumResultsForSearch: Infinity
                }).on('change', function(evt) {
                    self.filter.ge = evt.target.value
                    self.doFilter()
                })
                $('#' + this.IDs.locationID).select2({
                    placeholder: 'Location...',
                    minimumResultsForSearch: Infinity
                }).on('change', function(evt) {
                    self.filter.location = evt.target.value
                    self.doFilter()
                })
                $('#' + this.IDs.timeblockID).select2({
                    placeholder: 'Start time...',
                    minimumResultsForSearch: Infinity
                }).on('change', function(evt) {
                    self.filter.timeblock = evt.target.value
                    self.doFilter()
                })
                setTimeout(function() {
                    self.initialized = true;
                    self.show = false;
                }, 500)
            })
        },
        initReactive: function() {
            var self = this;
            for (var subject in self.courses) {
                self.$set(self.hideSubject, subject, false);
            }
            for (var subject in this.courses) {
                this.courses[subject].forEach(function(course) {
                    self.$set(self.hideGE, course.num, false);
                    self.$set(self.hideTimeblocks, course.num, false);
                    self.$set(self.hideCourses, course.num, false);
                })
            }
        },
        flip: function() {
            this.show = !this.show;
            $('#' + this.IDs.subjectID).select2('close')
            this.$store.dispatch('blockScroll')
        }
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
            self.doFilter();
            self.listOfGE = ge;
            self.timeblocks = self.getTimeblocks();
            self.locations = self.getLocations();
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
    background-color: rgba(0, 0, 0, .7);
    display: table;
    transition: opacity .3s ease;
}
#filter-bar {
    width: 100%;
    max-width: 64em;
    z-index: 10;
}
.select2-selection--multiple input[type="search"] {
    height: 1rem;
}
.select2-results, .select2-selection__choice {
    font-size: .75rem; /* h6 */
}
</style>
