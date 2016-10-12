var self = module.exports = {

    findNextCourseNum: function(courses, currentNum) {
        if (typeof courses[currentNum] === 'undefined') {
            return currentNum;
        }
        return self.findNextCourseNum(courses, currentNum + 1);
    },

    iOS: function() {
        var userAgent = window.navigator.userAgent;
        if (userAgent.match(/iPad/i) || userAgent.match(/iPhone/i)) {
            return true;
        }
        return false;
    }, // http://stackoverflow.com/questions/3007480/determine-if-user-navigated-from-mobile-safari

    intersect: function(a, b) {
        var t;
        if (b.length > a.length) t = b, b = a, a = t; // indexOf to loop over shorter
        return a
            .filter(function(e) {
                return b.indexOf(e) !== -1;
            })
            .filter(function(e, i, c) { // extra step to remove duplicates
                return c.indexOf(e) === i;
            });
    }, // http://stackoverflow.com/questions/16227197/compute-intersection-of-two-arrays-in-javascript

    compact: function(events) {
        var array = [];
        var tracker = {};
        var extra = {};
        tracker.coursesWithoutSections = {};
        tracker.eventsWithSections = {};
        events.forEach(function(event) {
            if (typeof event.sectionNum !== 'undefined' || event.section === null) {
                tracker.eventsWithSections[event.number] = event.sectionNum;
            }else{
                tracker.coursesWithoutSections[event.number] = true;
                if (event.number / 100000 >= 1) {
                    extra[event.number] = event.course;
                }
            }
        });
        tracker.coursesWithSections = [];
        tracker.coursesWithSections = self.intersect(Object.keys(tracker.eventsWithSections), Object.keys(tracker.coursesWithoutSections));

        tracker.coursesWithSections.forEach(function(courseNumber) {
            array.push(courseNumber + '-' + tracker.eventsWithSections[courseNumber])
        });

        for (var courseNumber in tracker.coursesWithoutSections) {
            if (tracker.coursesWithSections.indexOf(courseNumber) === -1) {
                if (courseNumber / 100000 >= 1) {
                    // we got a traitor!
                    array.push(courseNumber + '-' + JSON.stringify(extra[courseNumber]));
                }else{
                    array.push(courseNumber);
                }
            }
        }

        return array;
    },

    Base64: {
        _keyStr: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
        encode: function(e) {
            var t = "";
            var n, r, i, s, o, u, a;
            var f = 0;
            e = self.Base64._utf8_encode(e);
            while (f < e.length) {
                n = e.charCodeAt(f++);
                r = e.charCodeAt(f++);
                i = e.charCodeAt(f++);
                s = n >> 2;
                o = (n & 3) << 4 | r >> 4;
                u = (r & 15) << 2 | i >> 6;
                a = i & 63;
                if (isNaN(r)) {
                    u = a = 64
                } else if (isNaN(i)) {
                    a = 64
                }
                t = t + this._keyStr.charAt(s) + this._keyStr.charAt(o) + this._keyStr.charAt(u) + this._keyStr.charAt(a)
            }
            return t
        },
        decode: function(e) {
            var t = "";
            var n, r, i;
            var s, o, u, a;
            var f = 0;
            e = e.replace(/[^A-Za-z0-9+/=]/g, "");
            while (f < e.length) {
                s = this._keyStr.indexOf(e.charAt(f++));
                o = this._keyStr.indexOf(e.charAt(f++));
                u = this._keyStr.indexOf(e.charAt(f++));
                a = this._keyStr.indexOf(e.charAt(f++));
                n = s << 2 | o >> 4;
                r = (o & 15) << 4 | u >> 2;
                i = (u & 3) << 6 | a;
                t = t + String.fromCharCode(n);
                if (u != 64) {
                    t = t + String.fromCharCode(r)
                }
                if (a != 64) {
                    t = t + String.fromCharCode(i)
                }
            }
            t = self.Base64._utf8_decode(t);
            return t
        },
        _utf8_encode: function(e) {
            e = e.replace(/rn/g, "n");
            var t = "";
            for (var n = 0; n < e.length; n++) {
                var r = e.charCodeAt(n);
                if (r < 128) {
                    t += String.fromCharCode(r)
                } else if (r > 127 && r < 2048) {
                    t += String.fromCharCode(r >> 6 | 192);
                    t += String.fromCharCode(r & 63 | 128)
                } else {
                    t += String.fromCharCode(r >> 12 | 224);
                    t += String.fromCharCode(r >> 6 & 63 | 128);
                    t += String.fromCharCode(r & 63 | 128)
                }
            }
            return t
        },
        _utf8_decode: function(e) {
            var t = "";
            var n = 0;
            var r = c1 = c2 = 0;
            while (n < e.length) {
                r = e.charCodeAt(n);
                if (r < 128) {
                    t += String.fromCharCode(r);
                    n++
                } else if (r > 191 && r < 224) {
                    c2 = e.charCodeAt(n + 1);
                    t += String.fromCharCode((r & 31) << 6 | c2 & 63);
                    n += 2
                } else {
                    c2 = e.charCodeAt(n + 1);
                    c3 = e.charCodeAt(n + 2);
                    t += String.fromCharCode((r & 15) << 12 | (c2 & 63) << 6 | c3 & 63);
                    n += 3
                }
            }
            return t
        }
    },
    long2short: function(array) {
        return array.map(function(el) {
            if (el == 'Monday') return 'MO';
            if (el == 'Tuesday') return 'TU';
            if (el == 'Wednesday') return 'WE';
            if (el == 'Thursday') return 'TH';
            if (el == 'Friday') return 'FR';
            return 'SA';
        })
    },
    dayToNum: function(el) {
        if (el == 'Monday') return 1
        if (el == 'Tuesday') return 2
        if (el == 'Wednesday') return 3
        if (el == 'Thursday') return 4
        if (el == 'Friday') return 5
    },
    formattedDate: function(date) {
        var d = new Date(date || Date.now()),
            month = '' + (d.getMonth() + 1),
            day = '' + d.getDate(),
            year = d.getFullYear();

        if (month.length < 2) month = '0' + month;
        if (day.length < 2) day = '0' + day;

        return [month, day, year].join('/');
    }, // http://stackoverflow.com/questions/13459866/javascript-change-date-into-format-of-dd-mm-yyyy
    determineActualStartDate: function(termStartDate, courseMeetingDays) {
        var _tmp = new Date(termStartDate);
        var day = _tmp.getDay();
        /*
        SU  MO  TU   W  TH  FR  SA
         0   1   2   3   4   5   6

        if the termStartDate is less than one of the meeting day, that means they meet next week

        say, 09/22/2016 is the term starting date, and ECON 111A meets Tuesday and Thursday
        09/22/2016 is Thursday, so ECON 111A only has class on Thursday on the first week

        but for LIT 61R, the meeting days are Monday and Wedsnesday
        since both of them are *before* Thursday, then they start next week
        */
        var days = courseMeetingDays.map(self.dayToNum);
        var startingDate = new Date(termStartDate);
        var thisWeek = 0;
        var total = days.length;
        for (var i = 0; i < total; i++) {
            if (days[i] >= day) thisWeek++;
        }
        for (var i = 0; i < total; i++) {
            if (thisWeek === 0 && days[i] < day) {
                startingDate.setDate(startingDate.getDate() + (7 - day + days[i]));
                break;
            }
            if (thisWeek > 0 && days[i] >= day) {
                startingDate.setDate(startingDate.getDate() + (days[i] - day));
                break;
            }
        }

        return self.formattedDate(startingDate)
    },
    addCal: function(cal, termDates, course, type, loct) {
        var startDate = self.determineActualStartDate(termDates.start, loct.t.day);
        var endDate = termDates.end;
        var startTime = loct.t.time.start;
        var endTime = loct.t.time.end;
        cal.addEvent(course.c + ' - ' + type, course.n, loct.loc, [startDate, startTime].join(' '), [startDate, endTime].join(' '), {
            freq: 'WEEKLY',
            until: endDate,
            interval: 1,
            byday: self.long2short(loct.t.day)
        })
    }
}
