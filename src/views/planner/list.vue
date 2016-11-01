<template>
    <div>
        <div class="bg-white rounded mb2" v-for="(subjectCourses, subject) in courses" v-if="ready">
            <div class="m0 p1">
                <div class="clearfix">
                    <span class="btn black h4">{{ subject }}</span>
                </div>
                <div class="clearfix">
                    <span class="ml1 btn black h5 muted not-clickable">{{ subjectList[subject] }}</span>
                </div>
            </div>
            <div class="m0 p1 border-top">
                <div class="clearfix">
                    <div class="overflow-scroll">
                        <table class="table-light overflow-hidden bg-white border rounded h5">
                            <thead class="bg-darken-1">
                                <tr>
                                    <th> </th>
                                    <th>Title</th>
                                    <th>Instructor</th>
                                    <th>Time and Location</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr class="clickable" @click="promptAddClass(course)" v-for="course in subjectCourses">
                                    <td class="nowrap">
                                        {{ course.c }} - {{ course.s }}
                                    </td>
                                    <td class="nowrap">
                                        {{ course.n }}
                                    </td>
                                    <td class="nowrap">
                                        {{ course.ins.d.join(', ') }}
                                    </td>
                                    <td class="nowrap">
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
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
<script>
var helper = require('../../lib/vuex/helper')
module.exports = {
    data: function() {
        return {
            ready: false,
            courses: {},
            helper: helper
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
        })
    }
}
</script>
