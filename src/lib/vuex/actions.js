var helper = require('./helper'),
    storage = require('./plugins/storage'),
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
        return _.dispatch('fetchBasicData');
    },
    fetchThreeStatsByTid: function(_, tid) {
        if (typeof _.state.instructorStats[tid] !== 'undefined') {
            return Bluebird.resolve(_.state.instructorStats[tid]);
        }
        var timestamp = Date.now() / 1000;
        return Bluebird.all([
            fetch(config.dbURL + '/rmp/ratings/' + tid + '.json?' + timestamp),
            fetch(config.dbURL + '/rmp/scores/' + tid + '.json?' + timestamp),
            fetch(config.dbURL + '/rmp/stats/' + tid + '.json?' + timestamp)
        ])
        .spread(function(ratingsRes, scoresRes, statsRes){
            return Bluebird.all([
                ratingsRes.json(),
                scoresRes.json(),
                statsRes.json()
            ])
        }).spread(function(ratings, scores, stats){
            var stats = {
                tid: tid,
                stats: {
                    ratings: ratings,
                    scores: scores,
                    stats: stats
                }
            };
            _.commit('saveInstructorStats', stats);
            return stats;
        })
    },
    loadAutosave: function(_, payload) {
        termId = payload.termId;
        alert = (payload.alert === true);
        return storage.getItem(termId).then(function(array) {
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
                return;
            })
        }.bind(this))
    },
    loadBasicDataFromLocal: function(_) {
        var online;
        var self = this;
        var loadOnlineTimestamp = function() {
            var timestamp = Date.now() / 1000;
            return Bluebird.all([
                fetch(config.dbURL + '/timestamp/terms.json?' + timestamp),
                fetch(config.dbURL + '/timestamp/rmp.json?' + timestamp),
                fetch(config.dbURL + '/timestamp/subjects.json?' + timestamp),
                fetch(config.dbURL + '/timestamp/major-minor.json?' + timestamp)
            ]).spread(function(termsRes, rmpRes, subjectsRes, mmRes){
                return Bluebird.all([
                    termsRes.json(),
                    rmpRes.json(),
                    subjectsRes.json(),
                    mmRes.json()
                ])
            })
        }
        var loadOfflineTimestamp = function() {
            return Bluebird.all([
                storage.getItem('termsListTimestamp'),
                storage.getItem('rmpTimestamp'),
                storage.getItem('subjectsTimestamp'),
                storage.getItem('mmTimestamp')
            ])
        }
        var loadFromStorage = function(invalid) {
            return Bluebird.all([
                !invalid.termsList ? storage.getItem('termsList') : null,
                !invalid.rmp ? storage.getItem('rmp') : null,
                !invalid.subjects ? storage.getItem('subjects') : null,
                !invalid.mm ? storage.getItem('majorMinor') : null
            ]).spread(function(termsList, rmp, subjects, mm) {
                return _.dispatch('saveTermsAndRMP', {
                    termsList: termsList,
                    rmp: rmp,
                    subjects: subjects,
                    mm: mm,
                    skipSaving: true
                })
            })
        }
        return loadOnlineTimestamp()
        .then(function(timestamp) {
            online = timestamp;
            console.log('fetched online timestamp')
        })
        .catch(function(e) {
            console.log('fail to fetch online timestamp, checking local copy');
        })
        .finally(function() {
            return loadOfflineTimestamp().then(function(offline) {
                var invalid = {
                    yes: false,
                    termsList: false,
                    rmp: false,
                    mm: false,
                    subjects: false
                }
                if (typeof online !== 'undefined') {
                    // loadOnlineTimestamp() success
                    if (online[0] !== offline[0]) {
                        invalid.yes = true;
                        invalid.termsList = true;
                        console.log('terms list timestamp differs');
                    }
                    if (online[1] !== offline[1]) {
                        invalid.yes = true;
                        invalid.rmp = true;
                        console.log('rmp mapping timestamp differs');
                    }
                    if (online[2] !== offline[2]) {
                        invalid.yes = true;
                        invalid.subjects = true;
                        console.log('subjects timestamp differs');
                    }
                    if (online[3] !== offline[3]) {
                        invalid.yes = true;
                        invalid.mm = true;
                        console.log('major minor timestamp differs');
                    }
                }else{
                    // possibly no connectivity
                    if (offline[0] === null
                        || offline[1] === null
                        || offline[2] === null
                        || offline[3] === null) {
                        // We don't have a local copy
                        console.log(('no local copies to fallback'));
                        invalid = {
                            yes: true,
                            termsList: true,
                            rmp: true,
                            subjects: true,
                            mm: true
                        }
                        return Bluebird.reject(invalid)
                    }
                }

                if (invalid.yes) console.log('some or all local copies are outdated')
                else console.log('local copies valid')

                return loadFromStorage(invalid).then(function () {
                    return Bluebird.reject(invalid);
                })
            })
        })
    },
    loadBasicDataFromOnline: function(_, invalid) {
        var self = this;
        var timestamp = Date.now() / 1000;
        return Bluebird.all([
            invalid.termsList ? fetch(config.dbURL + '/terms.json?' + timestamp) : null,
            invalid.rmp ? fetch(config.dbURL + '/rmp.json?' + timestamp) : null,
            invalid.subjects ? fetch(config.dbURL + '/subjects.json?' + timestamp) : null,
            invalid.mm ? fetch(config.dbURL + '/major-minor.json?' + timestamp) : null
        ])
        .spread(function(termsRes, rmpRes, subjectsRes, mmRes){
            return Bluebird.all([
                invalid.termsList ? termsRes.json() : null,
                invalid.rmp ? rmpRes.json() : null,
                invalid.subjects ? subjectsRes.json() : null,
                invalid.mm ? mmRes.json() : null
            ])
        })
        .spread(function(termsList, rmp, subjects, mm) {
            return _.dispatch('saveTermsAndRMP', {
                termsList: termsList,
                rmp: rmp,
                subjects: subjects,
                mm: mm,
                skipSaving: false
            })
        })
        .then(function() {
            return true;
        })
        .catch(function(e) {
            console.log('loadBasicDataFromOnline rejection')
            console.log(e);
            return false;
        })
    },
    saveTermsAndRMP: function(_, payload) {
        if (payload.termsList !== null) _.commit('saveTermsList', payload);
        if (payload.rmp !== null) _.commit('saveInstructorNameToTidMapping', payload);
        if (payload.subjects !== null) _.commit('saveSubjects', payload);
        if (payload.mm !== null) _.commit('saveMajorMinor', payload);
    },
    fetchBasicData: function(_) {
        if (_.state.flatTermsList.length !== 0) {
            return Bluebird.resolve();
        }
        return _.dispatch('loadBasicDataFromLocal')
        .catch(function(invalid) {
            if (!invalid.yes) return true;
            return _.dispatch('loadBasicDataFromOnline', invalid)
        })
        .then(function(success) {
            if (success) return _.dispatch('fetchHistoricData')
        })
    },
    loadCourseDataFromLocal: function(_, termId) {
        var online;
        var self = this;
        var loadOnlineTimestamp = function() {
            var timestamp = Date.now() / 1000;
            return Bluebird.all([
                fetch(config.dbURL + '/timestamp/terms/' + termId + '.json?' + timestamp),
                fetch(config.dbURL + '/timestamp/courses/' + termId + '.json?' + timestamp)
            ]).spread(function(termsRes, InfoRes){
                return Bluebird.all([
                    termsRes.json(),
                    InfoRes.json()
                ])
            })
        }
        var loadOfflineTimestamp = function() {
            return Bluebird.all([
                storage.getItem('termCourseTimestamp-' + termId),
                storage.getItem('termCourseInfoTimestamp-' + termId)
            ])
        }
        var loadFromStorage = function(invalid) {
            return Bluebird.all([
                !invalid.coursesData ? storage.getItem('termCourse-' + termId) : null,
                !invalid.courseInfo ? storage.getItem('termCourseInfo-' + termId) : null
            ]).spread(function(coursesData, courseInfo) {
                return _.dispatch('saveCourseData', {
                    termId: termId,
                    coursesData: coursesData,
                    courseInfo: courseInfo,
                    skipSaving: true
                })
            })
        }
        return loadOnlineTimestamp()
        .then(function(timestamp) {
            online = timestamp;
            console.log('fetched online timestamp')
        })
        .catch(function(e) {
            console.log('fail to fetch online timestamp, checking local copy');
        })
        .finally(function() {
            return loadOfflineTimestamp().then(function(offline) {
                var invalid = {
                    yes: false,
                    coursesData: false,
                    courseInfo: false
                }
                if (typeof online !== 'undefined') {
                    // loadOnlineTimestamp() success
                    if (online[0] !== offline[0]) {
                        invalid.yes = true;
                        invalid.coursesData = true;
                        console.log('courses data timestamp differs');
                    }
                    if (online[1] !== offline[1]) {
                        invalid.yes = true;
                        invalid.courseInfo = true;
                        console.log('course info timestamp differs');
                    }
                }else{
                    // possibly no connectivity
                    if (offline[0] === null
                        || offline[1] === null) {
                        // We don't have a local copy
                        console.log(('no local copies to fallback'));
                        invalid = {
                            yes: true,
                            coursesData: true,
                            courseInfo: true
                        }
                        return Bluebird.reject(invalid)
                    }
                }

                if (invalid.yes) console.log('some or all local copies are outdated')
                else console.log('local copies valid')

                return loadFromStorage(invalid).then(function () {
                    return Bluebird.reject(invalid);
                })
            })
        })
    },
    loadCourseDataFromOnline: function(_, payload) {
        var invalid = payload.invalid, termId = payload.termId;
        var self = this;
        var timestamp = Date.now() / 1000;
        return Bluebird.all([
            invalid.coursesData ? fetch(config.dbURL + '/terms/' + termId + '.json?' + timestamp) : null,
            invalid.courseInfo ? fetch(config.dbURL + '/courses/' + termId + '.json?' + timestamp) : null
        ])
        .spread(function(courseDataRes, courseInfoRes){
            return Bluebird.all([
                invalid.coursesData ? courseDataRes.json() : null,
                invalid.courseInfo ? courseInfoRes.json() : null
            ])
        })
        .spread(function(coursesData, courseInfo) {
            return _.dispatch('saveCourseData', {
                termId: termId,
                coursesData: coursesData,
                courseInfo: courseInfo,
                skipSaving: false
            })
        })
        .then(function() {
            return true;
        })
        .catch(function(e) {
            console.log('loadCourseDataFromOnline rejection')
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
        .catch(function(invalid) {
            if (!invalid.yes) return true;
            return _.dispatch('loadCourseDataFromOnline', {
                invalid: invalid,
                termId: termId
            })
        })
        .then(function(success) {
            if (success) _.commit('buildIndexedSearch', termId)
        })
    },
    fetchThreeStatsByFirstLastName: function(_, payload) {
        var tid = _.state.instructorNameToTidMapping[payload.firstName + payload.lastName];
        if (typeof tid === 'undefined') {
            return Bluebird.resolve(null);
        }
        return _.dispatch('fetchThreeStatsByTid', tid);
    },
    dispatchReplaceHash: function(_) {
        var termId = _.getters.termId;
        _.commit('replaceHash', termId);
    },
    dispatchReplaceHashPlanner: function(_) {
        _.commit('replaceHashPlanner');
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
            console.log('trying to restore events from hash')
            var hash = window.location.hash.substring(1);
            var string = LZString.decompressFromEncodedURIComponent(hash);
            if (string.length === 0) {
                string = helper.Base64.decode(hash);
            }
            var array = JSON.parse(string);
            if (typeof array.forEach !== 'undefined') {
                console.log('valid hash found')
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
                console.log('fallback to local copy (inner)')
                return Bluebird.resolve();
            }
        }catch(e) {
            console.log(e);
            console.log('fallback to local copy (outer)')
            return Bluebird.resolve();
        }
    },
    refreshCalendar: function(_) {
        var termId = _.getters.termId;
        var dateMap = _.state.dateMap;

        var calendarStart = '07:00', calendarEnd = '23:00';

        if (_.state.lockMinMax !== true) {
            var startTime = new Date(), endTime = new Date(), minStart = Infinity, maxEnd = -Infinity;
            var split = null;
            (_.getters.eventSource[termId] || []).forEach(function(e) {
                split = e.start.split(' ');
                if (split) startTime = new Date(dateMap.Monday + ' ' + split[1]);
                else return;
                split = e.end.split(' ');
                if (split) endTime = new Date(dateMap.Monday + ' ' + split[1]);
                else return;

                if (endTime.getTime() <= startTime.getTime()) return;
                if (startTime.getTime() < minStart) minStart = startTime.getTime();
                if (endTime.getTime() > maxEnd) maxEnd = endTime.getTime();
            })

            if (minStart !== Infinity || maxEnd !== -Infinity) {
                calendarStart = (new Date(minStart).getMinutes()) > 0 ? new Date(minStart).getHours() + ':00' : new Date(minStart).getHours() + ':' + new Date(minStart).getMinutes()
                calendarEnd = (new Date(maxEnd).getMinutes()) > 0 ? (new Date(maxEnd).getHours() + 1) + ':00' : new Date(maxEnd).getHours() + ':' + new Date(maxEnd).getMinutes()
            }
        }

        $('#calendar-' + termId).fullCalendar('option', {
            minTime: calendarStart,
            maxTime: calendarEnd
        })
        $('#calendar-' + termId).fullCalendar('refetchEvents')

        $('.fc-day-grid').insertAfter($('.fc-time-grid'))
        $('.fc-divider').insertAfter($('.fc-time-grid'))

        $('.alertify').remove();
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
        var courseNum, course, courseInfo, sectionNumber, section, conflict, multiple;
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
        _.getters.loading.go(50);
        var secSeats = null, termId = payload.termId, courseNum = payload.courseNum;

        return _.dispatch('fetchRealTimeEnrollment', {
            termCode: termId,
            courseNum: courseNum
        })
        .then(function(res) {
            if (res.ok && res.results[0] && res.results[0].seats) {
                secSeats = res.results[0].seats.sec;
            }
            _.getters.loading.go(70);
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
                _.getters.loading.go(100);
                _.getters.alert.success('Now You Are Choosing Section For ' + _.state.flatCourses[termId][courseNum].c)
            })
        }.bind(this))
    },
    removeFromSource: function(_, payload) {
        _.commit('removeFromSource', payload);
    },
    _showInstructorRMP: function(_, string) {
        _.getters.loading.go(30);
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
            _.getters.loading.go(70);
            if (rmp !== null) {
                var obj = rmp.stats.stats.quality;
                var max = Object.keys(obj).reduce(function(a, b){ return obj[a] > obj[b] ? a : b });
                html += template('Quality', course.ins.f + ' is ' + max)
                html += template('Clarity', rmp.stats.stats.clarity.toFixed(1))
                html += template('Easy', rmp.stats.stats.easy.toFixed(1))
                html += template('Overall', rmp.stats.stats.overall.toFixed(1))
                html += template('Based on', rmp.stats.scores.count + ' ratings')
                _.getters.alert
                .okBtn('See it for yourself')
                .cancelBtn('Go Back')
                .confirm(html)
                .then(function(resolved) {
                    resolved.event.preventDefault();
                    if (resolved.buttonClicked !== 'ok') return;
                    window.open('http://www.ratemyprofessors.com/ShowRatings.jsp?tid=' + rmp.tid);
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
            _.getters.loading.go(100);
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

        cal.download('Schedule for ' + _.state.termName);
    },
    fetchRealTimeEnrollment: function(_, payload) {
        var timestamp = Date.now() / 1000;
        return fetch(config.trackingURL + '/fetch/' + payload.termCode + '/' + payload.courseNum + '/latestOne?' + timestamp)
        .then(function(res) {
            return res.json();
        })
        .catch(function(e) {
            return {ok: false}
        })
    },
    _showRealTimeEnrollment: function(_, string) {
        _.getters.loading.go(30);
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
                monitorStart.setDate(monitorStart.getDate() - 75);
            }
            _.getters.loading.go(70);
            if (res.ok && res.results[0] && res.results[0].seats) {
                var latest = res.results[0];
                var seat = latest.seats;
                var isSection = (!!sectionNum && courseNum !== sectionNum);

                if (isSection) {
                    // checking section
                    seat = getSeatBySectionNum(seat.sec, sectionNum)
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
            _.getters.loading.go(100);
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
        var termId = payload.termId, course = payload.courseObj, isSection = payload.isSection, courseNum = payload.courseNum;
        var courseInfo = courseNum ? _.getters.courseInfo[termId][courseNum] : _.getters.courseInfo[termId][course.num];
        isSection = isSection || false;
        if (!isSection && !course.custom) {
            var courseHasSections = _.getters.courseInfo[termId][course.num].sec.length > 0;
            var materialLink = helper.getMaterialsLink(termId, course);
        }
        var html = '';
        var template = function(key, value) {
            return ['<p>', '<span class="muted h6">', key, ': </span><b class="h5">', value, '</b>', '</p>'].join('');
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
            html += '<hr />'
        }

        if (course.custom !== true) {
            html += template('Is It Open', '<span class="muted clickable rainbow" onclick="window.App.$store.dispatch(\'_showRealTimeEnrollment\', \'' + termId + (courseNum ? '+' + courseNum : '') + '+' + course.num + '\')">Check Real Time</span>');
        }

        return html;
    },
    updateWatch: function(_, payload) {
        var self = this, recipient = payload.recipient, code = payload.code, courses = payload.courses;
        return fetch(config.notifyURL + '/watch/update', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                recipient: recipient,
                code: code,
                courses: courses.map(function(el) {
                    return el.num
                }),
                termId: _.getters.latestTermCode
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
        var timestamp = Date.now() / 1000;
        return fetch(config.dbURL + '/ge.json?' + timestamp)
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
    loadHistoricDataFromLocal: function(_) {
        var online;
        var self = this;
        var timestamp = Date.now() / 1000;
        var loadOnlineTimestamp = function() {
            return Bluebird.all([
                fetch(config.dbURL + '/timestamp/terms.json?' + timestamp)
            ]).spread(function(res) {
                return Bluebird.all([
                    res.json()
                ])
            })
        }
        var loadOfflineTimestamp = function() {
            return Bluebird.all([
                storage.getItem('historicDataTimestamp')
            ])
        }
        var loadFromStorage = function(invalid) {
            return Bluebird.all([
                !invalid.historicData ? storage.getItem('historicData') : null
            ]).spread(function(historicData) {
                return _.dispatch('saveHistoricData', {
                    historicData: historicData,
                    skipSaving: true
                })
            })
        }
        return loadOnlineTimestamp()
        .then(function(timestamp) {
            online = timestamp;
            console.log('fetched online timestamp')
        })
        .catch(function(e) {
            console.log('fail to fetch online timestamp, checking local copy');
        })
        .finally(function() {
            return loadOfflineTimestamp().then(function(offline) {
                var invalid = {
                    yes: false,
                    historicData: false
                }
                if (typeof online !== 'undefined') {
                    // loadOnlineTimestamp() success
                    if (online[0] !== offline[0]) {
                        invalid.yes = true;
                        invalid.historicData = true;
                        console.log('historic data timestamp differs');
                    }
                }else{
                    // possibly no connectivity
                    if (offline[0] === null) {
                        // We don't have a local copy
                        console.log(('no local copies to fallback'));
                        invalid = {
                            yes: true,
                            historicData: true
                        }
                        return Bluebird.reject(invalid)
                    }
                }

                if (invalid.yes) console.log('some or all local copies are outdated')
                else console.log('local copies valid')

                return loadFromStorage(invalid).then(function() {
                    return Bluebird.reject(invalid)
                })
            })
        })
    },
    loadHistoricDataFromOnline: function(_) {
        var timestamp = Date.now() / 1000;
        return Bluebird.all([
            fetch(config.dbURL + '/offered/spring.json?' + timestamp),
            fetch(config.dbURL + '/offered/summer.json?' + timestamp),
            fetch(config.dbURL + '/offered/fall.json?' + timestamp),
            fetch(config.dbURL + '/offered/winter.json?' + timestamp)
        ])
        .spread(function(springRes, summerRes, fallRes, winterRes){
            return Bluebird.all([
                springRes.json(),
                summerRes.json(),
                fallRes.json(),
                winterRes.json()
            ])
        })
        .spread(function(spring, summer, fall, winter){
            return _.dispatch('saveHistoricData', {
                historicData: {
                    spring: spring,
                    summer: summer,
                    fall: fall,
                    winter: winter
                },
                skipSaving: false
            });
        })
        .then(function() {
            return true;
        })
        .catch(function(e) {
            console.log('loadHistoricDataFromOnline rejection')
            console.log(e);
            return false;
        })
    },
    fetchHistoricData: function(_) {
        if (typeof _.state.historicData.spring !== 'undefined') {
            return Bluebird.resolve();
        }
        return _.dispatch('loadHistoricDataFromLocal')
        .catch(function(invalid) {
            if (!invalid.yes) return true;
            return _.dispatch('loadHistoricDataFromOnline')
        })
        .then(function(success) {
            if (success) _.dispatch('buildHistoricFrequency')
        })
    },
    saveHistoricData: function(_, payload) {
        if (payload.historicData !== null) _.commit('saveHistoricData', payload)
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
        return storage.getItem('academicPlanner').then(function(object) {
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
        }, { concurrency: 4 })
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
    }
}
