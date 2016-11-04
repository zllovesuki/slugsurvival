var elasticlunr = require('elasticlunr'),
    helper = require('./helper.js');

module.exports = {
    setTracker: function(state, Tracker) {
        state.Tracker = Tracker;
    },
    setTitle: function(state, title) {
        state.title = title;
    },
    setTermName: function(state, name) {
        state.termName = name;
    },
    saveSubjects: function(state, payload) {
        var subjects = payload.subjects;
        state.flatSubjectList = subjects;
        subjects.forEach(function(subject) {
            state.subjectList[subject.code] = subject.name;
        })
    },
    saveTermsList: function(state, payload) {
        var terms = payload.termsList, skipSaving = payload.skipSaving
        state.flatTermsList = terms;
        terms.forEach(function(term) {
            state.termsList[term.code] = term.name;
            state.termDates[term.code] = term.date;
        })
    },
    saveTermCourses: function(state, payload) {
        var obj, termId = payload.termId, courses = payload.coursesData, skipSaving = payload.skipSaving;
        if (typeof state.flatCourses[termId] === 'undefined') {
            state.flatCourses[termId] = {};
        }
        if (typeof state.sortedCourses[termId] === 'undefined') {
            state.sortedCourses[termId] = {};
        }
        Object.keys(courses).sort().forEach(function(subject) {
            state.sortedCourses[termId][subject] = courses[subject];
            state.sortedCourses[termId][subject].sort(function(a, b) {
                if (!skipSaving) {
                    return helper.naturalSorter(a.c, b.c)
                }else{
                    return helper.naturalSorter(a.c.split(' ').filter(Boolean)[1], b.c.split(' ').filter(Boolean)[1])
                }
            });
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
    appendCourse: function(state, payload) {
        var termId = payload.termId, courseNum = payload.courseNum, course = payload.courseObj;
        state.flatCourses[termId][courseNum] = course;
    },
    saveInstructorNameToTidMapping: function(state, payload) {
        state.instructorNameToTidMapping = payload.rmp;
    },
    saveInstructorStats: function(state, stats) {
        if (Object.keys(state.instructorStats).length > 5) {
            state.instructorStats = {};
        }
        state.instructorStats[stats.tid] = stats;
    },
    saveCourseInfo: function(state, payload) {
        var termId = payload.termId, courses = payload.courseInfo;
        state.courseInfo[termId] = courses;
    },
    appendCourseInfo: function(state, payload) {
        var termId = payload.termId, courseNum = payload.courseNum, courseInfo = payload.courseInfo;
        state.courseInfo[termId][courseNum] = courseInfo;
    },
    saveHistoricData: function(state, payload) {
        state.historicData.spring = payload.spring;
        state.historicData.summer = payload.summer;
        state.historicData.fall = payload.fall;
        state.historicData.winter = payload.winter;
    },
    buildIndexedSearch: function(state, payload) {
        // termId, json, workaround, skipSaving
        var termId = payload.termId, json = payload.index, workaround = payload.workaround, skipSaving = payload.skipSaving;
        workaround = workaround || false;
        if (workaround) {
            console.log('building index on the fly')
            /*

            Apparently, according to http://stackoverflow.com/questions/29552139/website-repeatedly-reloads-then-crashes-on-iphone-4-ios-8-0-2-ios-8-1-2
            iOS crashes on loading the index JSON from lunr.js. However, building the index on the fly does not crash browser
            Thus, the workaround for iOS devices is to build the index from scratch

            */
            var obj, _obj = {};
            state.search[termId] = elasticlunr(function() {
                this.addField('c');
                this.addField('n');
                this.addField('f');
                this.addField('la');
                this.addField('d');
                this.setRef('b');
                this.saveDocument(false);
            });
            for (var courseNum in state.flatCourses[termId]) {
                obj = JSON.parse(JSON.stringify(state.flatCourses[termId][courseNum]));

                _obj.b = obj.num;
                _obj.c = obj.c;
                _obj.n = obj.n;
                _obj.f = obj.ins.f;
                _obj.la = obj.ins.l;
                _obj.d = obj.ins.d[0];
                state.search[termId].addDoc(_obj);
                obj = {};
                _obj = {};
            }
        }else{
            state.search[termId] = elasticlunr.Index.load(json);
        }
    },
    /*pushToEventSource: function(state, termId, obj) {
        if (typeof state.events[termId] === 'undefined') state.events[termId] = [];
        state.events[termId].push(obj);
    },*/
    mergeEventSource: function(state, payload) {
        var termId = payload.termId, events = payload.events, skipSaving = payload.skipSaving;
        if (typeof state.events[termId] === 'undefined') state.events[termId] = [];
        state.events[termId] = state.events[termId].concat(events);
    },
    restoreEventSourceSnapshot: function(state, payload) {
        var termId = payload.termId, events = payload.events;
        state.events[termId] = events;
    },
    emptyEventSource: function(state, termId) {
        delete state.events[termId];
    },
    grayOutEvents: function(state, termId) {
        if (typeof state.events[termId] === 'undefined') return;
        state.events[termId].map(function(el) {
            //if (typeof el.oldColor !== 'undefined') return;
            el.oldColor = el.color;
            el.color = state.colorMap.grayOut;
        })
    },
    restoreEventsColor: function(state, termId) {
        if (typeof state.events[termId] === 'undefined') return;
        state.events[termId].map(function(el) {
            //if (typeof el.oldColor === 'undefined') return;
            el.color = el.oldColor;
            delete el.oldColor;
        })
    },
    removeFromSource: function(state, payload) {
        var termId = payload.termId, courseNum = payload.courseNum, skipSaving = payload.skipSaving;
        if (typeof state.events[termId] === 'undefined') return;
        state.events[termId] = state.events[termId].filter(function(event) {
            return event.number != courseNum;
        })
        if (courseNum / 100000 >= 1 && skipSaving !== true) {
            // remove the traitor!
            delete state.flatCourses[termId][courseNum];
            delete state.courseInfo[termId][courseNum];
        }
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

        window.location.hash = '#' + LZString.compressToEncodedURIComponent(JSON.stringify(array));
    },
    blockCheckVersion: function(state) {
        state.blockCheckVersion = true;
    }
}
