<template>
    <div>
        <div class="overflow-hidden bg-white rounded mb2 clearfix">
            <div class="m0 p2" v-show="!ready">
                Loading...
            </div>
            <div class="m0 p2" v-show="ready">
                <div class="clearfix">
                    <div class="left">
                        <a class="btn btn-outline red h6" v-on:click="saveCalendarAsImage">
                            &#128190; image
                        </a>
                        <a class="btn btn-outline red h6 ml1" v-on:click="saveCalendarAsICS">
                            &#128190; calendar
                        </a>
                    </div>
                    <div class="right">
                        <a class="btn btn-outline h6 m0 {{ color }}" v-on:click.prevent.stop="showSearchModal">
                            search anything
                        </a>
                    </div>
                </div>
            </div>
        </div>
        <div id="calendar-container" class="overflow-hidden bg-white rounded mb2 clearfix h5" v-show="ready">
            <div class="m0 p2">
                <div id="calendar-{{ termId }}"></div>
            </div>
        </div>
        <div class="overflow-hidden bg-white rounded mb2 clearfix">
            <div class="m0 p2">
                <div class="clearfix">
                    <div class="right">
                        <a class="btn h6 mxn1 {{ color }}">
                            Color code:
                        </a>
                        <a class="btn btn-outline white h6" style="background-color: #008000">
                            TBA
                        </a>
                        <a class="btn btn-outline white h6" style="background-color: #6aa4c1">
                            Class
                        </a>
                        <a class="btn btn-outline white h6" style="background-color: #9f9f9f">
                            Section
                        </a>
                    </div>
                </div>
            </div>
        </div>
        <div class="overflow-hidden bg-white rounded mb2 clearfix">
            <div class="m0 p2">
                <div class="clearfix">
                    <div class="right">
                        <a class="btn btn-outline green h6" @click="bookmark">
                            click here to bring your planner anywhere
                        </a>
                    </div>
                </div>
            </div>
        </div>
        <modal :show.sync="searchModal">
            <h4 slot="header">
                <input type="text" class="field block col-12 mb1 search-box" v-model="search.string" debounce="250" placeholder="ECON 197, Design, Mendes, etc...">
            </h4>
            <span slot="body">
                <ul class="list-reset">
                    <li class="overflow-hidden btn h5 block" v-on:click.prevent.stop="promptAddClass(result)" v-for="result in search.results" track-by="num">
                        {{ result.c }} - {{ result.s }}  - {{ result.n }}
                    </li>
                    <li v-show="search.string.length > 0 && search.results.length === 0">No results.</li>
                </ul>
            </span>
        </modal>
    </div>
</template>

<script>

var getters = require('../../lib/vuex/getters.js')
var actions = require('../../lib/vuex/actions.js')

