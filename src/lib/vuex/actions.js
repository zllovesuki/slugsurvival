var helper = require('./helper'),
    storage = require('./plugins/storage'),
    config = require('../../../config')

var self = module.exports = {
    helper: function(_) {
        return helper;
    },
    alert: function(_) {
        return _.state.alert;
    },
    setTitle: function(_, title) {
        _.dispatch('setTitle', title)
    },
    comingSoon: function(_) {
        this.alert().okBtn('OK').alert('Coming soon')
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
    loadAutosave: function(_, termId, alert) {
        termId = termId || this.termId;
        alert = (typeof alert === 'undefined' ? true : alert);
        return storage.getItem(termId).then(function(array) {
            if (array !== null) {
                var events = this.parseFromCompact(termId, array);
                _.dispatch('restoreEventSourceSnapshot', termId, events);
                if (alert) this.alert().okBtn('Cool!').alert('<p>We found a planner saved in your browser!</p>')
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
    loadCourseDataFromLocal: function(_, termId) {
        var online;
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
                return self.dispatchSaveCourseData(coursesData, courseInfo, index, true, termId);
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
    loadCourseDataFromOnline: function(_, invalid, termId) {
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
            return self.dispatchSaveCourseData(coursesData, courseInfo, index, false, termId);
        })
    },
    dispatchSaveCourseData: function(_, coursesData, courseInfo, index, skipSaving, termId) {
        var workaround = this.iOS();
        if (coursesData !== null) _.dispatch('saveTermCourses', termId, coursesData, skipSaving);
        if (courseInfo !== null) _.dispatch('saveCourseInfo', termId, courseInfo, skipSaving);
        if (workaround || index !== null) _.dispatch('buildIndexedSearch', termId, index, workaround, skipSaving);
    },
    fetchTermCourses: function(_, termId) {
        termId =  termId || this.termId;
        _.dispatch('setTermName', _.state.termsList[termId])
        if (typeof _.state.flatCourses[termId] === 'undefined') {
            return this.loadCourseDataFromLocal(termId)
            .catch(function(invalid) {
                if (invalid.yes) {
                    return this.loadCourseDataFromOnline(invalid, termId)
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
    parseFromCompact: function(_, termId, array) {
        var events = [];
        var index, split = [], courseNum, course, courseInfo;
        array.forEach(function(obj) {
            obj = obj + '';
            index = obj.indexOf('-');
            if (index === -1) {
                split[0] = obj;
                delete split[1];
            }else{
                split[0] = obj.substring(0, index);
                split[1] = obj.substring(index + 1);
            }
            if (split[0] / 100000 >= 1) {
                /*
                we found a traitor!

                be careful here, we don't want to override any localized course num,
                so we are going to reassign course number for the customize events
                */
                courseNum = this.findNextCourseNum(termId, 100000);
                course = JSON.parse(split[1]);
                courseInfo = this.generateCourseInfoObjectFromExtra(termId, courseNum, {});
                this.populateLocalEntriesWithExtra(termId, courseNum, course, courseInfo);
            }
            if (typeof split[1] !== 'undefined' && split[0] / 100000 < 1) {
                if (split[1] == 'null') split[1] = null;
                events = events.concat(this.getEventObjectsByCourse(termId, split[0], split[1]))
            }else{
                events = events.concat(this.getEventObjectsByCourse(termId, split[0]));
            }
        }.bind(this));

        return events;
    },
    decodeHash: function(_) {
        var termId = this.termId;
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

                var events = this.parseFromCompact(termId, array);

                _.dispatch('restoreEventSourceSnapshot', termId, events);

                var html = '';
                html += ['<p>', 'Looks like you are accessing the planner via a bookmark link! We have the planner for you!', '</p>'].join('');
                html += ['<p>', 'However, you will <b>not</b> be able to make changes if you are viewing the planner via a bookmark link.', '</p>'].join('');

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
    courseHasSections: function(_, termId, courseNumber) {
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
    emptyEventSource: function(_, termId) {
        _.dispatch('emptyEventSource', termId);
    },
    getEventObjectsByCourse: function(_, termId, input1, input2) {
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
                    obj.title = [(typeof course.s === 'undefined' ? course.c : course.c + ' - ' + course.s), courseInfo.ty, course.n].join("\n");
                    obj.number = course.num;
                    obj.allDay = false;
                    obj.start = dateMap[days[i]] + ' ' + locts[j].t.time.start;
                    obj.end = dateMap[days[i]] + ' ' + locts[j].t.time.end;
                    obj.course = course;
                    if (course.custom) obj.color = '#7D1347';
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

        events = this.getEventObjectsByCourse(termId, course);
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

        events = this.getEventObjectsByCourse(termId, courseNumber, sectionNumber);
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
    tConvertToEpoch: function(_, locts) {
        var epochTimes = [];
        for (var j = 0, length = locts.length; j < length; j++) {
            if (!locts[j].t) continue;
            for (var m = 0, days = locts[j].t.day, length1 = days.length; m < length1; m++) {
                epochTimes.push({
                    start: (new Date(_.state.dateMap[days[m]] + ' ' + locts[j].t.time.start).valueOf() / 1000),
                    end: (new Date(_.state.dateMap[days[m]] + ' ' + locts[j].t.time.end).valueOf() / 1000)
                })
            }
        }
        return epochTimes;
    },
    checkForConflict: function(_, course) {
        /*
            Instead of doing some ugly loops and intersects and shits, why don't we just compare the epoch time?

            It is an absolute unit of times (well, in a sense)

            Therefore, it is *much* more efficient to compare epoch times.

            Of course, the inefficiencies still lie with the for loop to check each loct at the end
        */
        var termId = this.termId;
        var events =  _.state.events[termId];
        var comingTime = [];
        var checker = {};
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

                if (typeof checker[events[i].course.c + ' Section'] !== 'undefined') continue;

                checker[events[i].course.c + ' Section'] = this.tConvertToEpoch(events[i].section.loct);

            } else {

                if (typeof checker[events[i].course.c] !== 'undefined') continue;

                checker[events[i].course.c] = this.tConvertToEpoch(events[i].course.loct);

            }
        }

        if (conflict !== false) return null;

        if (course.loct.length === 1 && !!!course.loct[0].t) {
            // TBA
            return false;
        }

        var oldStart, newStart, oldEnd, newEnd;

        comingTime = this.tConvertToEpoch(course.loct);

        for (var j = 0, length = comingTime.length; j < length; j++) {
            newStart = comingTime[j].start;
            newEnd = comingTime[j].end;
            for (var code in checker) {
                for (var k = 0, c = checker[code], length1 = c.length; k < length1; k++) {
                    oldStart = c[k].start;
                    oldEnd = c[k].end;
                    if (this.checkTimeConflict(oldStart, oldEnd, newStart, newEnd)) {
                        return code;
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
                if (split[1]) {
                    for (var k = 0, sec = courseInfo.sec, length2 = sec.length; k < length2; k++) {
                        if (sec[k].num != split[1]) continue;
                        for (var m = 0, secLocts = sec[k].loct, length3 = secLocts.length; m < length3; m++) {
                            helper.addCal(cal, termDates, course, 'Section', secLocts[m]);
                        }
                    }
                }
            }
        }

        cal.download('Schedule for ' + _.state.termName);
    },
    fetchRealTimeEnrollment: function(_, termCode, courseNum) {
        return fetch(config.trackingURL + '/fetch/' + termCode + '/' + courseNum)
        .then(function(res) {
            return res.json();
        })
        .catch(function(e) {
            return {ok: false}
        })
    },
    _showRealTimeEnrollment: function(_, termCode, courseNum) {
        this.loading.go(30);
        var html = '';
        var template = function(key, value) {
            return ['<p>', '<span class="muted h6">', key, ': </span><b class="h5">', value, '</b>', '</p>'].join('');
        }
        this.fetchRealTimeEnrollment(termCode, courseNum)
        .then(function(res) {
            this.loading.go(70);
            if (res.ok && res.results[0] && res.results[0].seats) {
                var latest = res.results[0];
                var seat = latest.seats;

                html += template('Status', seat.status);
                html += template('Available', seat.avail);
                html += template('Enrolled', seat.enrolled);
                html += template('Capacity', seat.cap);
                html += '<hr />';
                html += template('Waitlisted', seat.waitTotal);
                html += template('Waitlist Cap.', seat.waitCap);
                html += '<p><span class="muted h6">Last Changed: ' + new Date(latest.date * 1000).toLocaleString() + '</span></p>';

                this.alert()
                .okBtn('Cool')
                .alert(html)
                .then(function(resolved) {
                    resolved.event.preventDefault();
                })
            }else{
                this.alert().error('Cannot fetch real time data!')
            }
            this.loading.go(100);
        }.bind(this))
    },
    getCourseDom: function(_, termId, course, isSection) {
        // TODO: Reduce special cases
        isSection = isSection || false;
        if (!isSection) {
            var courseHasSections = this.courseHasSections(termId, course.num);
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
            html += template('Course Number', course.num);
            html += template(course.c, courseHasSections ? 'has sections': 'has NO sections');
            html += template('Instructor(s)', course.ins.d.join(', ') + (!!!course.ins.f ? '' : '&nbsp;<sup class="muted clickable rainbow" onclick="window.App._showInstructorRMP(\'' + course.ins.f.replace(/'/g, '\\\'') + '\', \'' + course.ins.l.replace(/'/g, '\\\'') + '\')">RateMyProfessors</sup>') );
        }

        if (course.loct.length === 1) {
            html += template('Location', !!!course.loct[0].loc ? 'TBA': course.loct[0].loc);
            html += template('Meeting Day', !!!course.loct[0].t ? 'TBA' : course.loct[0].t.day.join(', '));
            html += template('Meeting Time', !!!course.loct[0].t ? 'TBA' : this.tConvert(course.loct[0].t.time.start) + '-' + this.tConvert(course.loct[0].t.time.end));
        }else{
            html += '<hr />'
            var complex = '';
            for (var j = 0, locts = course.loct, length1 = locts.length; j < length1; j++) {
                html += template('Location', !!!course.loct[j].loc ? 'TBA': course.loct[j].loc);
                html += template('Meeting Day', !!!course.loct[j].t ? 'TBA' : course.loct[j].t.day.join(', '));
                html += template('Meeting Time', !!!course.loct[j].t ? 'TBA' : this.tConvert(course.loct[j].t.time.start) + '-' + this.tConvert(course.loct[j].t.time.end));
                html += '<hr />'
            }
        }

        if (!isSection && course.custom !== true) {
            html += template('Is It Open', '<span class="muted clickable rainbow" onclick="window.App._showRealTimeEnrollment(\'' + termId + '\', \'' + course.num + '\')">Check Real Time</span>');
        }

        return html;
    },
    updateWatch: function(_, recipient, code, courses) {
        var self = this;
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
                })
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
                return self.alert().error(res.message);
            }
        })
        .catch(function(e) {
            console.log(e);
            self.alert().error('An error has occurred.')
        })
    },
    findNextCourseNum: function(_, termId, currentNum) {
        if (typeof _.state.flatCourses[termId][currentNum] === 'undefined') {
            return currentNum;
        }
        return this.findNextCourseNum(termId, currentNum + 1);
    },
    generateCourseObjectFromExtra: function(_, termId, courseNum, extra){
        var course = {
            c: extra.title,
            n: extra.description,
            num: courseNum,
            loct: [],
            custom: true
        };
        var locObj = {
            loc: '',
            t: {
                day: [],
                time: {
                    start: '',
                    end: ''
                }
            }
        };
        locObj.loc = extra.location;
        locObj.t.time.start = extra.time.start;
        locObj.t.time.end = extra.time.end;
        if (extra.repeat.M) locObj.t.day.push('Monday');
        if (extra.repeat.Tu) locObj.t.day.push('Tuesday');
        if (extra.repeat.W) locObj.t.day.push('Wednesday');
        if (extra.repeat.Th) locObj.t.day.push('Thursday');
        if (extra.repeat.F) locObj.t.day.push('Friday');
        course.loct.push(locObj);
        return course;
    },
    generateCourseInfoObjectFromExtra: function(_, termId, courseNum, extra){
        var courseInfo = {
            ty: 'Other',
            cr: '0',
            ge: [],
            desc: '',
            re: null,
            com: [],
            sec: []
        };
        return courseInfo;
    },
    populateLocalEntriesWithExtra: function(_, termId, courseNum, course, courseInfo) {
        _.dispatch('appendCourse', termId, courseNum, course);
        _.dispatch('appendCourseInfo', termId, courseNum, courseInfo);
    },
    fetchGE: function(_) {
        return fetch(config.dbURL + '/ge.json')
        .then(function(res) {
            return res.json();
        })
    }
}
