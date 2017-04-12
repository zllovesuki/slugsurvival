var self = module.exports = {

    delta: function(termCode) {
        switch (termCode[termCode.length - 1]) {
            case '0': // Winter
            return {
                deadline: 21,
                enrollment: 63 // use the upper bound
            };

            case '2': // Spring
            return {
                deadline: 18,
                enrollment: 35 // use the upper bound
            };

            case '8': // Fall
            return {
                deadline: 20,
                enrollment: 129
            };

            case '4': // Summer
            return {
                deadline: 7,
                enrollment: 0
            };
        }
    },

    summerDecipher: function(l) {
        switch (l) {
            case '5S1':
            return 'Session 1 (5 weeks)';
            break;
            case '5S2':
            return 'Session 2 (5 weeks)';
            break;
            case 'S8W':
            return '8-week Session';
            break;
            case 'S10':
            return '10-week Session';
            break;
            case 'ED1':
            case 'ED2':
            return 'Education Masters';
            break;
            default:
            return null;
            break;
        }
    },

    quarterToNum: function(quarter) {
        switch (quarter.toLowerCase()) {
            case 'fall':
            return '8';
            break;
            case 'winter':
            return '0';
            break;
            case 'spring':
            return '2';
            break;
            case 'summer':
            return '4';
            break;
            default:
            return null;
            break;
        }
    },

    calculateTermName: function(termCode) {
        termCode = termCode % 2000;
        termCode = self.pad(termCode, 3, 0);
        var quarter = '';
        var name = '';
        switch (termCode[termCode.length - 1]) {
            case '0': // Winter

            quarter = 'Winter';

            break;

            case '2': // Spring

            quarter = 'Spring';

            break;

            case '8': // Fall

            quarter = 'Fall';

            break;

            case '4': // Summer

            quarter = 'Summer';

            break;
        }
        var year = '20' + termCode.substring(0, 2);
        name = year + ' ' + quarter + ' Quarter';
        return name;
    },

    getYears: function(flatTermsList) {
        var tmp;
        var years = {};
        flatTermsList.forEach(function(term) {
            tmp = '20' + self.pad((term.code % 2000).toString().slice(0, -1), 2, 0);
            if (typeof years[tmp] === 'undefined') {
                years[tmp] = null;
            }
        })
        return Object.keys(years)
    },

    normalizeYears: function(allYears, quarterYears) {
        /*
            we will normalize the years, for example, allYears contains all the years (2004-2017) in an array
            and quarter years is an object of where the value is the number of classes offered in that quarter year
            the normalized obj will have either 1(true) or 0(false) to signify if it was offered or not
        */
        var normalized = {};
        var qYears = Object.keys(quarterYears);
        for (var i = 0, length = allYears.length; i < length; i++) {
            if (typeof normalized[allYears[i]] === 'undefined') normalized[allYears[i]] = 0;
            if (qYears.indexOf(allYears[i]) !== -1) normalized[allYears[i]] += quarterYears[allYears[i]];
        }
        var normalizedLargest = Object.keys(normalized).reduce(function(x,y){
            return (x > y) ? x : y;
        });
        var quarterYearLargest = qYears.reduce(function(x,y){
            return (x > y) ? x : y;
        });
        if (normalizedLargest != quarterYearLargest) {
            // account for quarter mismatch, where winter is jump to 2017, and skewing the results for other quarters
            // though it could introduce errors. we will see when we test this
            delete normalized[normalizedLargest];
        }
        return normalized;
    },

    windowFrequency: function(flatTermsList, historicData, windowSize) {

        var windowAlpha = 1 / windowSize;

        var allYears = self.getYears(flatTermsList);
        var normalized = {};
        var years = [];

        var Window = [];
        var period = 0;
        var frequency = 0;

        var threshold = {};
        var sum = 0;

        var result = {};

        var predictions = {
            fall: [],
            winter: [],
            spring: [],
            summer: []
        };

        for (var quarter in historicData){
            for (var code in historicData[quarter]) {
                if (typeof result[code] === 'undefined') {
                    result[code] = {
                        spring: 0,
                        summer: 0,
                        fall: 0,
                        winter: 0
                    }
                    threshold[code] = {
                        spring: 0,
                        summer: 0,
                        fall: 0,
                        winter: 0
                    }
                }
                normalized = self.normalizeYears(allYears, historicData[quarter][code]);
                // Warning, inefficient code ahead.
                years = Object.keys(normalized).sort(function(a, b) { return b-a; });

                threshold[code][quarter] = ((1 / windowSize) * windowAlpha).toPrecision(2)

                for (;; period++) {
                    Window = years.slice( period, period + windowSize );
                    if (Window.length < windowSize) break;

                    frequency = Window.reduce(function(total, year) {
                        return normalized[year] > 0 ? total + normalized[year] : total;
                    }, 0) / windowSize;

                    sum += frequency * Math.pow(1 - windowAlpha, period);
                }

                result[code][quarter] = (windowAlpha * sum).toPrecision(2)

                period = 0;
                sum = 0;
            }
        }

        Object.keys(result).forEach(function(code) {
            //console.log(code);
            Object.keys(result[code]).forEach(function(quarter) {
                //console.log(quarter, result[code][quarter], threshold[code][quarter], (result[code][quarter] > 0 && result[code][quarter] >= threshold[code][quarter]))
                if (result[code][quarter] > 0 && result[code][quarter] >= threshold[code][quarter]) {
                    predictions[quarter].push(code);
                }
            })
            //console.log('---')
            //console.log('')
        })
        return predictions;
    },

    pad: function(n, width, z) {
        z = z || '0';
        n = n + '';
        return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
    }, // http://stackoverflow.com/questions/10073699/pad-a-number-with-leading-zeros-in-javascript

    getMaterialsLink: function(termId, course) {
        var url = 'http://ucsc.verbacompare.com/comparison?id='; // SSI16__BME__185__01
        var id = '';
        switch (termId[termId.length - 1]) {
            case '0': // Winter
            id = 'WT';
            break;
            case '2': // Spring
            id = 'SP';
            break;
            case '8': // Fall
            id = 'FL';
            break;
            case '4': // Summer
            if (course.l) {
                if (course.l == '5S2') id = 'SSII';
                else id = 'SSI'
            }else{
                return false;
            }
            break;
        }
        // SSI
        id += (termId % 2000).toString().substring(0, 2);
        // SSI16
        id += '__';
        // SSI16__
        id += course.c.split(' ').filter(Boolean)[0];
        // SSI16__BME
        id += '__'
        // SSI16_BME__
        var nbr = course.c.split(' ').filter(Boolean)[1];
        if (parseInt(nbr).toString().length !== nbr.length) {
            // Probably something like 10A
            id += self.pad(parseInt(nbr), 3, 0) + nbr.slice(-1);
        }else{
            id += self.pad(nbr, 3, 0)
        }
        // SSI16__BME_185
        id += '__'
        // SSI16__BME_185__
        id += course.s;
        // SSI16__BME__185__01
        return url + id;
    },

    naturalSorter: function(as, bs){
        var a, b, a1, b1, i= 0, n, L,
        rx=/(\.\d+)|(\d+(\.\d+)?)|([^\d.]+)|(\.\D+)|(\.$)/g;
        if(as=== bs) return 0;
        a= as.toLowerCase().match(rx);
        b= bs.toLowerCase().match(rx);
        L= a.length;
        while(i<L){
            if(!b[i]) return 1;
            a1= a[i],
            b1= b[i++];
            if(a1!== b1){
                n= a1-b1;
                if(!isNaN(n)) return n;
                return a1>b1? 1:-1;
            }
        }
        return b[i]? -1:0;
    }, // http://stackoverflow.com/questions/2802341/javascript-natural-sort-of-alphanumerical-strings
    generateCourseObjectFromExtra: function(courseNum, extra){
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
    generateCourseInfoObjectFromExtra: function(courseNum, extra){
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

    tConvert: function(time) {
        // Check correct time format and split into components
        time = time.toString().match(/^([01]\d|2[0-3])(:)([0-5]\d)(:[0-5]\d)?$/) || [time];

        if (time.length > 1) { // If time format correct
            time = time.slice(1); // Remove full string match value
            time[5] = +time[0] < 12 ? 'AM' : 'PM'; // Set AM/PM
            time[0] = +time[0] % 12 || 12; // Adjust hours
            time[0] = time[0] < 10 ? '0' + time[0] : time[0]
        }
        var string = time.join(''); // return adjusted time or original string
        if (string === '12:00AM') return 'Tentative';
        else return string;
    }, // http://stackoverflow.com/questions/13898423/javascript-convert-24-hour-time-of-day-string-to-12-hour-time-with-am-pm-and-no

    tConvertToEpoch: function(dateMap, locts) {
        var epochTimes = [];
        for (var j = 0, length = locts.length; j < length; j++) {
            if (!locts[j].t) continue;
            for (var m = 0, days = locts[j].t.day, length1 = days.length; m < length1; m++) {
                epochTimes.push({
                    start: (new Date(dateMap[days[m]] + ' ' + locts[j].t.time.start).valueOf() / 1000),
                    end: (new Date(dateMap[days[m]] + ' ' + locts[j].t.time.end).valueOf() / 1000)
                })
            }
        }
        return epochTimes;
    },

    removeDuplicateTimes: function(array) {
        var newArray = [];
        var hash = {};

        for (var key in array) {
            hash[[array[key].start, array[key].end].join('-')] = array[key];
        }

        for (key in hash) {
            newArray.push(hash[key]);
        }

        return newArray;
    },

    checkForConflict: function(dateMap, events, course) {
        /*
            Instead of doing some ugly loops and intersects and shits, why don't we just compare the epoch time?

            It is an absolute unit of times (well, in a sense)

            Therefore, it is *much* more efficient to compare epoch times.

            Of course, the inefficiencies still lie with the for loop to check each loct at the end
        */
        var comingTime = [];
        var checker = {};
        var conflict = false;
        if (typeof events === 'undefined') return false;

        for (var i = 0, length = events.length; i < length; i++) {
            // You can't take the same class twice in a quarter
            // At least you shouldn't
            if (events[i].course.c === course.c && course.custom !== true) {
                conflict = course.c;
                break;
            }
            if (events[i].allDay
                || events[i].awaitSelection
                || events[i].sectionNum === null) continue;

            if (typeof events[i].section !== 'undefined' && events[i].section !== null) {

                if (typeof checker[events[i].course.c + ' Section'] === 'undefined') checker[events[i].course.c + ' Section'] = [];

                checker[events[i].course.c + ' Section'] = checker[events[i].course.c + ' Section'].concat(self.tConvertToEpoch(dateMap, events[i].section.loct));

            } else {

                if (typeof checker[events[i].course.c] === 'undefined') checker[events[i].course.c] = []

                checker[events[i].course.c] = checker[events[i].course.c].concat(self.tConvertToEpoch(dateMap, events[i].course.loct));

            }
        }

        if (conflict !== false) return null;

        if (course.loct.length === 1 && !!!course.loct[0].t) {
            // TBA
            return false;
        }

        // the side effect of using .concat() in the above loop is that time slots will have duplicates
        // (because in customize events, you can have duplicate names, and they won't be "taking the same class twice")
        for (var code in checker) {
            checker[code] = self.removeDuplicateTimes(checker[code])
        }

        var oldStart, newStart, oldEnd, newEnd;

        comingTime = self.tConvertToEpoch(dateMap, course.loct);

        for (var j = 0, length = comingTime.length; j < length; j++) {
            newStart = comingTime[j].start;
            newEnd = comingTime[j].end;
            for (var code in checker) {
                for (var k = 0, c = checker[code], length1 = c.length; k < length1; k++) {
                    oldStart = c[k].start;
                    oldEnd = c[k].end;
                    if (self.checkTimeConflict(oldStart, oldEnd, newStart, newEnd)) {
                        return code;
                    }
                }
            }
        }

        return conflict;
    },

    checkTimeConflict: function(oldStart, oldEnd, newStart, newEnd) {
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

    findNextCourseNum: function(courses, currentNum) {
        if (typeof courses[currentNum] === 'undefined') {
            return currentNum;
        }
        return self.findNextCourseNum(courses, currentNum + 1);
    },

    iOS: function() {
        return true;
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

        tracker.coursesWithSections.forEach(function(courseNum) {
            array.push(courseNum + '-' + tracker.eventsWithSections[courseNum])
        });

        for (var courseNum in tracker.coursesWithoutSections) {
            if (tracker.coursesWithSections.indexOf(courseNum) === -1) {
                if (courseNum / 100000 >= 1) {
                    // we got a traitor!
                    array.push(courseNum + '-' + JSON.stringify(extra[courseNum]));
                }else{
                    array.push(courseNum);
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
            if (el == 'Saturday') return 'SA';
            if (el == 'Sunday') return 'SU';
        })
    },
    dayToNum: function(el) {
        if (el == 'Sunday') return 0
        if (el == 'Monday') return 1
        if (el == 'Tuesday') return 2
        if (el == 'Wednesday') return 3
        if (el == 'Thursday') return 4
        if (el == 'Friday') return 5
        if (el == 'Saturday') return 6
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
        if (!loct.t.day) return;
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