module.exports = {
    vuex: {
        getters: getters,
        actions: actions
    },
    data: function() {
        return {
            ready: false,
            searchModal: false,
            search: {
                string: '',
                results: []
            }
        }
    },
    watch: {
        'search.string': function(val, oldVal) {
            if (val.length < 1) return;
            var self = this;
            var options = {
                fields: {
                    c: {
                        boost: 5
                    },
                    n: {
                        boost: 3
                    },
                    f: {
                        boost: 2
                    },
                    la: {
                        boost: 2
                    }
                }
            };
            val = val.split(/(\d+)/).filter(Boolean).map(function(el) { return el.trim(); }).join(" ");
            this.search.results = this.indexSearch[this.termId].search(val, options).map(function(result) {
                return self.flatCourses[self.termId][result.ref]
            });
        }
    },
    methods: {
        showSearchModal: function() {
            this.searchModal = true;
            this.search.string = '';
            this.search.results = [];
            setTimeout(function() {
                document.getElementsByClassName('search-box')[0].focus();
            }, 75);
        },
        getCourseDom: function(course, isSection) {
            // TODO: Reduce special cases
            var termId = this.route.params.termId;
            isSection = isSection || false;
            if (!isSection) {
                var courseHasSections = this.courseHasSections(course.num);
            }
            var html = '';
            var template = function(key, value) {
                return ['<p>', '<span class="muted h6">', key, ': </span><b class="h5">', value, '</b>', '</p>'].join('');
            }
            if (isSection) {
                html += template('Section', 'DIS - ' + course.sec);
                html += template('TA', course.ins);
            }else{
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

            if (!isSection) {
                html += template('Enrollment', '<span class="muted clickable rainbow" onclick="window.App._showRealTimeEnrollment(\'' + termId + '\', \'' + course.num + '\')">Check Real Time</span>');
            }

            return html;
        },
        promptToRemove: function(calEvent) {
            var termId = this.route.params.termId;
            this.alert()
            .okBtn("Yes")
            .cancelBtn("No")
            .confirm('Remove ' + calEvent.course.c + ' from calendar?')
            .then(function(resolved) {
                resolved.event.preventDefault();
                if (resolved.buttonClicked !== 'ok') return;
                this.removeFromSource(termId, calEvent.number);

                this.refreshCalendar();
                this.alert().success('Removed!');
            }.bind(this));
        },
        promptForAction: function(calEvent) {
            var isSection = typeof calEvent.section !== 'undefined';
            var course = isSection ? calEvent.section : calEvent.course;
            if (isSection && course === null) {
                // Choose later
                return this.promptSections(calEvent.number, null);
            }
            var html = this.getCourseDom(course, isSection);
            return this.alert()
            .okBtn(isSection ? 'Change Section' : 'Remove Class')
            .cancelBtn("Go Back")
            .confirm(html)
            .then(function(resolved) {
                resolved.event.preventDefault();
                if (resolved.buttonClicked !== 'ok') return;
                if (isSection) {
                    this.promptSections(calEvent.number, true);
                }else{
                    this.promptToRemove(calEvent);
                }
            }.bind(this));
        },
        promptAddClass: function(course) {
            var courseHasSections = this.courseHasSections(course.num);
            var code = this.checkForConflict(course);
            var alertHandle = function() {};

            var html = this.getCourseDom(course);

            if (code !== false || code === null) {
                alertHandle = function() {
                    return this.alert()
                    .okBtn(code === null ? 'Taking the same class twice?' : 'Conflict with ' + code)
                    .alert(html)
                }.bind(this)
            }else{
                alertHandle = function() {
                    return this.alert()
                    .okBtn(courseHasSections ? 'Choose Section' : 'Add Class')
                    .cancelBtn("Go Back")
                    .confirm(html)
                    .then(function(resolved) {
                        resolved.event.preventDefault();
                        if (resolved.buttonClicked !== 'ok') return;
                        if (courseHasSections) {
                            // First time, initial = true
                            this.promptSections(course.num, false, true);
                        } else {
                            this.pushToEventSource(course);

                            this.refreshCalendar();
                            this.alert().success(course.c + ' added to the planner!');
                        }
                    }.bind(this));
                }.bind(this)
            }
            return alertHandle()
        },
        promptSections: function(courseNumber, edit, initial) {
            this.loading.go(30);
            edit = (typeof edit === 'undefined' ? false : edit);
            initial = (typeof initial === 'undefined' ? false: initial);

            var termId = this.termId;
            var course = this.courseInfo[termId][courseNumber];
            // TODO: customize display (like NOT hard coding it)
            var headTemplate = function(name) {
                return ['<th>', name, '</th>'].join('');
            }
            var conflictClass = 'muted not-clickable';
            var notConflictClass = 'clickable';
            var secSeats = null;
            var lastUpdated = 'Error';
            var getSeatBySectionNum = function(seats, secNum) {
                return seats.filter(function(el) {
                    return el.num == secNum;
                })[0];
            }

            this.fetchRealTimeEnrollment(termId, courseNumber)
            .then(function(res) {

                this.loading.go(70);

                if (res.ok) {
                    secSeats = res.results[0].seats.sec;
                    lastUpdated = new Date(res.results[0].date * 1000).toLocaleString();
                }
                var generateRows = function(sections) {
                    var string = '';
                    var seat;
                    for (var i = 0, length = sections.length; i < length; i++) {
                        if (this.checkForConflict(sections[i]) === false) {
                            string += '<tr class="' + notConflictClass + '" onclick="window.App._pushSectionToEventSource(' + courseNumber + ', ' + sections[i].num + ', ' + edit + ')">';
                        }else{
                            string += '<tr class="' + conflictClass + '">';
                        }
                        string += ['<td>', sections[i].sec, '</td>'].join('');
                        if (!!sections[i].loct[0].t) {
                            string += ['<td>', sections[i].loct[0].t.day.join(', '), '<br>', [this.tConvert(sections[i].loct[0].t.time.start), this.tConvert(sections[i].loct[0].t.time.end)].join('-'), '</td>'].join('');
                        }else{
                            string += ['<td>', 'TBA', '</td>'].join('');
                        }
                        string += ['<td>', sections[i].loct[0].loc, '</td>'].join('');
                        if (secSeats !== null) {
                            seat = getSeatBySectionNum(secSeats, sections[i].num);
                            string += ['<td>', seat.status + '<br>' + (seat.cap - seat.enrolled) + ' avail.', '</td>'].join('');
                        }else{
                            string += ['<td>', '<span class="muted">Error</span>', '</td>'].join('');
                        }
                        string += '</a></tr>';
                    }
                    return string;
                }.bind(this)

                var table = '<p>' + (edit ? 'Choose another section' : 'Choose a section') + '</p>'
                + '<table class="table-light h6">'
                + '<thead>'
                + headTemplate('Section')
                + headTemplate('Meeting Time')
                + headTemplate('Location')
                + headTemplate('Enrollment')
                + '</thead>'
                + '<tbody>'
                + generateRows(course.sec)
                + '</tbody>'
                + '</table>'
                + '<p><span class="muted h6">Last Updated: ' + lastUpdated + '</span></p>';

                this.loading.go(100);

                this.alert()
                .okBtn("Choose Later")
                .cancelBtn("Go Back")
                .confirm(table)
                .then(function(resolved) {
                    resolved.event.preventDefault();
                    if (resolved.buttonClicked !== 'ok') return;
                    // Check if are adding the class for the first time
                    if (initial) {
                        // Not first time, so edit = false
                        this._pushSectionToEventSource(courseNumber, null, false);
                    }else{
                        // First time, so edit = null
                        this._pushSectionToEventSource(courseNumber, null, null);
                    }
                }.bind(this));
            }.bind(this))
        },
        initializeCalendar: function() {
            var self = this;
            var termId = this.route.params.termId;
            $('#calendar-' + termId).fullCalendar({
                columnFormat: 'ddd',
                minTime: '07:00',
                maxTime: '23:00',
                defaultDate: self.dateMap.Monday,
                allDayText: 'TBA',
                //allDaySlot: false,
                weekends: false,
                defaultView: 'agendaWeek',
                header: false,
                contentHeight: 'auto',
                eventSources: [{
                    events: function(start, end, timezone, callback) {
                        callback(self.eventSource[termId]);
                    },
                }],
                eventClick: function(calEvent, jsEvent, view) {
                    self.promptForAction(calEvent);
                }
            })
        },
        loadFileSaverBundle: function(callback) {
            $script([dist + 'canvas/canvas-toBlob.js', dist + 'canvas/FileSaver.min.js'], 'fileSaverBundle')
            $script.ready('fileSaverBundle', callback)
        },
        loadCanvasBundle: function(callback) {
            var self = this;
            $script(dist + 'html2canvas/0.5.0-beta4-no-585a96a/html2canvas.min.js', 'canvasRootDep');
            $script.ready('canvasRootDep', function() {
                self.loading.go(60);
                $script(dist + 'html2canvas/0.5.0-beta4-no-585a96a/html2canvas.svg.min.js', 'canvasBundle')
                $script.ready('canvasBundle', function() {
                    self.loadFileSaverBundle(callback);
                })
            })
        },
        loadICSBundle: function(callback) {
            var self = this;
            $script(dist + 'ics.js/connorbode/ics.js', 'ics.js');
            $script.ready('ics.js', function() {
                self.loadFileSaverBundle(callback);
            })
        },
        saveCalendarAsImage: function() {
            var self = this;
            this.loading.go(30);
            this.loadCanvasBundle(function() {
                self.loading.go(80);
                html2canvas(document.getElementById('calendar-container'), {
                    useCORS: true
                }).then(function(canvas) {
                    canvas.toBlob(function(blob) {
                        self.loading.go(100);
                        saveAs(blob, 'Schedule for ' + self.termName + '.png');
                    });
                })
            })
        },
        saveCalendarAsICS: function() {
            var self = this;
            this.loading.go(50);
            this.loadICSBundle(function() {
                self.loading.go(100);
                self.exportICS();
            })
        },
        bookmark: function() {
            var html = '';
            this.dispatchReplaceHash();

            html += ['<p>', '<i>', 'Now you can bookmark this page!', '</i>', '</p>'].join('');
            html += ['<p>', 'Your planner will show up when you visit this URL on another device.', '</p>'].join('');
            html += ['<p>', '(That means you can share this URL to your friends!)', '</p>'].join('');
            html += ['<p class="pt1 px2 mt1">', '<input type="text" class="field block bookmark" onmouseover="this.setSelectionRange(0, this.value.length)">', '</p>'].join('');

            this.alert()
            .okBtn('I\'m Done!')
            .alert(html)
            .then(function(resolved) {
                window.location.hash = '';
                console.log('click')
            })

            setTimeout(function() {
                try {
                    var element = document.getElementsByClassName('bookmark')[0];
                    element.value = window.location.href;
                    element.setSelectionRange(0, element.value.length)
                }catch(e) {}
            }, 500);
        }
    },
    created: function() {
        var self = this;
        $script([dist + 'jquery/3.1.0/jquery-3.1.0.min.js', dist + 'moment/2.14.1/moment.min.js'], 'jQuery', function() {
            $script(dist + 'fullcalender/2.9.1/fullcalendar.min.js', 'calendar')
        })
    },
    ready: function() {
        var self = this;
        this.loading.go(30);
        this.setTitle('Planner');

        $script.ready('jQuery', function() {
            self.loading.go(50);
        })
        $script.ready('calendar', function() {
            self.loading.go(70);
            self.fetchTermCourses().then(function() {
                return self.decodeHash()
                .then(function() {
                    // no valid was decoded
                    return self.loadAutosave()
                })
                .catch(function() {
                    // hash was used instead of local copy
                })
            }).then(function() {
                window.location.hash = '';

                self.ready = true;
                self.$nextTick(function() {
                    self.initializeCalendar();
                })
            }).catch(function(e) {
                self.ready = false;
                self.alert().error('Cannot load course data!')
            }).finally(function() {
                self.loading.go(100);
            })
        })
    }
}
</script>

<style>
ul {
    max-height: 20em;
}
.fc-agenda-view tr {
     height: 40px !important;
}
/*
    https://codepen.io/beben-koben/pen/gfuvc
*/
.rainbow:hover {
    -webkit-animation:rainbow 1s infinite;
    -ms-animation:rainbow 1s infinite;
    -o-animation:rainbow 1s infinite;
    animation:rainbow 1s infinite;
}
@-webkit-keyframes rainbow {
    0% {color: #ff0000;}
    10% {color: #ff8000;}
    20% {color: #ffff00;}
    30% {color: #80ff00;}
    40% {color: #00ff00;}
    50% {color: #00ff80;}
    60% {color: #00ffff;}
    70% {color: #0080ff;}
    80% {color: #0000ff;}
    90% {color: #8000ff;}
    100% {color: #ff0080;}
}
@-ms-keyframes rainbow {
    0% {color: #ff0000;}
    10% {color: #ff8000;}
    20% {color: #ffff00;}
    30% {color: #80ff00;}
    40% {color: #00ff00;}
    50% {color: #00ff80;}
    60% {color: #00ffff;}
    70% {color: #0080ff;}
    80% {color: #0000ff;}
    90% {color: #8000ff;}
    100% {color: #ff0080;}
}
@-o-keyframes rainbow {
    0% {color: #ff0000;}
    10% {color: #ff8000;}
    20% {color: #ffff00;}
    30% {color: #80ff00;}
    40% {color: #00ff00;}
    50% {color: #00ff80;}
    60% {color: #00ffff;}
    70% {color: #0080ff;}
    80% {color: #0000ff;}
    90% {color: #8000ff;}
    100% {color: #ff0080;}
}
@keyframes rainbow {
    0% {color: #ff0000;}
    10% {color: #ff8000;}
    20% {color: #ffff00;}
    30% {color: #80ff00;}
    40% {color: #00ff00;}
    50% {color: #00ff80;}
    60% {color: #00ffff;}
    70% {color: #0080ff;}
    80% {color: #0000ff;}
    90% {color: #8000ff;}
    100% {color: #ff0080;}
}
</style>
