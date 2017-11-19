var lunr = require('lunr'),
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
        var tmp;
        var years = {};
        terms.forEach(function(term) {
            state.termsList[term.code] = term.name;
            state.termDates[term.code] = term.date;
            tmp = '20' + helper.pad((term.code % 2000).toString().slice(0, -1), 2, 0);
            if (typeof years[tmp] === 'undefined') {
                years[tmp] = null;
            }
        })
        state.numOfYears = Object.keys(years).length;
    },
    saveMajorMinor: function(state, payload) {
        var mm = payload.mm;
        state.majorMinor = mm;
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
        state.historicData = payload.historicData;
    },
    saveHistoricFrequency: function(state, frequency) {
        state.historicFrequency = frequency;
    },
    buildIndexedSearch: function(state, termId) {
        console.log(termId + ': building index on the fly')

        var obj, _obj = {};
        state.search[termId] = lunr(function() {
            this.field('c', { boost: 5 })
            this.field('n');
            this.field('f');
            this.field('la');
            this.field('d');
            this.ref('b');

            for (var courseNum in state.flatCourses[termId]) {
                obj = JSON.parse(JSON.stringify(state.flatCourses[termId][courseNum]));

                _obj.b = obj.num;
                _obj.c = obj.c.split(/(\d+)/).map(function(el) { return el.replace(/\s+/g, ''); }).join(' ')
                _obj.n = obj.n;
                _obj.f = obj.ins.f;
                _obj.la = obj.ins.l;
                _obj.d = obj.ins.d[0];
                this.add(_obj);
                obj = {};
                _obj = {};
            }
        })
    },
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
    blockCheckVersion: function(state) {
        state.blockCheckVersion = true;
    },
    shouldAddMargin: function(state, to) {
        state.shouldAddMargin = (to || false);
    },
    saveAcademicPlanner: function(state, table) {
        state.academicPlanner = table;
    },
    changeOnlineState: function(state, status) {
        state.onlineState = status;
    },
    saveFinalSchedule: function(state, payload) {
        state.finalSchedule = payload.finalSchedule;
    },
    flipFinalSchedule: function(state) {
        state.showFinal = !state.showFinal;
    },
    saveEventSnapshot: function(state, events) {
        state.eventSnapshot = events;
    },
    incRMPEmptyCounter: function(state) {
        state.rmpEmptyCounter++
    },
    saveMobileDetect: function(state, md) {
        state.MobileDetect = md;
    },
    inflight: function(state, isInflight) {
        state.inflight = (isInflight === true)
    },
    saveSocket: function(state, socket) {
        state.socket = socket
    },
    changePushReady: function(state, readyState) {
        state.pushReady = readyState
    },
    pushChanges: function(state, delta) {
        state.pushChanges.unshift(delta)
    },
    saveUnsubscribeRealtimeFn: function(state, fn) {
        state.unsubscribeRealtimeFn = fn
    }
}
