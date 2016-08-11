var elasticlunr = require('elasticlunr')

module.exports = {
    setTitle: function(state, title) {
        state.title = title;
    },
    setTermName: function(state, name) {
        state.termName = name;
    },
    saveTermsList: function(state, terms) {
        state.flatTermsList = terms;
        terms.forEach(function(term) {
            state.termsList[term.code] = term.name;
        })
    },
    saveTermCourses: function(state, termId, courses, skipSaving) {
        if (typeof state.flatCourses[termId] === 'undefined') {
            state.flatCourses[termId] = {};
        }
        var obj;
        Object.keys(courses).forEach(function(subject) {
            courses[subject].forEach(function(course) {
                if (!skipSaving) {
                    obj = course;
                    obj.c = [subject, course.c].join(' ');
                    state.flatCourses[termId][course.num] = obj;
                }else{
                    state.flatCourses[termId][course.num] = course;
                }
            })
        })
    },
    saveInstructorNameToTidMapping: function(state, mapping) {
        state.instructorNameToTidMapping = mapping;
    },
    saveInstructorStats: function(state, stats) {
        if (Object.keys(state.instructorStats).length > 5) {
            state.instructorStats = {};
        }
        state.instructorStats[stats.tid] = stats;
    },
    saveCourseInfo: function(state, termId, courses, skipSaving) {
        state.courseInfo[termId] = courses;
    },
    buildIndexedSearch: function(state, termId, json, workaround, skipSaving) {
        workaround = workaround || false;
        if (workaround) {
            /*

            Apparently, according to http://stackoverflow.com/questions/29552139/website-repeatedly-reloads-then-crashes-on-iphone-4-ios-8-0-2-ios-8-1-2
            iOS crashes on loading the index JSON from lunr.js. However, building the index on the fly does not crash browser
            Thus, the workaround for iOS devices is to build the index from scratch

            */
            var obj;
            state.search[termId] = elasticlunr(function() {
                this.addField('c');
                this.addField('n');
                this.addField('lo');
                this.addField('f');
                this.addField('la');
                this.addField('d');
                this.setRef('b');
                this.saveDocument(false);
            });
            for (var courseNumber in state.flatCourses[termId]) {
                obj = state.flatCourses[termId][courseNumber];
                obj.b = courseNumber;
                state.search[termId].addDoc(obj);
                obj = {};
            }
        }else{
            state.search[termId] = elasticlunr.Index.load(json);
        }
    },
    pushToEventSource: function(state, termId, obj) {
        if (typeof state.events[termId] === 'undefined') state.events[termId] = [];
        state.events[termId].push(obj);
    },
    restoreEventSourceSnapshot: function(state, termId, events) {
        state.events[termId] = events;
    },
    removeFromSource: function(state, termId, courseNumber) {
        if (typeof state.events[termId] === 'undefined') return;
        state.events[termId] = state.events[termId].filter(function(event) {
            return event.number != courseNumber;
        })
        if (state.events[termId].length === 0) {
            delete state.events[termId];
        }
    },
    removeEmptySection: function(state, termId, courseNumber) {
        if (typeof state.events[termId] === 'undefined') return;
        state.events[termId] = state.events[termId].filter(function(event) {
            if (event.number !== courseNumber)
                return true;
            if (event.number == courseNumber && typeof(event._number) !== 'undefined')
                return false;
        })
        if (state.events[termId].length === 0) {
            delete state.events[termId];
        }
    }
}
