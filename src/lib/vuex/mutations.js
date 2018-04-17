"use strict"
var lunr = require('lunr'),
    helper = require('./helper');

module.exports = {
    setTracker: function(state, Tracker) {
        state.Tracker = Object.freeze(Tracker);
    },
    setTitle: function(state, title) {
        state.title = title;
    },
    setTermName: function(state, name) {
        state.termName = name;
    },
    saveSubjects: function(state, payload) {
        state.flatSubjectList = payload.subjects;
        payload.subjects.forEach(function(subject) {
            state.subjectList[subject.code] = subject.name;
        })
    },
    saveTermsList: function(state, payload) {
        state.flatTermsList = Object.freeze(payload.termsList);
        // sigh.... *JavaScript*
        state.latestTerms = Object.freeze(JSON.parse(JSON.stringify(payload.termsList)).sort(function(a, b) {
            if (a.code > b.code) return -1;
            else if (a.code < b.code) return 1;
            else return 0
        }).slice(0, 2).map(function(term) {
            return term.code
        }))
        var tmp;
        var years = {}, termsList = {}, termDates = {}
        payload.termsList.forEach(function(term) {
            termsList[term.code] = term.name;
            termDates[term.code] = term.date;
            tmp = '20' + helper.pad((term.code % 2000).toString().slice(0, -1), 2, 0);
            if (typeof years[tmp] === 'undefined') {
                years[tmp] = null;
            }
        })
        state.numOfYears = Object.keys(years).length;
        state.termsList = Object.freeze(termsList)
        state.termDates = Object.freeze(termDates)
    },
    saveMajorMinor: function(state, payload) {
        state.majorMinor = Object.freeze(payload.mm);
    },
    emptyTerm: function(state, termId) {
        if (state.latestTerms.indexOf(termId) !== -1) {
            console.log('gc: skipped one of the latest two terms - ' + termId)
            return
        }
        console.log('gc: removing ' + termId + ' from state')
        delete state.flatCourses[termId]
        delete state.sortedCourses[termId]
        delete state.search[termId]
        delete state.courseInfo[termId]
    },
    saveTermCourses: function(state, payload) {
        var obj, termId = payload.termId, skipSaving = payload.skipSaving;
        if (typeof state.flatCourses[termId] === 'undefined') {
            state.flatCourses[termId] = {};
        }
        if (typeof state.sortedCourses[termId] === 'undefined') {
            state.sortedCourses[termId] = {};
        }
        Object.keys(payload.coursesData).sort().forEach(function(subject) {
            state.sortedCourses[termId][subject] = Object.freeze(
                payload.coursesData[subject].sort(function(a, b) {
                    if (!skipSaving) {
                        return helper.naturalSorter(a.c, b.c)
                    }else{
                        return helper.naturalSorter(a.c.split(' ').filter(Boolean)[1], b.c.split(' ').filter(Boolean)[1])
                    }
                })
            )

            payload.coursesData[subject].forEach(function(course) {
                if (!skipSaving) {
                    obj = course;
                    obj.c = [subject, course.c].join(' ');
                    state.flatCourses[termId][course.num] = Object.freeze(obj)
                }else{
                    state.flatCourses[termId][course.num] = Object.freeze(course)
                }
            })
        })
    },
    appendCourse: function(state, payload) {
        var termId = payload.termId, courseNum = payload.courseNum;
        state.flatCourses[termId][courseNum] = Object.freeze(payload.courseObj);
    },
    saveInstructorNameToTidMapping: function(state, payload) {
        state.instructorNameToTidMapping = Object.freeze(payload.rmp);
    },
    saveInstructorStats: function(state, stats) {
        if (Object.keys(state.instructorStats).length > 5) {
            state.instructorStats = {};
        }
        state.instructorStats[stats.tid] = Object.freeze(stats);
    },
    saveCourseInfo: function(state, payload) {
        var termId = payload.termId;
        if (typeof state.courseInfo[termId] === 'undefined') state.courseInfo[termId] = {}
        for (var courseNum in payload.courseInfo) {
            state.courseInfo[termId][courseNum] = Object.freeze(payload.courseInfo[courseNum])
        }
    },
    appendCourseInfo: function(state, payload) {
        var termId = payload.termId, courseNum = payload.courseNum;
        state.courseInfo[termId][courseNum] = Object.freeze(payload.courseInfo);
    },
    saveHistoricData: function(state, payload) {
        state.historicData = Object.freeze(payload.historicData);
    },
    saveHistoricFrequency: function(state, frequency) {
        state.historicFrequency = Object.freeze(frequency);
    },
    buildIndexedSearch: function(state, termId) {
        console.log(termId + ': building index on the fly')

        var obj, _obj = {};
        state.search[termId] = Object.freeze(
            lunr(function() {
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
        )
    },
    mergeEventSource: function(state, payload) {
        var termId = payload.termId;
        if (typeof state.events[termId] === 'undefined') state.events[termId] = [];
        state.events[termId] = state.events[termId].concat(payload.events);
        // autosave.js
        if (payload.skipSaving === true) return;
        if (typeof state.events[termId] !== 'undefined') {
            return state.storage.setItem(termId, helper.compact(state.events[termId]));
        }
    },
    restoreEventSourceSnapshot: function(state, payload) {
        var termId = payload.termId;
        state.events[termId] = payload.events;
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
        // autosave.js
        if (skipSaving === true) return;
        if (typeof state.events[termId] !== 'undefined') {
            return state.storage.setItem(termId, helper.compact(state.events[termId]));
        }else{
            return state.storage.removeItem(termId);
        }
    },
    blockCheckVersion: function(state) {
        state.blockCheckVersion = true;
    },
    shouldAddMargin: function(state, to) {
        state.shouldAddMargin = (to || false);
    },
    saveAcademicPlanner: function(state, payload) {
        state.academicPlanner = payload;
        // autosave.js
        return Bluebird.reduce(Object.keys(payload.table), function(yearTotal, year) {
            return Bluebird.reduce(Object.keys(payload.table[year]), function(quarterTotal, quarter) {
                return payload.table[year][quarter].length > 0 ? quarterTotal + 1 : quarterTotal;
            }, 0)
            .then(function(qTotal) {
                return qTotal > 0 ? yearTotal + 1 : yearTotal;
            })
        }, 0)
        .then(function(total) {
            if (total > 0) {
                return state.storage.setItem('academicPlanner', {
                    plannerYear: payload.plannerYear,
                    table: payload.table
                })
            }else{
                return state.storage.removeItem('academicPlanner')
            }
        })
    },
    changeOnlineState: function(state, status) {
        state.onlineState = status;
    },
    saveFinalSchedule: function(state, payload) {
        state.finalSchedule = Object.freeze(payload.finalSchedule);
    },
    flipFinalSchedule: function(state) {
        state.showFinal = !state.showFinal;
    },
    saveEventSnapshot: function(state, events) {
        state.eventSnapshot = Object.freeze(events);
    },
    incRMPEmptyCounter: function(state) {
        state.rmpEmptyCounter++
    },
    incEnrollmentCheckCounter: function(state, courseNum) {
        if (typeof state.enrollmentCheckCounter[courseNum] === 'undefined') state.enrollmentCheckCounter[courseNum] = 0
        state.enrollmentCheckCounter[courseNum]++
    },
    saveMobileDetect: function(state, md) {
        state.MobileDetect = Object.freeze(md);
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
        if (state.pushChanges.length > 10) state.pushChanges.pop()
    },
    saveUnsubscribeRealtimeFn: function(state, fn) {
        state.unsubscribeRealtimeFn = fn
    }
}
