<template>
    <div>
        <div class="overflow-hidden bg-white rounded mb2" v-show="!ready">
            <div class="m0 p1">
                <div class="clearfix">
                    Loading...
                </div>
            </div>
        </div>
        <div id="filter-bar-placeholder" class="overflow-hidden bg-white rounded mb2 border" v-show="ready">
            <div class="m0 p1">
				<div class="clearfix">
					<span class="btn black h4">Filter By: </span>
				</div>
			</div>
            <div class="m0 p2 border-top">
                <div class="clearfix">
                    <select class="inline-block col-4 field" v-model="filter.subject">
                        <option value="all">Subject...</option>
                        <option :value="code" v-for="(name, code) in subjectList">{{ name }}</option>
                    </select>
                    <select class="inline-block col-4 field" v-model="filter.location">
                        <option value="all">Location...</option>
                        <option :value="location" v-for="location in locations">{{ location }}</option>
                    </select>
                </div>
            </div>
        </div>
		<div id="filter-bar" class="overflow-hidden bg-white rounded mb2 border fixed top-0" v-show="fixedToTop">
			<div class="m0 p1">
				<div class="clearfix">
					<span class="btn black h4">Filter By: </span>
				</div>
			</div>
            <div class="m0 p2 border-top">
                <div class="clearfix">
                    <select class="inline-block col-4 field" v-model="filter.subject">
                        <option value="all">Subject...</option>
                        <option :value="code" v-for="(name, code) in subjectList">{{ name }}</option>
                    </select>
                    <select class="inline-block col-4 field" v-model="filter.location">
                        <option value="all">Location...</option>
                        <option :value="location" v-for="location in locations">{{ location }}</option>
                    </select>
                </div>
            </div>
        </div>
        <hr class="mb2" />
        <div class="bg-white rounded mb2" v-for="(subjectCourses, subject) in courses" track-by="subject" v-show="hideSubject[subject] !== true">
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
                <div class="h5 clearfix border clickable" @click="promptAddClass(course)" v-for="course in subjectCourses" track-by="course.num" v-show="hideCourses[course.num] !== true">
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
            helper: helper,
            fixedToTop: false,
            filter: {
                subject: 'all',
                location: 'all'
            },
            hideSubject: {},
            hideCourses: {}
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
    },
    methods: {
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
            for (var subject in this.courses) {
                if (this.filter.subject == 'all') {
                    self.hideSubject = {};
                }else{
                    if (subject != this.filter.subject) self.hideSubject[subject] = true
                    else self.hideSubject[subject] = false
                }
            }
            for (var subject in this.courses) {
                if (this.filter.location == 'all') {
                    self.hideCourses = {};
                }else{
                    this.courses[subject].map(function(course) {
                        if (course.loct.filter(function(loct) {
                            return (loct.t === false ? 'Cancelled' : loct.loc === null ? 'TBA' : loct.loc) == self.filter.location;
                        }).length === 0) {
                            self.hideCourses[course.num] = true
                        }else{
                            self.hideCourses[course.num] = false
                        }
                    })
                }
                if (this.courses[subject].reduce(function(total, course) {
                    return self.hideCourses[course.num] === true ? total : total + 1;
                }, 0) === 0) self.hideSubject[subject] = true
            }
        }
    },
    watch: {
        'filter.subject': function() {
            this.doFilter();
        },
        'filter.location': function() {
            this.doFilter();
        }
    },
    mounted: function() {
        this.$store.dispatch('setTitle', 'All Classes');
        var self = this;
        self.$store.dispatch('fetchTermCourses').then(function() {
            self.courses = self.$store.getters.sortedCourses[self.termId];
            self.doFilter();
            self.locations = self.getLocations();
            self.ready = true;
            $script.ready('bundle', function() {
                self.$nextTick(function() {
                    var elementPosition = $('#filter-bar-placeholder').offset();
                    $(window).scroll(debounce(function () {
                        if ($(window).scrollTop() > elementPosition.top) {
                            self.fixedToTop = true;
                        }else{
                            self.fixedToTop = false;
                        }
                    }, 50))
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
</style>
