var elasticlunr = require('elasticlunr'),
    helper = require('./helper.js');

module.exports = {
    setTitle: function(state, title) {
        state.title = title;
    },
    setTermName: function(state, name) {
        state.termName = name;
    },
    saveTermsList: function(state, terms, skipSaving) {
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
    saveInstructorNameToTidMapping: function(state, mapping, skipSaving) {
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
    saveHistoricData: function(state, spring, summer, fall, winter) {
        state.historicData.spring = spring;
        state.historicData.summer = summer;
        state.historicData.fall = fall;
        state.historicData.winter = winter;
    },
    buildIndexedSearch: function(state, termId, json, workaround, skipSaving) {
        workaround = workaround || false;
        if (workaround) {
            console.log('building index on the fly')
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
                obj = JSON.parse(JSON.stringify(state.flatCourses[termId][courseNumber]));
                obj.b = obj.num;
                obj.c = obj.c.split(/(\d+)/).filter(Boolean).map(function(el) { return el.trim(); }).join(" ");
                obj.n = obj.n.split(/(?=[A-Z])/).map(function(el) { return el.trim(); }).join(" ")
                state.search[termId].addDoc(obj);
                obj = {};
            }
        }else{
            state.search[termId] = elasticlunr.Index.load(json);
        }
    },
    /*pushToEventSource: function(state, termId, obj) {
        if (typeof state.events[termId] === 'undefined') state.events[termId] = [];
        state.events[termId].push(obj);
    },*/
    mergeEventSource: function(state, termId, events) {
        if (typeof state.events[termId] === 'undefined') state.events[termId] = [];
        state.events[termId] = state.events[termId].concat(events);
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
    },
    replaceHash: function(state, termId) {
        if (typeof state.events[termId] === 'undefined') {
            window.location.hash = '';
            return;
        }

        var array = helper.compact(state.events[termId]);

        window.location.hash = '#' + helper.Base64.encode(JSON.stringify(array));
    }
}
