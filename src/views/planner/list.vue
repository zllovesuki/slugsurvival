<template>
    <div>
        <div class="overflow-hidden bg-white rounded mb2" v-show="!ready">
            <div class="m0 p1">
                <div class="clearfix">
                    Loading...
                </div>
            </div>
        </div>
		<div id="filter-bar" class="bg-white rounded border fixed bottom-0" v-if="ready">
            <filterBy v-bind:ids="IDs" :courses="courses" :ge="listOfGE" :timeblocks="timeblocks" :locations="locations" :filter="filter"></filterBy>
        </div>
        <hr id="separator" class="mb2" />
        <div class="bg-white rounded mb2" v-for="(subjectCourses, subject) in courses" v-show="hideSubject[subject] !== true">
            <div class="m0 p1">
                <div class="clearfix">
                    <span class="btn black h4">{{ subject }}</span>
                </div>
                <div class="clearfix">
                    <span class="ml1 btn black h5 muted not-clickable">{{ subjectList[subject] }}</span>
                </div>
            </div>
            <div class="m0 p0 border-top">
                <div class="h5 clearfix bg-darken-2 bold">
                    <div class="p1 sm-col sm-col-2 nowrap">
                        &nbsp;
                    </div>
                    <div class="p1 sm-col sm-col-3 nowrap">
                        Title
                    </div>
                    <div class="p1 sm-col sm-col-2 nowrap">
                        Instructor(s)
                    </div>
                    <div class="p1 sm-col sm-col-5 nowrap">
                        Time and Location
                    </div>
                </div>
                <div class="h5 clearfix border clickable" @click="promptAddClass(course)" v-for="course in subjectCourses" track-by="course.num" v-show="hideGE[course.num] !== true && hideCourses[course.num] !== true && hideTimeblocks[course.num] !== true">
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
                                    return [el.t.day.map(long2short).join(', '), helper.tConvert(el.t.time.start) + '-' + helper.tConvert(el.t.time.end), el.loc === null ? 'TBA' : el.loc].join(' / ')
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
            hideCourses: {},
            hideTimeblocks: {},
            IDs: {
                subjectID: '',
                geID: '',
                timeblockID: '',
                locationID: ''
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
                        return helper.tConvert(loct.t.time.start) + '-' + helper.tConvert(loct.t.time.end)
                    }
                })
            }).reduce(function(a, b) {
                return a.concat(b);
            }).filter(function(value, index, self) {
                return self.indexOf(value) === index;
            }).sort(helper.naturalSorter);
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
                this.courses[subject].map(function(course) {
                    if (self.filter.ge != 'all' && self.filter.ge != '' && courseInfo[course.num].ge.indexOf(self.filter.ge) === -1) {
                        self.hideGE[course.num] = true
                    }else{
                        self.hideGE[course.num] = false
                    }
                    if (self.filter.timeblock != 'all' && self.filter.timeblock != '' && course.loct.filter(function(loct) {
                        return ( (loct.t === false ? 'Cancelled' : loct.t === null ? 'TBA' : helper.tConvert(loct.t.time.start) + '-' + helper.tConvert(loct.t.time.end)) == self.filter.timeblock);
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
            this.IDs.timeblockID = this.makeid();
            this.IDs.locationID = this.makeid();
            this.$nextTick(function() {
                $('#' + this.IDs.subjectID).select2({
                    placeholder: 'Subject...'
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
                    placeholder: 'GE...'
                }).on('change', function(evt) {
                    self.filter.ge = evt.target.value
                    self.doFilter()
                })
                $('#' + this.IDs.timeblockID).select2({
                    placeholder: 'Timeblock...'
                }).on('change', function(evt) {
                    self.filter.timeblock = evt.target.value
                    self.doFilter()
                })
                $('#' + this.IDs.locationID).select2({
                    placeholder: 'Location...'
                }).on('change', function(evt) {
                    self.filter.location = evt.target.value
                    self.doFilter()
                })
            })
        },
        initReactive: function() {
            var self = this;
            for (var subject in self.courses) {
                self.$set(self.hideSubject, subject, false);
            }
            for (var subject in this.courses) {
                this.courses[subject].map(function(course) {
                    self.$set(self.hideGE, course.num, false);
                    self.$set(self.hideCourses, course.num, false);
                    self.$set(self.hideTimeblocks, course.num, false);
                })
            }
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
            self.locations = self.getLocations();
            self.timeblocks = self.getTimeblocks();
            self.ready = true;
            $script.ready('select2', function() {
                self.$nextTick(function() {
                    self.initSelect2();
                })
            })
        })
    }
}
</script>

<style>
#filter-bar {
    width: 100%;
    max-width: 64em;
    z-index: 10;
}
.select2-selection--multiple input[type="search"] {
    height: 1rem;
}
</style>
