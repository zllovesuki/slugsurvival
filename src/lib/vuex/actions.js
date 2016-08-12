var helper = require('./helper'),
    storage = require('./plugins/storage');

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
        var promises = []
        if (_.state.flatTermsList.length === 0) {
            promises.push(this.fetchTerms());
        }
        if (Object.keys(_.state.instructorNameToTidMapping).length === 0) {
            promises.push(this.fetchInstructorNameToTidMapping());
        }
        return Promise.all(promises);
    },
    fetchTerms: function(_) {
        return fetch('/db/terms.json')
            .then(function(res) {
                return res.json();
            })
            .then(function(data) {
                _.dispatch('saveTermsList', data);
                return data;
            })
    },
    fetchInstructorNameToTidMapping: function(_) {
        return fetch('/db/rmp.json')
            .then(function(res) {
                return res.json();
            })
            .then(function(data) {
                _.dispatch('saveInstructorNameToTidMapping', data);
                return data;
            })
    },
    fetchThreeStatsByTid: function(_, tid) {
        if (typeof _.state.instructorStats[tid] !== 'undefined') {
            return Promise.resolve(_.state.instructorStats[tid]);
        }
        return Promise.all([
            fetch('/db/rmp/ratings/' + tid + '.json'),
            fetch('/db/rmp/scores/' + tid + '.json'),
            fetch('/db/rmp/stats/' + tid + '.json')
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
    loadFromLocal: function(_) {
        var online;
        var termId = this.termId;
        var workaround = this.iOS();
        var self = this;
        var loadOnlineTimestamp = function() {
            return Promise.all([
                fetch('/db/timestamp/terms/' + termId + '.json'),
                fetch('/db/timestamp/courses/' + termId + '.json'),
                fetch('/db/timestamp/index/' + termId + '.json')
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
                workaround ? null : (!invalid.index ? storage.getItem('termIndex-' + termId) : null),
                storage.getItem(termId)
            ]).spread(function(coursesData, courseInfo, index, events) {
                return self.dispatchSave(coursesData, courseInfo, index, events, true);
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
    loadFromOnline: function(_, invalid) {
        var termId = this.termId;
        var workaround = this.iOS();
        var self = this;
        return Promise.all([
            invalid.coursesData ? fetch('/db/terms/' + termId + '.json') : null,
            invalid.courseInfo ? fetch('/db/courses/' + termId + '.json') : null,
            workaround ? null : (invalid.index ? fetch('/db/index/' + termId + '.json') : null),
            storage.getItem(termId)
        ])
        .spread(function(courseDataRes, courseInfoRes, indexRes, events){
            return Promise.all([
                invalid.coursesData ? courseDataRes.json() : null,
                invalid.courseInfo ? courseInfoRes.json() : null,
                workaround ? null : (invalid.index ? indexRes.json() : null),
                events
            ])
        })
        .spread(function(coursesData, courseInfo, index, events) {
            return self.dispatchSave(coursesData, courseInfo, index, events, false);
        })
    },
    dispatchSave: function(_, coursesData, courseInfo, index, events, skipSaving) {
        var termId = this.termId;
        var workaround = this.iOS();
        if (coursesData !== null) _.dispatch('saveTermCourses', termId, coursesData, skipSaving);
        if (courseInfo !== null) _.dispatch('saveCourseInfo', termId, courseInfo, skipSaving);
        if (workaround || index !== null) _.dispatch('buildIndexedSearch', termId, index, workaround, skipSaving);
        if (events !== null) _.dispatch('restoreEventSourceSnapshot', termId, events)
    },
    fetchTermCourses: function(_) {
        var termId = this.termId;
        _.dispatch('setTermName', _.state.termsList[termId])
        if (typeof _.state.flatCourses[termId] === 'undefined') {
            return this.loadFromLocal()
            .catch(function(invalid) {
                if (invalid.yes) return this.loadFromOnline(invalid)
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
    decodeHash: function(_) {
        var termId = this.termId;
        return new Promise(function(resolve) {
            return storage.getItem(termId).then(function(events) {
                if (!!events) return resolve();
                try {
                    console.log('restoring events from hash')
                    var hash = window.location.hash.substring(1);
                    var array = JSON.parse(helper.Base64.decode(hash));
                    if (typeof array.forEach !== 'undefined') {
                        var split;
                        var course;
                        array.forEach(function(obj) {
                            obj = obj + '';
                            split = obj.split('-')
                            if (typeof split[1] !== 'undefined') {
                                if (split[1] == 'null') split[1] = null;
                                this._pushSectionToEventSource(split[0], split[1], false, true)
                            }else{
                                course = _.state.flatCourses[termId][split[0]];
                                this.pushToEventSource(course, false, false, true)
                            }
                        }.bind(this))
                        var html = '';
                        html += ['<p>', 'Looks like you are accessing your planner via a bookmark link! We have the planner for you!', '</p>'].join('');
                        html += ['<p>', 'However, if you makes changes to your calendar, please do not use the old link.', '</p>'].join('');
                        html += ['<p>', 'Instead, use the new bookmark link.', '</p>'].join('');
                        this.alert()
                        .okBtn('OK')
                        .alert(html)
                    }
                    return resolve();
                }catch(e) {
                    console.log(e);
                    return resolve();
                }
            }.bind(this))
        }.bind(this))
    },
    courseHasSections: function(_, courseNumber) {
        var termId = this.termId;
        return _.state.courseInfo[termId][courseNumber].sec.length > 0;
    },
    refreshCalendar: function(_) {
        $('#calendar-' + this.termId).fullCalendar('refetchEvents')
    },
    returnEventSourceSnapshot: function(_) {
        var termId = this.termId;
        return _.state.events[termId]
    },
    pushToEventSource: function(_, course, edit, changed, privateMethod) {
        var termId = this.termId;
        var courseInfo = _.state.courseInfo[termId][course.num];
        var code;
        var obj = {};
        if (!!!course.t) {
            // TBA will be in the allDaySlot
            obj.title = [course.c + ' - ' + course.s, courseInfo.ty, course.n].join("\n");
            obj.number = course.num;
            obj.allDay = true;
            obj.start = _.state.dateMap['Monday'];
            obj.end = _.state.dateMap['Saturday'];
            obj.course = course;
            obj.color = 'green';
            _.dispatch('pushToEventSource', termId, obj);
            obj = {};
        } else {
            for (var i = 0, days = course.t.day, length = days.length; i < length; i++) {
                obj.title = [course.c + ' - ' + course.s, courseInfo.ty, course.n].join("\n");
                obj.number = course.num;
                obj.allDay = false;
                obj.start = _.state.dateMap[days[i]] + ' ' + course.t.time.start;
                obj.end = _.state.dateMap[days[i]] + ' ' + course.t.time.end;
                obj.course = course;
                _.dispatch('pushToEventSource', termId, obj);
                obj = {};
            }
        }

        if (!!privateMethod) {
            return Promise.resolve();
        }

        this.refreshCalendar();
        if (!!edit && !!changed) {
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
    _pushSectionToEventSource: function(_, courseNumber, sectionNumber, edit, privateMethod) {
        var termId = this.termId;
        var courseInfo = _.state.courseInfo[termId][courseNumber];
        var courses = _.state.flatCourses[termId];
        var obj = {};
        var snapshot = [];
        var section = {};
        var code;

        var course = courses[courseNumber];

        if (edit) {
            // Let's check if user selects "Choose Later" again
            if (sectionNumber === null) {
                this.removeEmptySection(termId, course.num);
            }else{
                this.removeFromSource(termId, course.num);
            }
        }

        section = courseInfo.sec.filter(function(section) {
            return section.num == sectionNumber
        });
        section = section[0];
        snapshot = this.returnEventSourceSnapshot();

        if (typeof section !== 'undefined' && (code = this.checkForConflict(section)) !== false) {
            this.alert().error('Section ' + section.section + ' conflict with ' + code + '!')
            if (edit) _.dispatch('restoreEventSourceSnapshot', termId, snapshot);
            return Promise.resolve();
        }

        if (sectionNumber === null || !!!section.t) {
            // TBA will be in the allDaySlot
            obj.title = [course.c, 'Section', 'DIS - ' + (sectionNumber === null ? '?' : 'TBA')].join("\n");
            obj.number = course.num;
            obj.color = (sectionNumber === null ? 'black' : 'green');
            obj.course = course;
            obj.section = null;
            obj.start = _.state.dateMap['Monday'];
            obj.end = _.state.dateMap['Saturday'];
            _.dispatch('pushToEventSource', termId, obj);
        } else {
            for (var i = 0, days = section.t.day, length = days.length; i < length; i++) {
                obj.title = [course.c, 'Section', 'DIS - ' + section.sec].join("\n");
                obj.number = course.num;
                obj._number = sectionNumber;
                obj.color = 'grey';
                obj.course = course;
                obj.section = section;
                obj.start = _.state.dateMap[days[i]] + ' ' + section.t.time.start;
                obj.end = _.state.dateMap[days[i]] + ' ' + section.t.time.end;
                _.dispatch('pushToEventSource', termId, obj);
                obj = {};
            }
        }

        this.pushToEventSource(course, edit, sectionNumber === null ? false : true, privateMethod);

        if (!!privateMethod) {
            return Promise.resolve();
        }

        this.refreshCalendar();
        $('.alertify').remove();
        return Promise.resolve();
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
        var termId = this.termId;
        var events =  _.state.events[termId];
        var intersectDays = [];
        var existingDays = [];
        var existingTimes = {};
        var comingTime = {};
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
                existingDays.push(events[i].section.t.day);
            } else {
                existingDays.push(events[i].course.t.day);
            }
        }
        if (conflict !== false) return null;
        if (!!!course.t) {
            // TBA
            return false;
        }

        for (var i = 0, length = existingDays.length; i < length; i++) {
            if (helper.intersect(existingDays[i], course.t.day)) {
                intersectDays.push(course.t.day);
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
            for (var j = 0, events = _.state.events[termId], eLength = events.length; j < eLength; j++) {
                if (events[j].allDay) continue;
                if (typeof events[j].section !== 'undefined' && events[j].section !== null) {
                    if (events[j].section.t.day.indexOf(intersectDays[i]) !== -1) {
                        existingTimes[events[j].course.c + ' Section'] = events[j].section.t.time;
                    }
                } else {
                    if (events[j].course.t.day.indexOf(intersectDays[i]) !== -1) {
                        existingTimes[events[j].course.c] = events[j].course.t.time;
                    }
                }
            }
        }

        comingTime = course.t.time;
        var oldStart, newStart, oldEnd, newEnd;
        for (var code in existingTimes) {
            oldStart = existingTimes[code].start.replace(':', '');
            oldEnd = existingTimes[code].end.replace(':', '');
            newStart = comingTime.start.replace(':', '');
            newEnd = comingTime.end.replace(':', '');

            if (this.checkTimeConflict(oldStart, oldEnd, newStart, newEnd)) {
                conflict = code;
                break;
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
    } // http://stackoverflow.com/questions/13898423/javascript-convert-24-hour-time-of-day-string-to-12-hour-time-with-am-pm-and-no
}
