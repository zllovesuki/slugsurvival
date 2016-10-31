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
                        <table class="table-light overflow-hidden bg-white border rounded">
                            <thead class="bg-darken-1">
                                <tr>
                                    <th> </th>
                                    <th>Title</th>
                                    <th>Instructor</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="course in subjectCourses">
                                    <td>
                                        {{ course.c }} - {{ course.s }}
                                    </td>
                                    <td>
                                        {{ course.n }}
                                    </td>
                                    <td>
                                        {{ course.ins.d.join(', ') }}
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
            courses: {}
        }
    },
    computed: {
        termId: function() {
            return this.$store.getters.termId;
        },
        subjectList: function() {
            return this.$store.getters.subjectList;
        }
    },
    methods: {
        compileCourses: function() {
            var courses = {}, subject = '', sorted = {};
            var flatCourses = this.$store.getters.flatCourses[this.termId];
            for (var courseNum in flatCourses) {
                subject = flatCourses[courseNum].c.split(/(\d+)/).filter(Boolean)[0].trim();
                if (typeof courses[subject] === 'undefined') courses[subject] = [];
                if (courseNum / 100000 >= 1) continue;
                courses[subject].push(flatCourses[courseNum])
            }
            Object.keys(courses).sort().forEach(function(key) {
                sorted[key] = courses[key]
                sorted[key].sort(function(a, b) {
                    return helper.naturalSorter(a.c.split(/(\d+)/).filter(Boolean)[1], b.c.split(/(\d+)/).filter(Boolean)[1])
                });
            })
            return sorted;
        }
    },
    mounted: function() {
        this.$store.dispatch('setTitle', 'All Classes');
        var self = this;
        self.$store.dispatch('fetchTermCourses').then(function() {
            self.courses = self.compileCourses();
            self.ready = true;
        })
    }
}
</script>
