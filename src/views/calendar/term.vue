<template>
    <div>
        <div class="overflow-hidden bg-white rounded mb2 clearfix">
            <div class="m0 p2">
                <div class="clearfix">
                    <div class="left">
                        <a class="btn btn-outline red h6" v-on:click="saveCalendarAsImage">
                            save as image
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
        <div id="calendar-container" class="overflow-hidden bg-white rounded mb2 clearfix">
            <div class="m0 p2">
                <div id="calendar-{{ termId }}"></div>
            </div>
        </div>
        <div class="overflow-hidden bg-white rounded mb2 clearfix">
            <div class="m0 p2">
                <div class="clearfix">
                    <div class="left">

                    </div>
                    <div class="right">
                        <a class="btn h6 m0 {{ color }}">
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
        <modal :show.sync="searchModal">
            <h4 slot="header">
                <input type="text" class="field block col-12 mb1 search-box" v-model="search.string" debounce="250" placeholder="ECON 197, Design, Baskin, Mendes, etc...">
            </h4>
            <span slot="body">
                    <ul class="list-reset block">
                    <li class="overflow-hidden" v-for="result in search.results" track-by="$index">
                        <a class="btn h5" v-on:click.prevent.stop="promptAddClass(result)">
                            {{ result.c }} - {{ result.s }}  - {{ result.n }}
                        </a>
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
                    },
                    lo: {
                        boost: 1
                    }
                }
            };
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
            }, 500);
        },
        bruteForceSearch: function(string) {
            var courses = this.flatCourses[this.termId];
            var results = [];
            string = string.toLowerCase();
            for (var number in courses) {
                if (courses[number].c.toLowerCase().indexOf(string) !== -1
                || courses[number].n.toLowerCase().indexOf(string) !== -1
                || (!!!courses[number].loc ? false : courses[number].loc.toLowerCase().indexOf(string) !== -1)
                || (!!!courses[number].ins.f ? false : courses[number].ins.f.toLowerCase().indexOf(string) !== -1)
                || (!!!courses[number].ins.l ? false : courses[number].ins.l.toLowerCase().indexOf(string) !== -1)) {
                    results.push(courses[number]);
                }
            };
            return results;
        },
        getCourseDom: function(course, isSection) {
            // TODO: Reduce special cases
            isSection = isSection || false;
            if (!isSection) {
                var courseHasSections = this.courseHasSections(course.num);
            }
            var html = '';
            var template = function(key, value) {
                return ['<p>', '<span class="muted h6">', key, ': </span><b class="h5">', value, '</b>', '</p>'].join('');
            }
            // html += template('Course Number', course.number);
            if (isSection) {
                html += template('Section', 'DIS - ' + course.sec);
                html += template('TA', course.ins);
            }else{
                html += template(course.c, courseHasSections ? 'has sections': 'has NO sections');
                html += template('Instructor(s)', course.ins.d.join(', ') + (!!!course.ins.f ? '' : '<sup class="muted clickable" onclick="window.App._showInstructorRMP(\'' + course.ins.f.replace(/'/g, '\\\'') + '\', \'' + course.ins.l.replace(/'/g, '\\\'') + '\')">RateMyProfessors</sup>') );
            }
            html += template('Location', !!!course.loc ? 'TBA': course.loc);
            html += template('Meeting Day', !!!course.t ? 'TBA' : course.t.day.join(', '));
            html += template('Meeting Time', !!!course.t ? 'TBA' : this.tConvert(course.t.time.start) + '-' + this.tConvert(course.t.time.end));
            if (!isSection) {
                html += template('Capacity', course.cap);
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
                this.alert().success('Removed!')
            }.bind(this));
        },
        promptForAction: function(calEvent) {
            var isSection = typeof calEvent.section !== 'undefined';
            var course = isSection ? calEvent.section : calEvent.course;
            if (isSection && course === null) {
                // Choose later
                return this.promptSections(calEvent.number, true);
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
                            this.promptSections(course.num);
                        } else {
                            this.pushToEventSource(course);
                        }
                    }.bind(this));
                }.bind(this)
            }
            return alertHandle()
        },
        promptSections: function(courseNumber, edit) {
            edit = edit || false;
            var course = this.courseInfo[this.termId][courseNumber];
            // TODO: customize display (like NOT hard coding it)
            var headTemplate = function(name) {
                return ['<th>', name, '</th>'].join('');
            }
            var conflictClass = 'muted not-clickable';
            var notConflictClass = 'clickable';
            var generateRows = function(sections) {
                var string = '';
                for (var i = 0, length = sections.length; i < length; i++) {
                    if (this.checkForConflict(sections[i]) === false) {
                        string += '<tr class="' + notConflictClass + '" onclick="window.App._pushSectionToEventSource(' + courseNumber + ', ' + sections[i].num + ', ' + edit + ')">';
                    }else{
                        string += '<tr class="' + conflictClass + '">';
                    }
                    string += ['<td>', sections[i].sec, '</td>'].join('');
                    if (!!sections[i].t) {
                        string += ['<td>', sections[i].t.day.join(', '), '<br>', [this.tConvert(sections[i].t.time.start), this.tConvert(sections[i].t.time.end)].join('-'), '</td>'].join('');
                    }else{
                        string += ['<td>', 'TBA', '</td>'].join('');
                    }
                    string += ['<td>', sections[i].loc, '</td>'].join('');
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
            + '</thead>'
            + '<tbody>'
            + generateRows(course.sec)
            + '</tbody>'
            + '</table>';

            this.alert()
            .okBtn("Choose Later")
            .cancelBtn("Go Back")
            .confirm(table)
            .then(function(resolved) {
                resolved.event.preventDefault();
                if (resolved.buttonClicked !== 'ok') return;
                this._pushSectionToEventSource(courseNumber, null, true);
            }.bind(this));
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
        loadCanvasBundle: function(callback) {
            var self = this;
            $script(dist + 'html2canvas/0.5.0-beta4-no-585a96a/html2canvas.min.js', 'canvasRootDep');
            $script.ready('canvasRootDep', function() {
                self.loading.go(60);
                $script([dist + 'html2canvas/0.5.0-beta4-no-585a96a/html2canvas.svg.min.js', dist + 'canvas/canvas-toBlob.js', dist + 'canvas/FileSaver.min.js'], 'canvasBundle')
                $script.ready('canvasBundle', callback)
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
        }
    },
    ready: function() {
        var self = this;
        this.loading.go(30);
        this.setTitle('Planner');
        this.fetchTermCourses().then(function() {
            this.loading.go(50);
            $script([dist + 'jquery/3.1.0/jquery-3.1.0.min.js', dist + 'moment/2.14.1/moment.min.js'], 'jQuery');
            $script.ready('jQuery', function() {
                self.loading.go(70);
                $script(dist + 'fullcalender/2.9.1/fullcalendar.min.js', 'calendar')
                $script.ready('calendar', function() {
                    self.loading.go(100);
                    self.initializeCalendar();
                })
            })
        }.bind(this))
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
</style>
