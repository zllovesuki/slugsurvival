var helper = require('./helper'),
    storage = require('./plugins/storage'),
    config = require('../../../config')

var self = module.exports = {
    alert: function(_) {
        return _.state.alert;
    },
    setTitle: function(_, title) {
        _.dispatch('setTitle', title)
    },
    iOS: function(_) {
        var userAgent = window.navigator.userAgent;
        if (userAgent.match(/iPad/i) || userAgent.match(/iPhone/i)) {
            return true;
        }
        return false;
    }, // http://stackoverflow.com/questions/3007480/determine-if-user-navigated-from-mobile-safari
    ensureDataLoaded: function(_) {
        return this.fetchTermsListAndRMP();
    },
    fetchThreeStatsByTid: function(_, tid) {
        if (typeof _.state.instructorStats[tid] !== 'undefined') {
            return Promise.resolve(_.state.instructorStats[tid]);
        }
        return Promise.all([
            fetch(config.dbURL + '/rmp/ratings/' + tid + '.json'),
            fetch(config.dbURL + '/rmp/scores/' + tid + '.json'),
            fetch(config.dbURL + '/rmp/stats/' + tid + '.json')
        ])
        .spread(function(ratingsRes, scoresRes, statsRes){
            return Promise.all([
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
            _.dispatch('saveInstructorStats', stats);
            return stats;
        })
    },
    fetchHistoricData: function(_) {
        if (typeof _.state.historicData.spring !== 'undefined') {
            return Promise.resolve();
        }
        return Promise.all([
            fetch(config.dbURL + '/offered/spring.json'),
            fetch(config.dbURL + '/offered/summer.json'),
            fetch(config.dbURL + '/offered/fall.json'),
            fetch(config.dbURL + '/offered/winter.json')
        ])
        .spread(function(springRes, summerRes, fallRes, winterRes){
            return Promise.all([
                springRes.json(),
                summerRes.json(),
                fallRes.json(),
                winterRes.json()
            ])
        })
        .spread(function(spring, summer, fall, winter){
            _.dispatch('saveHistoricData', spring, summer, fall, winter);
        })
    },
    loadAutosave: function(_) {
        var termId = this.termId;
        return storage.getItem(termId).then(function(array) {
            if (array !== null) {
                var events = this.parseFromCompact(array);
                _.dispatch('restoreEventSourceSnapshot', termId, events);
                this.alert().okBtn('Cool!').alert('<p>We found a planner saved in your browser!</p>')
            }
        }.bind(this))
    },
    loadTermsAndRMPFromLocal: function(_) {
        var online;
        var self = this;
        var loadOnlineTimestamp = function() {
            return Promise.all([
                fetch(config.dbURL + '/timestamp/terms.json'),
                fetch(config.dbURL + '/timestamp/rmp.json')
            ]).spread(function(termsRes, rmpRes){
                return Promise.all([
                    termsRes.json(),
                    rmpRes.json()
                ])
            })
        }
        var loadOfflineTimestamp = function() {
            return Promise.all([
                storage.getItem('termsListTimestamp'),
                storage.getItem('rmpTimestamp')
            ])
        }
        var loadFromStorage = function(invalid) {
            return Promise.all([
                !invalid.termsList ? storage.getItem('termsList') : null,
                !invalid.rmp ? storage.getItem('rmp') : null
            ]).spread(function(termsList, rmp) {
                return self.dispatchSaveTermsAndRMP(termsList, rmp, true);
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
                    rmp: false
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
                }else{
                    // possibly no connectivity
                    if (offline[0] === null
                        || offline[1] === null) {
                        // We don't have a local copy
                        console.log(('no local copies to fallback'));
                        invalid = {
                            yes: true,
                            termsList: true,
                            rmp: true
                        }
                        return Promise.reject(invalid)
                    }
                }

                if (invalid.yes) console.log('some or all local copies are outdated')
                else console.log('local copies valid')

                return loadFromStorage(invalid).then(function () {
                    return Promise.reject(invalid);
                })
            })
        })
    },
    loadTermsAndRMPFromOnline: function(_, invalid) {
        var self = this;
        return Promise.all([
            invalid.termsList ? fetch(config.dbURL + '/terms.json') : null,
            invalid.rmp ? fetch(config.dbURL + '/rmp.json') : null
        ])
        .spread(function(termsRes, rmpRes){
            return Promise.all([
                invalid.termsList ? termsRes.json() : null,
                invalid.rmp ? rmpRes.json() : null
            ])
        })
        .spread(function(termsList, rmp) {
            return self.dispatchSaveTermsAndRMP(termsList, rmp, false);
        })
    },
    dispatchSaveTermsAndRMP: function(_, termsList, rmp, skipSaving) {
        if (termsList !== null) _.dispatch('saveTermsList', termsList, skipSaving);
        if (rmp !== null) _.dispatch('saveInstructorNameToTidMapping', rmp, skipSaving);
    },
    fetchTermsListAndRMP: function(_) {
        if (_.state.flatTermsList.length === 0) {
            return this.loadTermsAndRMPFromLocal()
            .catch(function(invalid) {
                if (invalid.yes) {
                    return this.loadTermsAndRMPFromOnline(invalid)
                }
            }.bind(this))
        } else {
            return Promise.resolve()
        }
    },
    loadCourseDataFromLocal: function(_) {
        var online;
        var termId = this.termId;
        var workaround = this.iOS();
        var self = this;
        var loadOnlineTimestamp = function() {
            return Promise.all([
                fetch(config.dbURL + '/timestamp/terms/' + termId + '.json'),
                fetch(config.dbURL + '/timestamp/courses/' + termId + '.json'),
                fetch(config.dbURL + '/timestamp/index/' + termId + '.json')
            ]).spread(function(termsRes, InfoRes, indexRes){
                return Promise.all([
                    termsRes.json(),
                    InfoRes.json(),
                    indexRes.json()
                ])
            })
        }
        var loadOfflineTimestamp = function() {
            return Promise.all([
                storage.getItem('termCourseTimestamp-' + termId),
                storage.getItem('termCourseInfoTimestamp-' + termId),
                storage.getItem('termIndexTimestamp-' + termId)
            ])
        }
        var loadFromStorage = function(invalid) {
            return Promise.all([
                !invalid.coursesData ? storage.getItem('termCourse-' + termId) : null,
                !invalid.courseInfo ? storage.getItem('termCourseInfo-' + termId) : null,
                workaround ? null : (!invalid.index ? storage.getItem('termIndex-' + termId) : null)
            ]).spread(function(coursesData, courseInfo, index) {
                return self.dispatchSaveCourseData(coursesData, courseInfo, index, true);
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
                    courseInfo: false,
                    index: false
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
                    if (!workaround && online[2] !== offline[2]) {
                        invalid.yes = true;
                        invalid.index = true;
                        console.log('index timestamp differs');
                    }
                }else{
                    // possibly no connectivity
                    if (offline[0] === null
                        || offline[1] === null
                        || (!workaround && offline[2] === null)) {
                        // We don't have a local copy
                        console.log(('no local copies to fallback'));
                        invalid = {
                            yes: true,
                            coursesData: true,
                            courseInfo: true,
                            index: true
                        }
                        return Promise.reject(invalid)
                    }
                }

                if (invalid.yes) console.log('some or all local copies are outdated')
                else console.log('local copies valid')

                return loadFromStorage(invalid).then(function () {
                    return Promise.reject(invalid);
                })
            })
        })
    },
    loadCourseDataFromOnline: function(_, invalid) {
        var termId = this.termId;
        var workaround = this.iOS();
        var self = this;
        return Promise.all([
            invalid.coursesData ? fetch(config.dbURL + '/terms/' + termId + '.json') : null,
            invalid.courseInfo ? fetch(config.dbURL + '/courses/' + termId + '.json') : null,
            workaround ? null : (invalid.index ? fetch(config.dbURL + '/index/' + termId + '.json') : null)
        ])
        .spread(function(courseDataRes, courseInfoRes, indexRes){
            return Promise.all([
                invalid.coursesData ? courseDataRes.json() : null,
                invalid.courseInfo ? courseInfoRes.json() : null,
                workaround ? null : (invalid.index ? indexRes.json() : null)
            ])
        })
        .spread(function(coursesData, courseInfo, index) {
            return self.dispatchSaveCourseData(coursesData, courseInfo, index, false);
        })
    },
    dispatchSaveCourseData: function(_, coursesData, courseInfo, index, skipSaving) {
        var termId = this.termId;
        var workaround = this.iOS();
        if (coursesData !== null) _.dispatch('saveTermCourses', termId, coursesData, skipSaving);
        if (courseInfo !== null) _.dispatch('saveCourseInfo', termId, courseInfo, skipSaving);
        if (workaround || index !== null) _.dispatch('buildIndexedSearch', termId, index, workaround, skipSaving);
    },
    fetchTermCourses: function(_) {
        var termId = this.termId;
        _.dispatch('setTermName', _.state.termsList[termId])
        if (typeof _.state.flatCourses[termId] === 'undefined') {
            return this.loadCourseDataFromLocal()
            .catch(function(invalid) {
                if (invalid.yes) {
                    return this.loadCourseDataFromOnline(invalid)
                }
            }.bind(this))
        } else {
            return Promise.resolve()
        }
    },
    fetchThreeStatsByFirstLastName: function(_, firstName, lastName) {
        var tid = _.state.instructorNameToTidMapping[firstName + lastName];
        if (typeof tid === 'undefined') {
            return Promise.resolve(null);
        }
        return this.fetchThreeStatsByTid(tid);
    },
    dispatchReplaceHash: function(_) {
        var termId = this.termId;
        _.dispatch('replaceHash', termId);
    },
    parseFromCompact: function(_, array) {
        var events = [];
        array.forEach(function(obj) {
            obj = obj + '';
            split = obj.split('-')
            if (typeof split[1] !== 'undefined') {
                if (split[1] == 'null') split[1] = null;
                events = events.concat(this.getEventObjectsByCourse(split[0], split[1]))
            }else{
                events = events.concat(this.getEventObjectsByCourse(split[0]));
            }
        }.bind(this));

        return events;
    },
    decodeHash: function(_) {
        var termId = this.termId;
        try {
            console.log('trying to restore events from hash')
            var hash = window.location.hash.substring(1);
            var array = JSON.parse(helper.Base64.decode(hash));
            if (typeof array.forEach !== 'undefined') {
                console.log('valid hash found')
                var split;
                var course;

                var events = this.parseFromCompact(array);

                _.dispatch('restoreEventSourceSnapshot', termId, events);

                var html = '';
                html += ['<p>', 'Looks like you are accessing the planner via a bookmark link! We have the planner for you!', '</p>'].join('');
                html += ['<p>', 'However, if you makes changes to the planner on this page, your will <b>override</b> your planner previously saved in your browser (if you have one already).', '</p>'].join('');

                this.alert()
                .okBtn('OK')
                .alert(html);
                return Promise.reject();
            }else{
                console.log('fallback to local copy')
                return Promise.resolve();
            }
        }catch(e) {
            console.log(e);
            console.log('fallback to local copy')
            return Promise.resolve();
        }
    },
    courseHasSections: function(_, courseNumber) {
        var termId = this.termId;
        return _.state.courseInfo[termId][courseNumber].sec.length > 0;
    },
    refreshCalendar: function(_) {
        $('#calendar-' + this.termId).fullCalendar('refetchEvents');
        $('.alertify').remove();
    },
    returnEventSourceSnapshot: function(_) {
        var termId = this.termId;
        return _.state.events[termId]
    },
    getEventObjectsByCourse: function(_, input1, input2) {
        var termId = this.termId;
        var dateMap = _.state.dateMap;
        var events = [];
        var obj = {};
        var courseNumber, course, courseInfo, sectionNumber, section;

        // We are not sure that if input1 is a course object or course number
        if (typeof input1.num !== 'undefined') {
            courseNumber = input1.num;
            course = input1;
            courseInfo = _.state.courseInfo[termId][courseNumber];
        }else{
            courseNumber = input1;
            course = _.state.flatCourses[termId][courseNumber];
            courseInfo = _.state.courseInfo[termId][courseNumber];
        }

        // Process course
        if (course.loct.length === 1 && !!!course.loct[0].t) {
            // TBA will be in the allDaySlot
            obj.title = [course.c + ' - ' + course.s, courseInfo.ty, course.n].join("\n");
            obj.number = course.num;
            obj.allDay = true;
            obj.start = dateMap['Monday'];
            obj.end = dateMap['Saturday'];
            obj.course = course;
            obj.color = 'green';
            events.push(obj);
            obj = {};
        }else{
            for (var j = 0, locts = course.loct, length = locts.length; j < length; j++) {
                for (var i = 0, days = locts[j].t.day, length1 = days.length; i < length1; i++) {
                    obj.title = [course.c + ' - ' + course.s, courseInfo.ty, course.n].join("\n");
                    obj.number = course.num;
                    obj.allDay = false;
                    obj.start = dateMap[days[i]] + ' ' + locts[j].t.time.start;
                    obj.end = dateMap[days[i]] + ' ' + locts[j].t.time.end;
                    obj.course = course;
                    events.push(obj);
                    obj = {};
                }
            }
        }

        // We are going to process section as well if provided
        if (typeof input2 !== 'undefined' && input2 !== null) {
            sectionNumber = input2;
            section = courseInfo.sec.filter(function(section) {
                return section.num == sectionNumber;
            });
            section = section[0];
        }else if (input2 === null) {
            sectionNumber = null;
        }else{
            section = false;
        }

        if (section === false) return events;

        // We will now process sections
        if (sectionNumber === null || (section.loct.length === 1 && !!!section.loct[0].t)) {
            // TBA or Choose Later will be in the allDaySlot
            obj.title = [course.c, 'Section', 'DIS - ' + (sectionNumber === null ? '?' : section.sec)].join("\n");
            obj.number = course.num;
            obj._number = (sectionNumber === null ? null : section.num);
            obj.color = (sectionNumber === null ? 'black' : 'green');
            obj.course = course;
            obj.section = null;
            obj.start = dateMap['Monday'];
            obj.end = dateMap['Saturday'];
            events.push(obj);
            obj = {};
        } else {
            for (var i = 0, days = section.loct[0].t.day, length = days.length; i < length; i++) {
                obj.title = [course.c, 'Section', 'DIS - ' + section.sec].join("\n");
                obj.number = course.num;
                obj._number = sectionNumber;
                obj.color = 'grey';
                obj.course = course;
                obj.section = section;
                obj.start = dateMap[days[i]] + ' ' + section.loct[0].t.time.start;
                obj.end = dateMap[days[i]] + ' ' + section.loct[0].t.time.end;
                events.push(obj);
                obj = {};
            }
        }

        return events;
    },
    /*
        pushToEventSource() and _pushSectionToEventSource() are mutually exclusive
        You can call either one (but not both)
    */
    pushToEventSource: function(_, course, edit, changed) {

        var termId = this.termId;
        var courses = _.state.flatCourses[termId];
        var events = [];

        events = this.getEventObjectsByCourse(course);
        _.dispatch('mergeEventSource', termId, events);

        return Promise.resolve();
    },
    _pushSectionToEventSource: function(_, courseNumber, sectionNumber, edit) {
        /*
            edit denotes the operation
            true: it is an editing operation
            false: it is NOT an editing operatin (possibly first time adding the class)
            null: user has selected choose later, prompts something else
        */
        var termId = this.termId;
        var course = _.state.flatCourses[termId][courseNumber];
        var events = [];

        if (edit === true || edit === null) {
            // Let's check if user selects "Choose Later" again
            if (sectionNumber === null) {
                // Choose Later, so we remove the *old* TBA section
                this.removeEmptySection(termId, course.num);
            }else{
                // Or, remove every old event
                this.removeFromSource(termId, course.num);
            }
        }

        events = this.getEventObjectsByCourse(courseNumber, sectionNumber);
        _.dispatch('mergeEventSource', termId, events);

        // Since this method can only be called outside of Vue context
        // Thus the notifications are called inside this function
        // Also, this function will refresh the calendar
        this.refreshCalendar();
        if (edit === true || edit === null) {
            this.alert().success(course.c + ' edited!')
        } else {
            this.alert().success(course.c + ' added to the planner!')
        }

        return Promise.resolve();
    },
    removeFromSource: function(_, termId, courseNumber) {
        _.dispatch('removeFromSource', termId, courseNumber);
    },
    removeEmptySection: function(_, termId, courseNumber) {
        _.dispatch('removeEmptySection', termId, courseNumber)
    },
    _showInstructorRMP: function(_, firstName, lastName) {
        this.loading.go(30);
        var html = '';
        var template = function(key, value) {
            return ['<p>', '<span class="muted h6">', key, ': </span><b class="h5">', value, '</b>', '</p>'].join('');
        }
        this.fetchThreeStatsByFirstLastName(firstName, lastName)
        .then(function(rmp) {
            this.loading.go(70);
            if (rmp !== null) {
                var obj = rmp.stats.stats.quality;
                var max = Object.keys(obj).reduce(function(a, b){ return obj[a] > obj[b] ? a : b });
                html += template('Quality', firstName + ' is ' + max)
                html += template('Clarity', rmp.stats.stats.clarity.toFixed(1))
                html += template('Easy', rmp.stats.stats.easy.toFixed(1))
                html += template('Overall', rmp.stats.stats.overall.toFixed(1))
                html += template('Based on', rmp.stats.scores.count + ' ratings')
                this.alert()
                .okBtn('See it for yourself')
                .cancelBtn('Go Back')
                .confirm(html)
                .then(function(resolved) {
                    resolved.event.preventDefault();
                    if (resolved.buttonClicked !== 'ok') return;
                    window.open('http://www.ratemyprofessors.com/ShowRatings.jsp?tid=' + rmp.tid);
                })
            }else{
                this.alert()
                .okBtn('Go Back')
                .alert(['<p>', 'Sorry, we don\'t have', firstName + '\'s', 'ratings!', '</p>'].join(' '))
            }
        }.bind(this))
        .catch(function(e) {
            console.log(e);
            this.alert().error('Cannot fetch RMP stats!')
        }.bind(this))
        .finally(function() {
            this.loading.go(100);
        }.bind(this))
    },
    checkForConflict: function(_, course) {
        /*
            TODO: This method needs a more efficient rewrite
            Who the fuck write so many forLoops anyway?
        */
        /*

        The original simplistic approach will check times on a different day, thus
        to address classes with multiple time blocks, a new data structure and algorithm are needed.

        We will use an object with key corresponds to Day of the week, the value containing an array of time slots
        e.g.

        var existingTimes = {
            "Tuesday": [
                "start": "18:00",
                "end": "20:00"
            ]
        }

        Then, we will check for intersecting days between existingTimes and the "new course",
        put the conflicting days into a new array
        e.g.

        var intersectDays = [
            'Tuesday'
        ];

        Then, we will compare the "new" course with the timeslots for conflict

        */
        var termId = this.termId;
        var events =  _.state.events[termId];
        var intersectDays = [];
        var existingDays = [];
        var existingTimes = {};
        var checker = {};
        var comingTime = null;
        var day = null;
        var conflict = false;
        if (typeof events === 'undefined') return false;
        for (var i = 0, length = events.length; i < length; i++) {
            // You can't take the same class twice in a quarter
            // At least you shouldn't
            if (events[i].course.c === course.c) {
                conflict = course.c;
                break;
            }
            if (events[i].allDay) continue;

            if (typeof events[i].section !== 'undefined' && events[i].section !== null) {
                day = events[i].section.loct[0].t.day[0];
                existingDays.push(day);
            } else {
                for (var j = 0, locts = events[i].course.loct, length1 = locts.length; j < length1; j++) {
                    if (!locts[j].t) continue;
                    for (var k = 0, days = locts[j].t.day, length2 = days.length; k < length2; k++) {
                        day = days[k];
                        existingDays.push(day);
                    }
                }
            }
            day = null;
        }

        if (conflict !== false) return null;

        if (course.loct.length === 1 && !!!course.loct[0].t) {
            // TBA
            return false;
        }

        existingDays = existingDays.filter(function(e, i, c) {
            return c.indexOf(e) === i;
        });

        for (var i = 0, length = existingDays.length; i < length; i++) {
            for (var j = 0, locts = course.loct, length1 = locts.length; j < length1; j++) {
                if (!locts[j].t) continue;
                if (locts[j].t.day.indexOf(existingDays[i]) !== -1) {
                    intersectDays.push(locts[j].t.day);
                }
            }
        }

        intersectDays = [].concat.apply([], intersectDays).filter(function(e, i, c) {
            return c.indexOf(e) === i;
        });

        if (intersectDays.length === 0) return false;

        // O(n^2)
        // sucks
        /*

                CONSIDER NESTED LOOP HARMFUL

        */

        for (var i = 0, length = intersectDays.length; i < length; i++) {
            for (var j = 0, eLength = events.length; j < eLength; j++) {
                if (events[j].allDay) continue;
                if (typeof events[j].section !== 'undefined' && events[j].section !== null) {
                    if (events[j].section.loct[0].t.day.indexOf(intersectDays[i]) !== -1) {
                        if (typeof checker[events[j].course.c + ' Section'] === 'undefined') {
                            checker[events[j].course.c + ' Section'] = {};
                        }
                        checker[events[j].course.c + ' Section'][intersectDays[i]] = events[j].section.loct[0].t.time;
                    }
                } else {
                    for (var m = 0, locts = events[j].course.loct, length1 = locts.length; m < length1; m++) {
                        if (!locts[m].t) continue;
                        if (locts[m].t.day.indexOf(intersectDays[i]) !== -1) {
                            if (typeof checker[events[j].course.c] === 'undefined') {
                                checker[events[j].course.c] = {};
                            }
                            checker[events[j].course.c][intersectDays[i]] = locts[m].t.time;
                        }
                    }
                }
            }
        }

        var oldStart, newStart, oldEnd, newEnd;

        for (var j = 0, locts = course.loct, length1 = locts.length; j < length1; j++) {
            if (!locts[j].t) continue;
            comingTime = locts[j].t.time;

            for (var code in checker) {
                // check each class in the conflicting
                for (var day in checker[code]) {
                    // check each day
                    if (locts[j].t.day.indexOf(day) !== -1) {
                        // only check the day if it is actually conflicting
                        oldStart = checker[code][day].start.replace(':', '');
                        oldEnd = checker[code][day].end.replace(':', '');
                        newStart = comingTime.start.replace(':', '');
                        newEnd = comingTime.end.replace(':', '');
                        if (this.checkTimeConflict(oldStart, oldEnd, newStart, newEnd)) {
                            return code;
                        }
                    }
                }
            }
        }

        return conflict;
    },
    checkTimeConflict: function(_, oldStart, oldEnd, newStart, newEnd) {
        if ((newStart > oldStart) && (newEnd > oldEnd) && (oldEnd > newStart)) {
            //console.log('new course is eating from behind')
            return true;
        }

        if ((oldEnd > newEnd) && (oldStart > newStart) && (newEnd > oldStart)) {
            //console.log('new course is eating from ahead');
            return true;
        }

        if ((newEnd == oldStart) || (newStart == oldEnd)) {
            //console.log('piggy back');
            return true;
        }

        if ((newEnd == oldEnd) || (newStart == oldStart)) {
            //console.log('overlap');
            return true;
        }

        if ((oldEnd > newEnd) && (newStart > oldStart)) {
            //console.log('new course is inside');
            return true;
        }

        if ((oldEnd < newEnd) && (newStart < oldStart)) {
            //console.log('new course is outside');
            return true;
        }
        return false;
    },
    tConvert: function(_, time) {
        // Check correct time format and split into components
        time = time.toString().match(/^([01]\d|2[0-3])(:)([0-5]\d)(:[0-5]\d)?$/) || [time];

        if (time.length > 1) { // If time format correct
            time = time.slice(1); // Remove full string match value
            time[5] = +time[0] < 12 ? 'AM' : 'PM'; // Set AM/PM
            time[0] = +time[0] % 12 || 12; // Adjust hours
        }
        return time.join(''); // return adjusted time or original string
    }, // http://stackoverflow.com/questions/13898423/javascript-convert-24-hour-time-of-day-string-to-12-hour-time-with-am-pm-and-no
    exportICS: function(_) {
        var termId = this.termId;
        var events = _.state.events[termId];
        var single;
        var startDate, endDate, startTime, endTime;
        if (typeof events === 'undefined') return;
        var cal = ics();

        /*
            TODO: This section of the code looks an awful like helper.compact()
        */

        var courses = [], sections = [];
        for (var i = 0, length = events.length; i < length; i++) {
            if (typeof events[i].section !== 'undefined') {
                for (var j = 0, locts = events[i].section.loct, length1 = locts.length; j < length1; j++) {
                    sections.push(events[i].course.num + '-' + events[i].section.num);
                }
            }else{
                for (var j = 0, locts = events[i].course.loct, length1 = locts.length; j < length1; j++) {
                    courses.push(events[i].course.num + '-');
                }
            }
        }

        courses = courses.filter(function(e, i, c) {
            return c.indexOf(e) === i;
        });

        sections = sections.filter(function(e, i, c) {
            return c.indexOf(e) === i;
        });

        var split = [], course, courseInfo;

        for (var i = 0, length = courses.length; i < length; i++) {
            split = courses[i].split('-');
            course = _.state.flatCourses[termId][split[0]];
            courseInfo = _.state.courseInfo[termId][split[0]];
            endDate = courseInfo.md.end;

            for (var j = 0, locts = course.loct, length1 = locts.length; j < length1; j++) {
                startDate = helper.determineActualStartDate(courseInfo.md.start, locts[j].t.day);
                startTime = locts[j].t.time.start;
                endTime = locts[j].t.time.end;
                cal.addEvent(course.c + ' - ' + courseInfo.ty, course.n, locts[j].loc, [startDate, startTime].join(' '), [startDate, endTime].join(' '), {
                    freq: 'WEEKLY',
                    until: endDate,
                    interval: 1,
                    byday: helper.long2short(locts[j].t.day)
                })
            }
        }

        for (var i = 0, length = sections.length; i < length; i++) {
            split = sections[i].split('-');
            course = _.state.flatCourses[termId][split[0]];
            courseInfo = _.state.courseInfo[termId][split[0]];
            endDate = courseInfo.md.end;

            for (var j = 0, sec = courseInfo.sec, length1 = sec.length; j < length1; j++) {
                if (sec[j].num != split[1]) continue;
                for (var k = 0, locts = sec[j].loct, length2 = locts.length; k < length2; k++) {
                    startDate = helper.determineActualStartDate(courseInfo.md.start, locts[k].t.day);
                    startTime = locts[k].t.time.start;
                    endTime = locts[k].t.time.end;
                    cal.addEvent(course.c + ' - Section', course.n, locts[k].loc, [startDate, startTime].join(' '), [startDate, endTime].join(' '), {
                        freq: 'WEEKLY',
                        until: endDate,
                        interval: 1,
                        byday: helper.long2short(locts[k].t.day)
                    })
                }
            }
        }

        cal.download('Schedule for ' + _.state.termName);
    }
}
