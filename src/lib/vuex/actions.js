"use strict"
var helper = require('./helper'),
    config = require('../../../config'),
    compoundSubject = require('compound-subject');

var self = module.exports = {
    setTitle: function(_, title) {
        _.commit('setTitle', title)
    },
    comingSoon: function(_) {
        _.getters.alert.okBtn('OK').alert('Coming soon')
    },
    ensureDataLoaded: function(_) {
        return _.dispatch('fetchBasicData')
    },
    fetchThreeStatsByTid: function(_, tid) {
        if (typeof _.state.instructorStats[tid] !== 'undefined') {
            return Bluebird.resolve(_.state.instructorStats[tid]);
        }

        var sugar = function() {
            return Bluebird.all([
                fetch(config.dbURL + '/rmp/scores/' + tid + '.json'),
                fetch(config.dbURL + '/rmp/stats/' + tid + '.json')
            ]).then(function(results) {
                return Bluebird.map(results, function(result) {
                    if (result === null) return null
                    if (typeof result.json === 'undefined') return result
                    return result.json()
                })
            }).then(function(rmp) {
                return {
                    scores: rmp[0],
                    stats: rmp[1]
                }
            })
        }
        return sugar()
        .then(function(rmp) {
            var stats = {
                tid: tid,
                stats: {
                    //ratings: rmp.ratings,
                    scores: rmp.scores,
                    stats: rmp.stats
                }
            };
            _.commit('saveInstructorStats', stats);
            return stats;
        })
    },
    loadAutosave: function(_, payload) {
        var termId = payload.termId;
        var alert = (payload.alert === true);
        return _.getters.storage.getItem(termId).then(function(array) {
            if (array === null) return;
            return _.dispatch('parseFromCompact', {
                termId: termId,
                array: array
            }).then(function(object) {
                _.commit('restoreEventSourceSnapshot', {
                    termId: termId,
                    events: object.events
                });
                if (object.deferredRemoval.length > 0) {
                    object.deferredRemoval.forEach(function(courseNum) {
                        _.commit('removeFromSource', {
                            termId: termId,
                            courseNum: courseNum,
                            skipSaving: false
                        });
                    })
                    if (alert) _.getters.alert.delay(0).error('Class' + (object.deferredRemoval.length > 1 ? 'es' : '') + ' with course number ' + compoundSubject(object.deferredRemoval).delimitAll().make() + ' ' + (object.deferredRemoval.length > 1 ? 'are' : 'is') +  ' no longer offered.')
                    if (_.getters.Tracker !== null) {
                        _.getters.Tracker.trackEvent('loadAutosave', 'removed', object.deferredRemoval.length)
                    }
                }
                if (_.getters.Tracker !== null) {
                    _.getters.Tracker.trackEvent('loadAutosave', 'success', object.events.length)
                }
            })
        }.bind(this))
    },
    loadBasicDataFromLocal: function(_) {
        var online = [];
        var self = this;
        var loadOnlineTimestamp = function() {
            return Bluebird.all([
                fetch(config.dbURL + '/timestamp/terms.json'),
                fetch(config.dbURL + '/timestamp/rmp.json'),
                fetch(config.dbURL + '/timestamp/subjects.json'),
                fetch(config.dbURL + '/timestamp/major-minor.json')
            ]).then(function(results) {
                return Bluebird.map(results, function(result) {
                    if (result === null) return null
                    if (typeof result.json === 'undefined') return result
                    return result.json()
                })
            })
            .then(function(base) {
                return [
                    base[0],
                    base[1],
                    base[2],
                    base[3],
                    // reusing termsList timestamp for historic data and final
                    base[0],
                    base[0]
                ]
            })
        }
        var loadOfflineTimestamp = function() {
            return Bluebird.all([
                _.getters.storage.getItem('termsListTimestamp'),
                _.getters.storage.getItem('rmpTimestamp'),
                _.getters.storage.getItem('subjectsTimestamp'),
                _.getters.storage.getItem('mmTimestamp'),
                _.getters.storage.getItem('historicDataTimestamp'),
                _.getters.storage.getItem('finalScheduleTimestamp')
            ])
        }
        var loadFromStorage = function(invalid, online) {
            return Bluebird.all([
               !invalid.termsList ? _.getters.storage.getItem('lz-termsList') : null,
               !invalid.rmp ? _.getters.storage.getItem('lz-rmp') : null,
               !invalid.subjects ? _.getters.storage.getItem('lz-subjects') : null,
               !invalid.mm ? _.getters.storage.getItem('lz-majorMinor') : null,
               !invalid.historicData ? _.getters.storage.getItem('lz-historicData') : null,
               !invalid.finalSchedule ? _.getters.storage.getItem('lz-finalSchedule') : null
           ]).spread(function(termsList, rmp, subjects, mm, historicData, finalSchedule) {
                return _.dispatch('saveBasicData', {
                    termsList: termsList,
                    rmp: rmp,
                    subjects: subjects,
                    mm: mm,
                    historicData: historicData,
                    finalSchedule: finalSchedule,
                    timestamp: {
                        termsList: online[0],
                        rmp: online[1],
                        subjects: online[2],
                        mm: online[3],
                        historicData: online[4],
                        finalSchedule: online[5]
                    },
                    skipSaving: true
                })
            })
        }
        return loadOnlineTimestamp()
        .then(function(timestamp) {
            online = timestamp;
            console.log('base: fetched online timestamp')
        })
        .catch(function(e) {
            console.log('base: fail to fetch online timestamp, checking local copy');
        })
        .finally(function() {
            return loadOfflineTimestamp().then(function(offline) {
                var invalid = {
                    yes: false,
                    termsList: false,
                    rmp: false,
                    subjects: false,
                    mm: false,
                    historicData: false,
                    finalSchedule: false
                }
                if (online.length > 0) {
                    // loadOnlineTimestamp() success
                    if (online[0] !== offline[0]) {
                        invalid.yes = true;
                        invalid.termsList = true;
                        console.log('base: terms list timestamp differs');
                    }
                    if (online[1] !== offline[1]) {
                        invalid.yes = true;
                        invalid.rmp = true;
                        console.log('base: rmp mapping timestamp differs');
                    }
                    if (online[2] !== offline[2]) {
                        invalid.yes = true;
                        invalid.subjects = true;
                        console.log('base: subjects timestamp differs');
                    }
                    if (online[3] !== offline[3]) {
                        invalid.yes = true;
                        invalid.mm = true;
                        console.log('base: major minor timestamp differs');
                    }
                    if (online[4] !== offline[4]) {
                        invalid.yes = true;
                        invalid.historicData = true;
                        console.log('base: historic data timestamp differs');
                    }
                    if (online[5] !== offline[5]) {
                        invalid.yes = true;
                        invalid.finalSchedule = true;
                        console.log('base: final schedule timestamp differs');
                    }
                }else{
                    // possibly no connectivity
                    if (offline[0] === null
                        || offline[1] === null
                        || offline[2] === null
                        || offline[3] === null
                        || offline[4] === null
                        || offline[5] === null) {
                        // We don't have a local copy
                        console.log(('base: no local copies to fallback'));
                        invalid = {
                            yes: true,
                            termsList: true,
                            rmp: true,
                            subjects: true,
                            mm: true,
                            historicData: true,
                            finalSchedule: true
                        }
                        return Bluebird.reject({
                            invalid: invalid,
                            online: offline
                        })
                    }
                }

                if (invalid.yes) console.log('base: some or all local copies are outdated')
                else console.log('base: local copies valid')

                return loadFromStorage(invalid, online).then(function () {
                    return Bluebird.reject({
                        invalid: invalid,
                        online: online
                    });
                })
            })
        })
    },
    loadBasicDataFromOnline: function(_, payload) {
        var self = this, invalid = payload.invalid, online = payload.online;
        var sugar = function() {
            return new Bluebird(function(resolve, reject) {
                if (Object.keys(invalid).reduce(function(skip, key) {
                    if (invalid[key] === true) skip = false;
                    return skip;
                }, true)) return resolve({});

                Bluebird.all([
                    invalid.termsList ? fetch(config.dbURL + '/terms.json') : null,
                    invalid.rmp ? fetch(config.dbURL + '/rmp.json') : null,
                    invalid.subjects ? fetch(config.dbURL + '/subjects.json') : null,
                    invalid.mm ? fetch(config.dbURL + '/major-minor.json') : null,
                    invalid.historicData ? (function() {
                        return Bluebird.all([
                            fetch(config.dbURL + '/offered/spring.json'),
                            fetch(config.dbURL + '/offered/summer.json'),
                            fetch(config.dbURL + '/offered/fall.json'),
                            fetch(config.dbURL + '/offered/winter.json'),
                            fetch(config.dbURL + '/offered/ge_spring.json'),
                            fetch(config.dbURL + '/offered/ge_summer.json'),
                            fetch(config.dbURL + '/offered/ge_fall.json'),
                            fetch(config.dbURL + '/offered/ge_winter.json')
                        ]).then(function(results) {
                            return Bluebird.map(results, function(result) {
                                if (result === null) return null
                                if (typeof result.json === 'undefined') return result
                                return result.json()
                            })
                        }).then(function(hh) {
                            return {
                                spring: hh[0],
                                summer: hh[1],
                                fall: hh[2],
                                winter: hh[3],
                                ge: {
                                    spring: hh[4],
                                    summer: hh[5],
                                    fall: hh[6],
                                    winter: hh[7]
                                }
                            }
                        })
                    })() : null,
                    invalid.finalSchedule ? fetch(config.dbURL + '/final.json') : null
                ]).then(function(results) {
                    return Bluebird.map(results, function(result) {
                        if (result === null) return null
                        if (typeof result.json === 'undefined') return result
                        return result.json()
                    })
                }).then(resolve).catch(reject)
            });
        }
        return sugar()
        .spread(function(termsList, rmp, subjects, mm, historicData, finalSchedule) {
            return _.dispatch('saveBasicData', {
                termsList: termsList,
                rmp: rmp,
                subjects: subjects,
                mm: mm,
                historicData: historicData,
                finalSchedule: finalSchedule,
                timestamp: {
                    termsList: online[0],
                    rmp: online[1],
                    subjects: online[2],
                    mm: online[3],
                    historicData: online[4],
                    finalSchedule: online[5]
                },
                skipSaving: false
            })
        })
        .then(function() {
            return true;
        })
        .catch(function(e) {
            console.log('base: loadBasicDataFromOnline rejection')
            console.log(e);
            return false;
        })
    },
    saveBasicData: function(_, payload) {
        if (payload.termsList !== null) _.commit('saveTermsList', payload);
        if (payload.rmp !== null) _.commit('saveInstructorNameToTidMapping', payload);
        if (payload.subjects !== null) _.commit('saveSubjects', payload);
        if (payload.mm !== null) _.commit('saveMajorMinor', payload);
        if (payload.historicData !== null) _.commit('saveHistoricData', payload);
        if (payload.finalSchedule !== null) _.commit('saveFinalSchedule', payload);
    },
    fetchBasicData: function(_) {
        if (_.state.flatTermsList.length !== 0) {
            return Bluebird.resolve();
        }
        return _.dispatch('loadBasicDataFromLocal')
        .catch(function(result) {
            if (!result.invalid.yes) return true;
            return _.dispatch('loadBasicDataFromOnline', result)
        })
        .then(function(success) {
            if (success) return _.dispatch('buildHistoricFrequency')
            else _.getters.alert.error('Cannot load basic data!')
        })
    },
    loadCourseDataFromLocal: function(_, termId) {
        var online = [];
        var self = this;
        var loadOnlineTimestamp = function() {
            return Bluebird.all([
                fetch(config.dbURL + '/timestamp/terms/' + termId + '.json'),
                fetch(config.dbURL + '/timestamp/courses/' + termId + '.json')
            ]).then(function(results) {
                return Bluebird.map(results, function(result) {
                    if (result === null) return null
                    if (typeof result.json === 'undefined') return result
                    return result.json()
                })
            }).then(function(base) {
                return [
                    base[0],
                    base[1]
                ]
            })
        }
        var loadOfflineTimestamp = function() {
            return Bluebird.all([
                _.getters.storage.getItem('termCourseTimestamp-' + termId),
                _.getters.storage.getItem('termCourseInfoTimestamp-' + termId)
            ])
        }
        var loadFromStorage = function(invalid) {
            return Bluebird.all([
               !invalid.coursesData ? _.getters.storage.getItem('lz-termCourse-' + termId) : null,
               !invalid.courseInfo ? _.getters.storage.getItem('lz-termCourseInfo-' + termId) : null
           ]).spread(function(coursesData, courseInfo) {
                return _.dispatch('saveCourseData', {
                    termId: termId,
                    coursesData: coursesData,
                    courseInfo: courseInfo,
                    timestamp: {
                        term: online[0],
                        courses: online[1]
                    },
                    skipSaving: true
                })
            })
        }
        return loadOnlineTimestamp()
        .then(function(timestamp) {
            online = timestamp;
            console.log(termId + ': fetched online timestamp')
        })
        .catch(function(e) {
            console.log(termId + ': fail to fetch online timestamp, checking local copy');
        })
        .finally(function() {
            return loadOfflineTimestamp().then(function(offline) {
                var invalid = {
                    yes: false,
                    coursesData: false,
                    courseInfo: false
                }
                if (online.length > 0) {
                    // loadOnlineTimestamp() success
                    if (online[0] !== offline[0]) {
                        invalid.yes = true;
                        invalid.coursesData = true;
                        console.log(termId + ': courses data timestamp differs');
                    }
                    if (online[1] !== offline[1]) {
                        invalid.yes = true;
                        invalid.courseInfo = true;
                        console.log(termId + ': course info timestamp differs');
                    }
                }else{
                    // possibly no connectivity
                    if (offline[0] === null
                        || offline[1] === null) {
                        // We don't have a local copy
                        console.log((termId + ': no local copies to fallback'));
                        invalid = {
                            yes: true,
                            coursesData: true,
                            courseInfo: true
                        }
                        return Bluebird.reject({
                            invalid: invalid,
                            online: offline
                        })
                    }
                }

                if (invalid.yes) console.log(termId + ': some or all local copies are outdated')
                else console.log(termId + ': local copies valid')

                return loadFromStorage(invalid).then(function () {
                    return Bluebird.reject({
                        invalid: invalid,
                        online: online
                    });
                })
            })
        })
    },
    loadCourseDataFromOnline: function(_, payload) {
        var invalid = payload.invalid, online = payload.online, termId = payload.termId;
        var self = this;
        var sugar = function() {
            return new Bluebird(function(resolve, reject) {
                if (Object.keys(invalid).reduce(function(skip, key) {
                    if (invalid[key] === true) skip = false;
                    return skip;
                }, true)) return resolve({});

                Bluebird.all([
                    invalid.coursesData ? fetch(config.dbURL + '/terms/' + termId + '.json') : null,
                    invalid.courseInfo ? fetch(config.dbURL + '/courses/' + termId + '.json') : null
                ]).then(function(results) {
                    return Bluebird.map(results, function(result) {
                        if (result === null) return null
                        if (typeof result.json === 'undefined') return result
                        return result.json()
                    })
                }).then(function(base) {
                    return [
                        base[0],
                        base[1]
                    ]
                }).then(resolve).catch(reject)
            });
        }
        return sugar()
        .spread(function(coursesData, courseInfo) {
            return _.dispatch('saveCourseData', {
                termId: termId,
                coursesData: coursesData,
                courseInfo: courseInfo,
                timestamp: {
                    term: online[0],
                    courses: online[1]
                },
                skipSaving: false
            })
        })
        .then(function() {
            return true;
        })
        .catch(function(e) {
            console.log(termId + ': loadCourseDataFromOnline rejection')
            console.log(e);
            return false;
        })
    },
    saveCourseData: function(_, payload) {
        var termId = payload.termId, coursesData = payload.coursesData, courseInfo = payload.courseInfo, skipSaving = payload.skipSaving, index = payload.index;
        if (coursesData !== null) _.commit('saveTermCourses', payload);
        if (courseInfo !== null) _.commit('saveCourseInfo', payload);
        /*if (workaround || index !== null) _.commit('buildIndexedSearch', {
            termId: termId,
            index: index,
            workaround: workaround,
            skipSaving: skipSaving
        });*/
    },
    fetchTermCourses: function(_, termId) {
        termId =  termId || _.getters.termId;
        if (typeof _.state.flatCourses[termId] !== 'undefined') {
            return Bluebird.resolve();
        }
        return _.dispatch('loadCourseDataFromLocal', termId)
        .catch(function(result) {
            if (!result.invalid.yes) return true;
            return _.dispatch('loadCourseDataFromOnline', {
                invalid: result.invalid,
                online: result.online,
                termId: termId
            })
        })
        .then(function(success) {
            if (success) _.commit('buildIndexedSearch', termId)
            else _.getters.alert.error('Cannot load course data!')
        })
    },
    fetchThreeStatsByFirstLastName: function(_, payload) {
        var tid = _.state.instructorNameToTidMapping[payload.firstName + payload.lastName];
        if (typeof tid === 'undefined') {
            return Bluebird.resolve(null);
        }
        return _.dispatch('fetchThreeStatsByTid', tid);
    },
    getCalendarHash: function(_) {
        var termId = _.getters.termId;
        if (typeof _.state.events[termId] === 'undefined') {
            return '';
        }

        var array = helper.compact(_.state.events[termId]);

        return LZString.compressToEncodedURIComponent(JSON.stringify(array));
    },
    getPlannerHash: function(_) {
        if (!_.state.academicPlanner) return '';

        return LZString.compressToEncodedURIComponent(JSON.stringify({
           plannerYear: _.state.academicPlanner.plannerYear,
           table: _.state.academicPlanner.table
       }));
    },
    parseFromCompact: function(_, payload) {
        var object = {
            events: [],
            deferredRemoval: []
        };
        var index, split = [], courseNum, course, courseInfo, termId = payload.termId, array = payload.array;
        return Bluebird.mapSeries(array, function(obj) {
            obj = obj + '';
            index = obj.indexOf('-');
            if (index === -1) {
                split[0] = obj;
                delete split[1];
            }else{
                split[0] = obj.substring(0, index);
                split[1] = obj.substring(index + 1);
            }
            var p = function() {
                if (split[0] / 100000 >= 1) {
                    /*
                    we found a traitor!

                    be careful here, we don't want to override any localized course num,
                    so we are going to reassign course number for the customize events
                    */
                    courseNum = helper.findNextCourseNum(_.state.flatCourses[termId], 100000);
                    course = JSON.parse(split[1]);
                    // Remember to override the course number in the course subject
                    course.num = courseNum;
                    courseInfo = helper.generateCourseInfoObjectFromExtra(courseNum, {});
                    return _.dispatch('populateLocalEntriesWithExtra', {
                        termId: termId,
                        courseNum: courseNum,
                        courseObj: course,
                        courseInfo: courseInfo
                    })
                }else{
                    return Bluebird.resolve();
                }
            }

            return p().then(function() {
                if (typeof split[1] !== 'undefined' && split[0] / 100000 < 1) {
                    if (split[1] == 'null') split[1] = null;
                    return _.dispatch('getEventObjectsByCourse', {
                        termId: termId,
                        courseNum: split[0],
                        sectionNum: split[1]
                    }).then(function(eventObj) {
                        if (eventObj.length === 0) object.deferredRemoval.push(split[0]);
                        object.events = object.events.concat(eventObj);
                        return;
                    })
                }else{
                    return _.dispatch('getEventObjectsByCourse', {
                        termId: termId,
                        courseNum: split[0]
                    }).then(function(eventObj) {
                        if (eventObj.length === 0) object.deferredRemoval.push(split[0]);
                        object.events = object.events.concat(eventObj);
                        return;
                    })
                }
            })
        })
        .then(function() {
            return object;
        })
    },
    decodeHash: function(_) {
        var termId = _.getters.termId;
        try {
            console.log(termId + ': trying to restore events from hash')
            var hash = window.location.hash.substring(1);
            var string = LZString.decompressFromEncodedURIComponent(hash);
            if (string.length === 0) {
                string = helper.Base64.decode(hash);
            }
            var array = JSON.parse(string);
            if (typeof array.forEach !== 'undefined') {
                console.log(termId + ': valid hash found')
                var split;
                var course;

                return _.dispatch('parseFromCompact', {
                    termId: termId,
                    array: array
                }).then(function(object) {
                    _.commit('restoreEventSourceSnapshot', {
                        termId: termId,
                        events: object.events
                    });

                    // Even though it might contain deferredRemoval, since it is bookmark link, we will keep it this way

                    var html = '';
                    html += ['<p>', 'Looks like you are accessing the planner via a bookmark link! We have the planner for you!', '</p>'].join('');
                    html += ['<p>', 'However, you will <b>not</b> be able to make changes if you are viewing the planner via a bookmark link.', '</p>'].join('');

                    _.getters.alert
                    .okBtn('OK')
                    .alert(html);
                    return Bluebird.reject();
                })
            }else{
                console.log(termId + ': fallback to local copy (inner)')
                return Bluebird.resolve();
            }
        }catch(e) {
            console.log(e);
            console.log(termId + ': fallback to local copy (outer)')
            return Bluebird.resolve();
        }
    },
    refreshCalendar: function(_, cb) {
        var termId = _.getters.termId;
        var dateMap = _.state.dateMap;

        var calendarStart = '07:00', calendarEnd = '23:00';

        var startTime = new Date(), endTime = new Date(), minStart = Infinity, maxEnd = -Infinity;
        var split = null;
        var events = _.getters.eventSource[termId];

        if (typeof events === 'undefined') events = [];

        events.forEach(function(e) {
            split = e.start.split(' ');
            if (split && split[1]) startTime = new Date(moment(dateMap.Monday + ' ' + split[1]));
            else return;
            split = e.end.split(' ');
            if (split && split[1]) endTime = new Date(moment(dateMap.Monday + ' ' + split[1]));
            else return;

            if (endTime.getTime() <= startTime.getTime()) return;
            if (startTime.getTime() < minStart) minStart = startTime.getTime();
            if (endTime.getTime() > maxEnd) maxEnd = endTime.getTime();
        })

        if (minStart !== Infinity || maxEnd !== -Infinity) {
            calendarStart = (new Date(minStart).getMinutes()) > 0 ? new Date(minStart).getHours() + ':00' : new Date(minStart).getHours() + ':' + new Date(minStart).getMinutes()
            calendarEnd = (new Date(maxEnd).getMinutes()) > 0 ? (new Date(maxEnd).getHours() + 1) + ':00' : new Date(maxEnd).getHours() + ':' + new Date(maxEnd).getMinutes()
        }

        $('#calendar-' + termId).fullCalendar('option', {
            minTime: calendarStart,
            maxTime: calendarEnd
        })
        $('#calendar-' + termId).fullCalendar('refetchEvents')

        if (cb) cb();

        //$('.fc-day-grid').insertAfter($('.fc-time-grid'))
        //$('.fc-divider').insertAfter($('.fc-time-grid'))

    },
    returnEventSourceSnapshot: function(_) {
        var termId = this.termId;
        return _.state.events[termId]
    },
    emptyEventSource: function(_, termId) {
        _.commit('emptyEventSource', termId);
    },
    getEventObjectsByCourse: function(_, payload) {
        /*
            To be DRY, this function is unnecessarily huge
        */
        var dateMap = _.state.dateMap;
        var colorMap = _.state.colorMap;
        var events = [];
        var obj = {};
        var courseNum, course, courseInfo, sectionNumber, section, conflict, awaitSelection = false, multiple = false;
        var termId = payload.termId, secSeats = (typeof payload.secSeats === 'undefined' ? null : payload.secSeats);

        awaitSelection = (payload.awaitSelection === true);

        multiple = (payload.multiple === true);

        // if we don't have it, then you got nothing
        if (typeof _.getters.flatCourses[termId] === 'undefined') return events;

        // We are not sure that if input1 is a course object or course number
        if (typeof payload.courseNum !== 'undefined') {
            courseNum = payload.courseNum;
            course = _.state.flatCourses[termId][courseNum];
            courseInfo = _.state.courseInfo[termId][courseNum];
        }

        if (typeof payload.courseObj !== 'undefined') {
            course = payload.courseObj;
            courseNum = course.num;
            courseInfo = _.state.courseInfo[termId][courseNum];
        }

        if (typeof course === 'undefined') {
            return events;
        }

        var courseObj = function(course, startDay, endDay, t) {
            var obj = {};
            obj.title = [(typeof course.s === 'undefined' ? course.c : course.c + ' - ' + course.s), courseInfo.ty].join("\n");
            obj.number = course.num;
            obj.start = dateMap['Monday'];
            obj.end = dateMap['Saturday'];
            obj.course = course;
            obj.color = colorMap.course;
            obj.awaitSelection = awaitSelection;
            obj.conflict = helper.checkForConflict(dateMap, _.state.events[termId], course);
            obj.multiple = multiple;
            if (course.custom) obj.color = colorMap.custom;
            if (awaitSelection && multiple) {
                obj.color = colorMap.awaitSelection;
            }
            if (t === false) {
                // class is cancelled
                obj.color = 'black';
            }else if (t === null) {
                // class is indeed to be annouced
                obj.color = colorMap.TBA;
            }else{
                // Normal class
                obj.start = dateMap[startDay] + ' ' + t.time.start;
                obj.end = dateMap[endDay] + ' ' + t.time.end;
            }
            return obj;
        }

        // Process course
        for (var j = 0, locts = course.loct, length = locts.length; j < length; j++) {
            if (!!!locts[j].t) {
                events.push(courseObj(course, 'Monday', 'Saturday', course.loct[0].t))
            }else{
                for (var i = 0, days = locts[j].t.day, length1 = days.length; i < length1; i++) {
                    events.push(courseObj(course, days[i], days[i], locts[j].t))
                }
            }
        }

        section = _.getters.courseInfo[termId][courseNum].sec.length > 0;

        if (multiple || (section === false && awaitSelection !== true)) return events;

        // Now we process sections

        if (typeof payload.sectionNum !== 'undefined' && payload.sectionNum !== null) {
            sectionNumber = payload.sectionNum;
        }else if (payload.sectionNum === null && awaitSelection !== true) {
            sectionNumber = null;
        }

        var seat = null;

        var getSeatBySectionNum = function(seats, secNum) {
            return seats.filter(function(el) {
                return el.num == secNum;
            })[0];
        }
        if (!awaitSelection && !!!sectionNumber) {
            obj.title = ['Please Choose a Section', 'For ' + course.c].join("\n");
            obj.number = course.num;
            obj.sectionNum = null
            obj.color = colorMap.awaitSelection;
            obj.course = course;
            obj.section = false;
            obj.conflict = false;
            obj.awaitSelection = awaitSelection;
            obj.start = dateMap['Monday'];
            obj.end = dateMap['Saturday'];
            events.push(obj);
            obj = {};
            return events;
        }

        var secObj = function(course, section, conflict, awaitSelection, startDay, endDay, t) {
            var obj = {};
            obj.title = [course.c, 'Section ' + section.sec].join("\n")
            obj.number = course.num;
            obj.sectionNum = section.num;
            obj.color = colorMap.section;
            obj.course = course;
            obj.section = section;
            obj.conflict = conflict;
            obj.awaitSelection = awaitSelection;
            obj.start = dateMap['Monday'];
            obj.end = dateMap['Saturday'];
            if (awaitSelection) {
                obj.color = colorMap.awaitSelection;
            }
            if (secSeats && awaitSelection) {
                seat = getSeatBySectionNum(secSeats, section.num);
                //obj.title = [section.sec + ' - ' + seat.status, (seat.cap - seat.enrolled) + ' avail.'].join("\n")
                // As of Jan 11 2017. no sections has more than one loct, so this hard coding is safe for now
                obj.title = [!!!section.loct[0].loc ? 'TBA' : section.loct[0].loc, section.sec + ' - ' + seat.status].join("\n")
            }
            if (t === false) {
                // section is cancelled
                obj.color = 'black';
                obj.title = [course.c, 'Section ' + section.sec, 'Cancelled'].join("\n")
            }else if (t === null) {
                // section is indeed to be annouced
                obj.color = colorMap.TBA;
            }else{
                // Normal section
                obj.start = dateMap[startDay] + ' ' + t.time.start;
                obj.end = dateMap[endDay] + ' ' + t.time.end;
            }
            return obj;
        }

        for (var i = 0, sections = courseInfo.sec, length = sections.length; i < length; i++) {
            if (!awaitSelection && sectionNumber !== null && sections[i].num != sectionNumber) continue;
            if (!!!sections[i].loct[0].t) {
                events.push(secObj(course, sections[i], false, awaitSelection, 'Monday', 'Saturday', sections[i].loct[0].t, null))
            }else{
                for (var j = 0, days = sections[i].loct[0].t.day, length2 = days.length; j < length2; j++) {
                    conflict = helper.checkForConflict(dateMap, _.state.events[termId], sections[i]);
                    events.push(secObj(course, sections[i], conflict, awaitSelection, days[j], days[j], sections[i].loct[0].t, secSeats))
                }
            }
        }

        return events;
    },
    getCurrentAwaitSection: function(_, termId) {
        if (typeof _.state.events[termId] === 'undefined') return false;
        var events = _.state.events[termId];
        var currentAwait = events.filter(function(el) {
            return el.awaitSelection === true;
        })
        if (currentAwait.length === 0) return false;
        return currentAwait;
    },
    grayOutEvents: function(_, termId) {
        _.commit('grayOutEvents', termId);
    },
    restoreEventsColor: function(_, termId) {
        _.commit('restoreEventsColor', termId);
    },
    pushToEventSource: function(_, payload) {
        var termId = payload.termId, course = payload.courseObj, customEvent = payload.custom;

        var p = function() {
            if (customEvent === true) {
                _.dispatch('removeFromSource', {
                    termId: termId,
                    courseNum: course.num,
                    skipSaving: true
                });

                return _.dispatch('getEventObjectsByCourse', {
                    termId: termId,
                    courseObj: course,
                    awaitSelection: false,
                    secSeats: null
                })
            }else{
                _.dispatch('removeFromSource', {
                    termId: termId,
                    courseNum: course.num,
                    skipSaving: false
                });

                return _.dispatch('getEventObjectsByCourse', {
                    termId: termId,
                    courseObj: course,
                    sectionNum: null,
                    awaitSelection: false,
                    secSeats: null
                })
            }
        }

        return p().then(function(events) {
            _.commit('mergeEventSource', {
                termId: termId,
                events: events,
                skipSaving: false
            });

            return Bluebird.resolve();
        })

    },
    pushSectionToEventSource: function(_, payload) {
        var termId = payload.termId, courseNum = payload.courseNum, sectionNum = payload.sectionNum;
        var events = [];

        _.dispatch('removeFromSource', {
            termId: termId,
            courseNum: courseNum,
            skipSaving: false
        });

        return _.dispatch('getEventObjectsByCourse', {
            termId: termId,
            courseNum: courseNum,
            sectionNum: sectionNum,
            awaitSelection: false,
            secSeats: null
        }).then(function(events) {
            _.commit('mergeEventSource', {
                termId: termId,
                events: events,
                skipSaving: false
            });

            return Bluebird.resolve();
        })
    },
    pushMultipleToEventSource: function(_, payload) {
        var termId = payload.termId, multiple = payload.multiple, events = [];
        return Bluebird.mapSeries(multiple, function(course) {
            return _.dispatch('getEventObjectsByCourse', {
                termId: termId,
                courseNum: course.num,
                awaitSelection: true,
                multiple: true,
                secSeats: null
            }).then(function(eventObj) {
                events = events.concat(eventObj);
            })
        }).then(function() {
            _.commit('mergeEventSource', {
                termId: termId,
                events: events,
                skipSaving: true
            });

            return Bluebird.resolve();
        })
    },
    selectMultiple: function(_, payload) {
        var termId = payload.termId, courseNum = payload.courseNum;

        var events = _.getters.eventSource[termId].filter(function(evt) {
            return evt.multiple === true;
        })

        return Bluebird.mapSeries(events, function(evt) {
            return _.dispatch('removeFromSource', {
                termId: termId,
                courseNum: evt.number,
                skipSaving: false
            });
        }).then(function() {
            return _.dispatch('getEventObjectsByCourse', {
                termId: termId,
                courseNum: courseNum,
                awaitSelection: false,
                sectionNum: (_.getters.courseInfo[termId][courseNum].sec.length > 0 ? null : undefined),
                secSeats: null
            }).then(function(events) {
                _.commit('mergeEventSource', {
                    termId: termId,
                    events: events,
                    skipSaving: false
                });

                return Bluebird.resolve();
            })
        })
    },
    pushAwaitSectionsToEventSource: function(_, payload) {
        _.dispatch('showSpinner')
        var secSeats = null, termId = payload.termId, courseNum = payload.courseNum;

        return _.dispatch('fetchRealTimeEnrollment', {
            termCode: termId,
            courseNum: courseNum
        })
        .then(function(res) {
            if (res.ok && res.results[0] && res.results[0]) {
                secSeats = res.results[0].sections;
            }
            return _.dispatch('getEventObjectsByCourse', {
                termId: termId,
                courseNum: courseNum,
                sectionNum: null,
                awaitSelection: true,
                secSeats: secSeats
            }).then(function(events) {
                _.commit('mergeEventSource', {
                    termId: termId,
                    events: events,
                    skipSaving: true
                });

                _.dispatch('refreshCalendar');
                _.dispatch('hideSpinner')
                _.getters.alert.success('Now You Are Choosing Section For ' + _.state.flatCourses[termId][courseNum].c)
            })
        }.bind(this))
    },
    removeFromSource: function(_, payload) {
        _.commit('removeFromSource', payload);
    },
    _showInstructorRMP: function(_, string) {
        if (_.getters.inflight) return

        _.commit('inflight', true)

        _.dispatch('showSpinner')
        var split = string.split('+');
        var termId = split[0], courseNum = split[1];
        var course = _.getters.flatCourses[termId][courseNum]
        var html = '';
        var template = function(key, value) {
            return ['<p>', '<span class="muted h6">', key, ': </span><b class="h5">', value, '</b>', '</p>'].join('');
        }
        _.dispatch('fetchThreeStatsByFirstLastName', {
            firstName: course.ins.f,
            lastName: course.ins.l
        })
        .then(function(rmp) {
            if (rmp !== null) {
                var obj = rmp.stats.stats.quality;
                var max = Object.keys(obj).reduce(function(a, b){ return obj[a] > obj[b] ? a : b });
                html += template('Quality', course.ins.f + ' is ' + max)
                html += template('Clarity', rmp.stats.stats.clarity.toFixed(1))
                html += template('Difficulty', rmp.stats.stats.easy.toFixed(1))
                html += template('Overall', rmp.stats.stats.overall.toFixed(1))
                html += template('Based on', rmp.stats.scores.count + ' ratings')
                _.getters.alert
                .okBtn('See it for yourself')
                .cancelBtn('Go Back')
                .confirm(html)
                .then(function(resolved) {
                    resolved.event.preventDefault();
                    if (resolved.buttonClicked !== 'ok') {
                        if (_.getters.Tracker !== null) {
                            _.getters.Tracker.trackEvent('RateMyProfessors', 'back', rmp.tid)
                        }
                        return
                    }
                    window.open('http://www.ratemyprofessors.com/ShowRatings.jsp?tid=' + rmp.tid);
                    if (_.getters.Tracker !== null) {
                        _.getters.Tracker.trackEvent('RateMyProfessors', 'external', rmp.tid)
                    }
                })
                if (_.getters.Tracker !== null) {
                    _.getters.Tracker.trackEvent('RateMyProfessors', 'success',  rmp.tid)
                }
            }else{
                _.getters.alert
                .cancelBtn('Nevermind')
                .okBtn('Google It')
                .confirm(['<p>', 'Oops, it\'s not there! Sometimes RateMyProfessors has a different name for the professors.', '</p>', '<hr />', '<p>', 'How about you try Google?', '</p>'].join(' '))
                .then(function(resolved) {
                    resolved.event.preventDefault();
                    if (resolved.buttonClicked !== 'ok') return;
                    if (_.getters.Tracker !== null) {
                        _.getters.Tracker.trackEvent('RateMyProfessors', 'google', course.ins.d[0])
                    }
                    window.open('https://www.google.com/search?q=' + course.ins.d[0] + '+' + 'ucsc' + '+' + 'ratemyprofessors');
                })
                if (_.getters.Tracker !== null) {
                    _.getters.Tracker.trackEvent('RateMyProfessors', 'empty', course.ins.f + course.ins.l)
                }

                _.commit('incRMPEmptyCounter')

                if (typeof drift !== 'undefined' && _.getters.rmpEmptyCounter > 2) {
                    drift.api.showWelcomeMessage({
                        message: 'Problem with RateMyProfessors? Let me know!'
                    })
                }
            }
        }.bind(this))
        .catch(function(e) {
            console.log(e);
            _.getters.alert.error('Cannot fetch RMP stats!')
            if (_.getters.Tracker !== null) {
                _.getters.Tracker.trackEvent('RateMyProfessors', 'failed', course.ins.f + course.ins.l)
            }
        }.bind(this))
        .finally(function() {
            _.commit('inflight', false)
            _.dispatch('hideSpinner')
        }.bind(this))
    },
    noAwaitSection: function(_, termId) {
        if (typeof _.state.events[termId] === 'undefined') return true;
        return _.state.events[termId].filter(function(el){
            return el.awaitSelection === true;
        }).length === 0;
    },
    checkForMultiple: function(_, payload) {
        var termId = payload.termId, courseNum = payload.courseNum;
        var course = _.state.flatCourses[termId][courseNum];
        var validMultiple = ['Laboratory', 'Lecture']
        var results = Object.keys(_.getters.flatCourses[termId]).reduce(function(results, courseNum) {
            if (_.getters.flatCourses[termId][courseNum].c === course.c &&
            validMultiple.indexOf(_.getters.courseInfo[termId][courseNum].ty) !== -1) results.push(_.getters.flatCourses[termId][courseNum])
            return results;
        }, [])
        return results;
    },
    exportICS: function(_) {
        // TODO: add final to ICS as well
        var termId = _.getters.termId;
        var termDates = _.state.termDates[termId];
        var events = _.state.events[termId];

        if (typeof events === 'undefined') return;
        var cal = ics();

        var compact = helper.compact(events);
        var split = [], course, courseInfo;

        for (var i = 0, length = compact.length; i < length; i++) {
            split = compact[i].split('-');
            course = _.state.flatCourses[termId][split[0]];
            courseInfo = _.state.courseInfo[termId][split[0]];

            for (var j = 0, locts = course.loct, length1 = locts.length; j < length1; j++) {
                helper.addCal(cal, termDates, course, courseInfo.ty, locts[j]);
                if (!split[1]) continue;
                for (var k = 0, sec = courseInfo.sec, length2 = sec.length; k < length2; k++) {
                    if (sec[k].num != split[1]) continue;
                    for (var m = 0, secLocts = sec[k].loct, length3 = secLocts.length; m < length3; m++) {
                        helper.addCal(cal, termDates, course, 'Section', secLocts[m]);
                    }
                }
            }
        }

        _.dispatch('getEventObjectsFromFinal', {
            termId: termId,
            realDate: true
        }).then(function(events) {
            events.forEach(function(ev) {
                cal.addEvent(ev.course.c + ' - ' + 'Final', ev.course.n, ev.course.loct[0].loc, ev.start, ev.end)
            })

            cal.download('Schedule for ' + _.state.termName);
        })
    },
    fetchRealTimeEnrollment: function(_, payload) {
        return fetch(config.trackingURL + '/latestOne?termId=' + payload.termCode + '&courseNum=' + payload.courseNum)
        .then(function(res) {
            return res.json();
        })
        .catch(function(e) {
            return {ok: false}
        })
    },
    _showRealTimeEnrollment: function(_, string) {
        if (_.getters.inflight) return

        _.commit('inflight', true)

        _.dispatch('showSpinner')
        var getSeatBySectionNum = function(seats, secNum) {
            return seats.filter(function(el) {
                return el.num == secNum;
            })[0];
        }
        var split = string.split('+');
        var termCode = split[0], courseNum = split[1], sectionNum = split[2];
        var html = '';
        var template = function(key, value) {
            return ['<p>', '<span class="muted h6">', key, ': </span><b class="h5">', value, '</b>', '</p>'].join('');
        }
        return _.dispatch('fetchRealTimeEnrollment', {
            termCode: termCode,
            courseNum: courseNum
        })
        .then(function(res) {
            if (typeof _.state.termDates[_.getters.termId] !== 'undefined') {
                var start =_.state.termDates[_.getters.termId].start;
                var monitorStart = new Date(start);
                monitorStart.setDate(monitorStart.getDate() - helper.delta(_.getters.termId).enrollment);
            }
            if (res.ok && res.results[0] && res.results[0]) {
                var latest = res.results[0];
                var seat = latest;
                var isSection = (!!sectionNum && courseNum !== sectionNum);

                if (isSection) {
                    // checking section
                    seat = getSeatBySectionNum(seat.sections, sectionNum)
                }

                html += template('Status', seat.status);
                if (!isSection) html += template('Available', seat.avail);
                html += template('Enrolled', seat.enrolled);
                html += template('Capacity', seat.cap);
                html += '<hr />';
                if (isSection) {
                    html += template('Waitlisted', seat.wait);
                    html += template('Waitlist Cap.', seat.waitTotal);
                }else{
                    html += template('Waitlisted', seat.waitTotal);
                    html += template('Waitlist Cap.', seat.waitCap);
                }
                html += '<p><span class="muted h6">Last Changed: ' + new Date(latest.date * 1000).toLocaleString() + '</span></p>';

                _.getters.alert
                .okBtn('Cool')
                .alert(html)
                .then(function(resolved) {
                    resolved.event.preventDefault();
                })
                if (_.getters.Tracker !== null) {
                    _.getters.Tracker.trackEvent('realTimeEnrollment', 'success', termCode + '_' + courseNum)
                }

                _.commit('incEnrollmentCheckCounter', courseNum)

                if (_.getters.enrollmentCheckCounter[courseNum] > 2) {
                    _.getters.alert
                    .success('Did you know that you can see changes as they happen?', function(evt) {
                        evt.preventDefault()
                        // TODO: ugly hack
                        try {
                            if (_.getters.Tracker !== null) {
                                _.getters.Tracker.trackEvent('realTimeEnrollment', 'redirectToRealtime')
                            }
                        }catch (e) {}

                        window.App.$router.push({
                            name: 'analyticsRealtime'
                        })
                    })
                }

            }else if (res.message && res.message.indexOf('not tracked') !== -1) {
                if (typeof monitorStart === 'undefined') {
                    _.getters.alert.error('This term is not yet being tracked, please check again later.')
                }else{
                    _.getters.alert.error('This term is not yet being tracked, please check again after ' + moment(monitorStart).format('YYYY-MM-DD'))
                }
                if (_.getters.Tracker !== null) {
                    _.getters.Tracker.trackEvent('realTimeEnrollment', 'untracked', termCode + '_' + courseNum)
                }
            }else if (!res.ok) {
                _.getters.alert.error('Cannot fetch real time data!')
                if (_.getters.Tracker !== null) {
                    _.getters.Tracker.trackEvent('realTimeEnrollment', 'error', termCode + '_' + courseNum)
                }
            }
            if (res.results && res.results.length === 0) {
                if (typeof monitorStart === 'undefined') {
                    _.getters.alert.error('No data found.')
                }else{
                    _.getters.alert.error('No data found, please check again after ' + moment(monitorStart).format('YYYY-MM-DD'))
                }
                if (_.getters.Tracker !== null) {
                    _.getters.Tracker.trackEvent('realTimeEnrollment', 'empty', termCode + '_' + courseNum)
                }
            }
            _.commit('inflight', false)
            _.dispatch('hideSpinner')
        }.bind(this))
    },
    _showCoursePreReq: function(_, string) {
        var split = string.split('+');
        var termId = split[0], courseNum = split[1];
        var course = _.getters.flatCourses[termId][courseNum]
        var courseInfo = _.getters.courseInfo[termId][courseNum];
        var html = '';

        html += '<p class="h6 muted">Requirements for ' + course.c + '</p>';
        html += '<p>' + courseInfo.re + '</p>';

        _.getters.alert
        .okBtn('Got It')
        .alert(html)
        .then(function(resolved) {
            resolved.event.preventDefault();
        })
    },
    _showCourseDesc: function(_, string) {
        var split = string.split('+');
        var termId = split[0], courseNum = split[1];
        var course = _.getters.flatCourses[termId][courseNum]
        var courseInfo = _.getters.courseInfo[termId][courseNum];
        var html = '';

        html += '<p class="h6 muted">Description for ' + course.c + '</p>';
        html += '<p>' + courseInfo.desc + '</p>';

        _.getters.alert
        .okBtn('Got It')
        .alert(html)
        .then(function(resolved) {
            resolved.event.preventDefault();
        })
    },
    getCourseDom: function(_, payload) {
        var termId = payload.termId, course = payload.courseObj, isSection = payload.isSection, courseNum = payload.courseNum, showQuarterYear = payload.showQuarterYear;
        var courseInfo = courseNum ? _.getters.courseInfo[termId][courseNum] : _.getters.courseInfo[termId][course.num];
        isSection = isSection || false;
        showQuarterYear = showQuarterYear || false;
        if (!isSection && !course.custom) {
            var courseHasSections = _.getters.courseInfo[termId][course.num].sec.length > 0;
            var materialLink = helper.getMaterialsLink(termId, course);
        }
        var html = '';
        var template = function(key, value) {
            return ['<p>', '<span class="muted h6">', key, ': </span><b class="h5">', value, '</b>', '</p>'].join('');
        }

        return _.dispatch('getFinalTime', {
            termId: termId,
            course: course
        }).then(function(final) {

            if (showQuarterYear) {
                html += '<p class="h6"><b>' + helper.calculateTermName(termId) + '</b></p>'
            }

            if (course.custom) {
                html += template('Title', course.c);
                html += template('Desc', course.n);
            }

            if (isSection) {
                html += template('Section', 'DIS - ' + course.sec);
                html += template('TA', course.ins);
            }else if (course.custom !== true){
                html += template('Course Number', course.num + (courseInfo.re === null ? '' : '&nbsp;<sup class="muted clickable rainbow" onclick="window.App.$store.dispatch(\'_showCoursePreReq\', \'' + termId + '+' + course.num + '\')">Pre-Req</sup>') );
                html += template(course.c, (courseHasSections ? 'has sections': 'has NO sections') + (materialLink === false ? '' : '&nbsp;<sup class="muted clickable rainbow" onclick="window.open(\'' + materialLink  + '\')">Books</sup>'));
                html += template('Course Name', course.n + (courseInfo.desc === null ? '' : '&nbsp;<sup class="muted clickable rainbow" onclick="window.App.$store.dispatch(\'_showCourseDesc\', \'' + termId + '+' + course.num + '\')">Desc.</sup>'));

                var summer = helper.summerDecipher(course.l);

                if (summer !== null) {
                    html += template('Summer Info', summer)
                }

                html += template('Instructor(s)', course.ins.d.join(', ') + (!!!course.ins.f ? '' : '&nbsp;<sup class="muted clickable rainbow" onclick="window.App.$store.dispatch(\'_showInstructorRMP\', \'' + termId + '+' + course.num + '\')">RateMyProfessors</sup>') );
            }

            html += '<hr />';

            var loctTmpl = function(index) {
                html += template('Location', course.loct[index].t === false ? 'Cancelled' : !!!course.loct[index].loc ? 'TBA': course.loct[index].loc);
                html += template('Meeting Day', course.loct[index].t === false ? 'Cancelled' : course.loct[index].t === null ? 'TBA' : course.loct[index].t.day.length === 0 ? 'Tentative' : course.loct[index].t.day.join(', '));
                html += template('Meeting Time', course.loct[index].t === false ? 'Cancelled' : course.loct[index].t === null ? 'TBA' : helper.tConvert(course.loct[index].t.time.start) == 'Tentative' ? 'Tentative' : helper.tConvert(course.loct[index].t.time.start) + '-' + helper.tConvert(course.loct[index].t.time.end));
            }

            for (var j = 0, locts = course.loct, length1 = locts.length; j < length1; j++) {
                loctTmpl(j);
                if (j !== length1 - 1) html += '<hr />'
            }

            if (course.custom !== true) {
                html += '<hr />';
                if (!isSection && final.date) html += template('Final', final.date + '; ' + final.time)
                html += template('Is It Open', '<span class="muted clickable rainbow" onclick="window.App.$store.dispatch(\'_showRealTimeEnrollment\', \'' + termId + (courseNum ? '+' + courseNum : '') + '+' + course.num + '\')">Check Real Time</span>');
            }

            return html;
        })
    },
    updateWatch: function(_, payload) {
        var self = this, recipient = payload.recipient, code = payload.code, courses = payload.courses, termId = payload.termId;
        return fetch(config.notifyURL + '/updateCourses', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                recipient: recipient,
                code: parseInt(code),
                courses: courses.map(function(el) {
                    return parseInt(el.num)
                }),
                termId: parseInt(termId)
            })
        })
        .then(function(res) {
            return res.json()
            .catch(function(e) {
                return res.text();
            })
        })
        .then(function(res) {
            if (!res.ok) {
                return _.getters.alert.error(res.message);
            }
        })
        .catch(function(e) {
            console.log(e);
            _.getters.alert.error('An error has occurred.')
        })
    },
    populateLocalEntriesWithExtra: function(_, payload) {
        _.commit('appendCourse', payload);
        _.commit('appendCourseInfo', payload);
    },
    fetchGE: function(_) {
        return fetch(config.dbURL + '/ge.json')
        .then(function(res) {
            return res.json();
        })
    },
    calculateDropDeadline: function(_, termId) {
        if (typeof _.state.termDates[termId] === 'undefined') return null;
        var start = _.state.termDates[termId].start;
        var deadline = new Date(start);
        deadline.setDate(deadline.getDate() + _.state.daysTillDeadline);
        return deadline;
    },
    passDropDeadline: function(_, termId) {
        if (typeof _.state.termDates[termId] === 'undefined') return null;
        var start = _.state.termDates[termId].start;
        var today = new Date();
        var deadline = new Date(start);
        deadline.setDate(deadline.getDate() + _.state.daysTillDeadline);
        return deadline.getTime() < today.getTime();
    },
    compareVersion: function(_) {
        return new Bluebird(function(resolve) {
            fetch('/version')
            .then(function(res) {
                if (res.status != 200) return _.getters.version; // fake it until you make it
                return res.text()
            })
            .then(function(version) {
                if (_.getters.version != version) return resolve(false)
                else return resolve(true)
            })
            .catch(function(e) {
                // network error? give it a pass
                return resolve(true)
            })
        });
    },
    checkVersion: function(_) {
        return _.dispatch('compareVersion').then(function(isUpdated) {
            if (!isUpdated) {
                _.commit('blockCheckVersion')
                _.getters.alert.delay(0).success('A new version of SlugSurvival is available, please refresh this page.')
                if (_.getters.Tracker !== null) {
                    _.getters.Tracker.trackEvent('newVersion', 'notify')
                    window.onbeforeunload = function(event) {
                        _.getters.Tracker.trackEvent('newVersion', 'refresh')
                    }
                }
            }
            if (_.state.blockCheckVersion) return;
            setTimeout(function() {
                _.dispatch('checkVersion')
            }, 120 * 1000)
        })
    },
    blockScroll: function(_, value) {
        value = value || false;
        if (value === true) {
            document.body.className = 'modal-open';
        } else {
            document.body.className = '';
        }
    },
    buildHistoricFrequency: function(_) {
        _.commit('saveHistoricFrequency', helper.windowFrequency(_.getters.flatTermsList, _.getters.historicData, 4));
    },
    decodeHashPlanner: function(_) {
        try {
            console.log('trying to restore planner from hash')
            var hash = window.location.hash.substring(1);
            var string = LZString.decompressFromEncodedURIComponent(hash);
            var planner = JSON.parse(string);
            if (typeof planner.table !== 'undefined') {
                console.log('valid hash found')
                planner.skipSaving = true;
                _.commit('saveAcademicPlanner', planner)
                var html = '';
                html += ['<p>', 'Looks like you are accessing the planner via a bookmark link! We have the planner for you!', '</p>'].join('');
                html += ['<p>', 'However, you will <b>not</b> be able to make changes if you are viewing the planner via a bookmark link.', '</p>'].join('');

                _.getters.alert
                .okBtn('OK')
                .alert(html);
                return Bluebird.reject();
            }else{
                console.log('fallback to local copy (inner)')
                return Bluebird.resolve();
            }
        }catch(e) {
            console.log(e);
            console.log('fallback to local copy (outer)')
            return Bluebird.resolve();
        }
    },
    loadLocalAcademicPlanner: function(_) {
        return _.getters.storage.getItem('academicPlanner').then(function(object) {
            if (object !== null) {
                _.state.academicPlanner = object;
                return true;
            }else{
                return false;
            }
        })
    },
    addOnlineOfflineListener: function(_) {
        var changeStateToOnline = function() {
            _.commit('changeOnlineState', 'online')
        }
        var changeStateToOffline = function() {
            _.commit('changeOnlineState', 'offline')
        }
        if (window.addEventListener) {
            window.addEventListener("online", changeStateToOnline, false);
            window.addEventListener("offline", changeStateToOffline, false);
        }else{
            document.body.ononline = changeStateToOnline;
            document.body.onoffline = changeStateToOffline;
        }
    },
    importQuarterlyFromAcademic: function(_, payload) {
        var maps = {};
        // The following code is obviously the most ugly shits
        Object.keys(payload.table).forEach(function(year) {
            // term code looks like: 2168
            // 2 is the prefix for some reasons
            // 16 is the year
            // 8 is the quarter, see quarterToNum()
            // and Fall is ALWAYS the first one
            maps['2' + (parseInt(payload.plannerYear) + parseInt(year) - 1).toString().slice(-2) + helper.quarterToNum('fall')] = payload.table[year].fall;

            ['winter', 'spring', 'summer'].forEach(function(quarter) {
                maps['2' + (parseInt(payload.plannerYear) + parseInt(year)).toString().slice(-2) + helper.quarterToNum(quarter)] = payload.table[year][quarter.toLowerCase()];
            })
        })
        return Bluebird.map(Object.keys(maps), function(termId) {
            return _.dispatch('fetchTermCourses', termId)
        }, { concurrency: 2 })
        .then(function() {
            console.log('fetched')
            // the most inefficient code in the entire universe
            var newMaps = {};
            Object.keys(maps).forEach(function(termId) {
                newMaps[termId] = [];
                maps[termId].forEach(function(courseCode) {
                    Object.keys(_.getters.flatCourses[termId]).forEach(function(courseNum) {
                        if (_.getters.flatCourses[termId][courseNum].c == courseCode) {
                            newMaps[termId].push(courseNum)
                        }
                    })
                })
            })
            return newMaps;
        })
        .then(function(numMaps) {
            var events = {};
            return Bluebird.mapSeries(Object.keys(numMaps), function(termId) {
                events[termId] = [];
                return Bluebird.mapSeries(numMaps[termId], function(courseNum) {
                    return _.dispatch('getEventObjectsByCourse', {
                        termId: termId,
                        courseNum: courseNum,
                        sectionNum: null
                    }).then(function(eventObj) {
                        events[termId] = events[termId].concat(eventObj);
                        return;
                    })
                })
            })
            .then(function() {
                return events;
            })
        })
        .then(function(events) {
            return Bluebird.mapSeries(Object.keys(events), function(termId) {
                return _.dispatch('loadAutosave', {
                    termId: termId,
                    alert: false
                }).then(function() {
                    if (typeof _.getters.eventSource[termId] !== 'undefined') return;
                    return _.commit('mergeEventSource', {
                        termId: termId,
                        events: events[termId]
                    });
                })
            })
        })
    },
    showDisclaimer: function(_) {
        //return _.getters.storage.getItem('disclaimerShown').then(function(yes) {
        //    if (yes !== null) return;
            var html = [
                '<p>', '<i>', 'Disclaimer', '</i>', '</p>',
                '<small>', 'SlugSurvival is not affiliated with UCSC or any of its family of sites.', '</small>',
                '<hr>',
                '<small>', '*Neither* selecting courses *nor* signing up for notifications on SlugSurvival will enroll you into the courses in the AIS (my.ucsc.edu).', '</small>'
            ].join('')
            _.getters.alert.okBtn('Acknowledge').alert(html).then(function(resolved) {
                resolved.event.preventDefault();
                if (_.getters.Tracker !== null) {
                    _.getters.Tracker.trackEvent('disclaimer', 'shown')
                }
        //        return _.getters.storage.setItem('disclaimerShown', true)
            })
        //})
    },
    fetchAvailableTerms: function(_) {
        var self = this;
        return fetch(config.trackingURL + '/available').then(function(res) {
            return res.json();
        }).then(function(res) {
            if (res && res.ok && res.results) return res.results.map(function(termCode) {
                return {
                    code: termCode,
                    name: _.state.termsList[termCode]
                }
            });
        })
    },
    showSpinner: function(_) {
        $('.spinner').spin({ lines:  8, length: 4, width: 3, radius: 5, position: 'fixed', left: '24px', top: '24px' })
    },
    hideSpinner: function(_) {
        $('.spinner').spin(false);
    },
    getFinalTime: function(_, payload) {
        var termId = payload.termId, course = payload.course;
        return Bluebird.resolve().then(function() {
            if (!_.state.finalSchedule) return;
            if (!_.state.finalSchedule[termId]) return;

            // Edge cases, TODO require
            if (course.loct.length > 1) return;

            var loct = course.loct[0];
            // TBA/TBD
            if (!loct.t) return;

            var courseInfo = _.state.courseInfo[termId][course.num];
            if (!courseInfo) return;

            var hash = [loct.t.day.join('-'), loct.t.time.start].join('-');
            var search = _.state.finalSchedule[termId].filter(function(obj) {
                return obj.hash === hash && courseInfo.ty === 'Lecture';
            })
            if (search.length === 0 && courseInfo.ty === 'Lecture') {
                if (helper.intersect(loct.t.day, ['Monday', 'Wednesday', 'Friday']).length > 0) {
                    // Non standard 1
                    hash = 'Non-Standard 1';
                }else if (helper.intersect(loct.t.day, ['Tuesday', 'Thursday']).length > 0) {
                    // Non standard 2
                    hash = 'Non-Standard 2';
                }else{
                    hash = null;
                }
                search = _.state.finalSchedule[termId].filter(function(obj) {
                    return obj.hash === hash;
                })
                return search[0]
            }
            return search[0]
        }).then(function(actual) {
            if (typeof actual === 'undefined') return {};
            else return actual;
        })
    },
    getEventObjectsFromFinal: function(_, payload) {
        var termId = payload.termId;
        var realDate = (payload.realDate === true);
        var events = _.state.events[termId], dateMap = _.state.dateMap, colorMap = _.state.colorMap;
        if (typeof events === 'undefined') events = [];

        var day = null, start = null, end = null, obj = {}, course = {}, eventSource = [], split = [];
        var compact = helper.compact(events);
        return Bluebird.mapSeries(compact, function(string) {
            split = string.split('-');
            course = _.state.flatCourses[termId][split[0]];
            return _.dispatch('getFinalTime', {
                termId: termId,
                course: course
            }).then(function(final) {
                if (!final.date) return;
                split = final.date.split(',');

                if (realDate) {
                    day = helper.calculateTermName(termId).split(' ')[0] + split[1] + ' ';
                    split = final.time.split(/[^A-Za-z0-9.:]/);
                    obj.start = moment(day + split[0] + ' ' + split[2].split('.').join(''), ['YYYY MMMM D h:mm A']).format('MM/DD/YYYY HH:mm')
                    obj.end = moment(day + split[1] + ' ' + split[2].split('.').join('') + ':01', ['YYYY MMMM D h:mm A']).format('MM/DD/YYYY HH:mm')
                }else{
                    day = split[0];
                    split = final.time.split(/[^A-Za-z0-9.:]/);
                    start = moment(split[0] + ' ' + split[2].split('.').join(''), ['h:mm A']).format('HH:mm');
                    end = moment(split[1] + ' ' + split[2].split('.').join(''), ['h:mm A']).format('HH:mm');
                    obj.start = dateMap[day] + ' ' + start;
                    obj.end = dateMap[day] + ' ' + end;
                }

                obj.title = [course.c + ' - ' + course.s, 'Final'].join("\n");
                obj.number = course.num;
                obj.course = course;
                obj.color = colorMap.course;
                obj.awaitSelection = false;
                obj.conflict = false;
                obj.multiple = false;

                eventSource.push(obj)
                obj = {};
            })
        })
        .then(function() {
            return eventSource;
        })
    },
    showFinalSchedule: function(_, payload) {
        var termId = _.getters.termId;
        return _.dispatch('getEventObjectsFromFinal', payload)
        .then(function(eventSource) {
            _.commit('restoreEventSourceSnapshot', {
                termId: termId,
                events: eventSource
            });
            _.dispatch('refreshCalendar')
        })
    },
    filpSchedule: function(_) {
        var termId = _.getters.termId;
        if (!_.state.showFinal) {
            _.commit('saveEventSnapshot', _.state.events[termId]);
            _.dispatch('showFinalSchedule', {
                termId: termId
            })
        }else{
            _.commit('restoreEventSourceSnapshot', {
                termId: termId,
                events: _.state.eventSnapshot
            })
            _.commit('saveEventSnapshot', []);
            _.dispatch('refreshCalendar')
        }
        _.commit('flipFinalSchedule')
    },
    realtime: function(_) {
        var socket = require('socket.io-client')(config.realtimeURL)
        socket.on('connecting', function() {
            console.log('Push: Connecting to Feeds')
        })
        socket.on('connect', function() {
            console.log('Push: Feeds ready')
            _.commit('changePushReady', true)
            _.commit('saveSocket', socket)
        })
        socket.on('disconnect', function() {
            console.log('Push: Feeds disconnected')
            _.commit('changePushReady', false)
        })
        socket.on('delta', function(data) {
            _.commit('pushChanges', data)
        })
        socket.open()
    },
    subscribeRealtime: function(_) {
        // TODO: this is an ugly hack
        var unsubscribeRealtimeFn = window.App.$store.subscribe(function(mutation) {
            if (mutation.type !== 'pushChanges') return
            var delta = mutation.payload
            if (delta.termCode != _.getters.termId) return
            var events = _.getters.eventSource[_.getters.termId]
            if (typeof events === 'undefined') return
            var courseMap = _.getters.eventSource[_.getters.termId].reduce(function(numbers, evt) {
                if (numbers[evt.number] !== true) {
                    numbers[evt.number] = evt.course
                }
                return numbers
            }, {})
            if (typeof courseMap[delta.courseNum] !== 'undefined') {
                // *explosion*
                _.getters.alert.delay(0).success('Enrollment changes on ' + courseMap[delta.courseNum].c + '!')
            }
        })
        _.commit('saveUnsubscribeRealtimeFn', unsubscribeRealtimeFn)
    }
}
