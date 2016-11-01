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
                    <select class="inline-block col-4 field">
                        <option value="all">Location...</option>
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
                    <select class="inline-block col-4 field">
                        <option value="all">Location...</option>
                    </select>
                </div>
            </div>
        </div>
        <hr class="mb2" />
        <div class="bg-white rounded mb2" v-for="(subjectCourses, subject) in courses" v-if="ready" v-show="filter.subject == 'all' || filter.subject == subject">
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
                <div class="h5 clearfix border clickable" @click="promptAddClass(course)" v-for="course in subjectCourses">
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
                                if (el.t === null) {
                                    return 'Cancelled';
                                }else if (el.t === false) {
                                    return 'TBA';
                                }else{
                                    return [el.t.day.map(long2short).join(', '), helper.tConvert(el.t.time.start) + '-' + helper.tConvert(el.t.time.end), el.loc].join(' / ')
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
            helper: helper,
            fixedToTop: false,
            filter: {
                subject: 'all'
            }
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
        }
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
        }
    },
    mounted: function() {
        this.$store.dispatch('setTitle', 'All Classes');
        var self = this;
        self.$store.dispatch('fetchTermCourses').then(function() {
            self.courses = self.$store.getters.sortedCourses[self.termId];
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
