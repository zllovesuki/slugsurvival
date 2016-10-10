<template>
    <div>
        <div class="overflow-hidden bg-white rounded mb2 clearfix" v-show="!lock">
            <div class="m0 p2" v-show="!ready">
                Loading...
            </div>
            <div class="m0 p2" v-show="ready">
                <div class="clearfix">
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
                        <a class="btn btn-outline white h6" v-bind:style="{ backgroundColor: colorMap.TBA }">
                            TBA
                        </a>
                        <a class="btn btn-outline white h6" v-bind:style="{ backgroundColor: colorMap.course }">
                            Class
                        </a>
                        <a class="btn btn-outline white h6" v-bind:style="{ backgroundColor: colorMap.section }">
                            Section
                        </a>
                        <a class="btn btn-outline white h6" v-bind:style="{ backgroundColor: colorMap.custom }">
                            Other
                        </a>
                    </div>
                </div>
            </div>
        </div>
        <div class="overflow-hidden bg-white rounded mb2 clearfix">
            <div class="m0 p2">
                <div class="clearfix">
                    <div class="right">
                        <a class="btn btn-outline green h6" @click="showShareMenu">
                            click here to share the planner
                        </a>
                    </div>
                </div>
            </div>
        </div>
        <search :show.sync="searchModal" :show-extra="true" :callback="promptAddClass" :selected-term-id="termId"></search>
        <modal :show.sync="chooseSectionModal">
            <h4 slot="header">
                Choose a Section For...
            </h4>
            <span slot="body">
                <ul class="list-reset">
                    <li class="overflow-hidden btn h5 block" v-on:click.prevent.stop="closeChooseModalThenDisplaySections(calEvent)" v-for="calEvent in sectionList" track-by="number">
                        {{ calEvent.course.c }}
                    </li>
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
            chooseSectionModal: false,
            sectionList: [],
            lock: false
        }
    },
    methods: {
        showSearchModal: function() {
            var termId = this.route.params.termId;
            if (!this.noAwaitSection(termId)) {
                this.jumpOutAwait(termId);
                this.refreshCalendar();
            }
            this.searchModal = true;
            setTimeout(function() {
                document.getElementsByClassName('search-box')[0].focus();
            }, 75);
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
        jumpOutAwait: function() {
            var termId = this.route.params.termId;
            var currentAwait = this.getCurrentAwaitSection(termId);
            if (currentAwait === false) return;
            // Of course restore any missing color first
            this.restoreEventsColor(termId);
            // we first remove all awaitSelections of the old one
            this.removeFromSource(termId, currentAwait.number);
            // Then add back the "chooose later"
            this.pushToEventSource(currentAwait.course);
        },
        promptForAction: function(calEvent) {
            if (this.lock) return;
            var termId = this.route.params.termId;
            var awaitSelection = calEvent.awaitSelection;

            if (awaitSelection === true) {
                if (calEvent.conflict !== false) {
                    return this.alert().error('Conflict with ' + calEvent.conflict);
                }

                if (calEvent.sectionNum === null) return;

                this.restoreEventsColor(termId);
                this.pushSectionToEventSource(calEvent.number, calEvent.sectionNum);

                this.refreshCalendar();
                this.alert().success(this.flatCourses[termId][calEvent.number].c + ' added to the planner!');
                return;
            }

            if (!this.noAwaitSection(termId)) {
                if (calEvent.color === this.colorMap.grayOut && calEvent.course.custom !== true) {
                    this.jumpOutAwait();
                    return this.displaySectionsOnCalendar(calEvent.number);
                }
                return;// this.alert().error('Choose a section first!')
            }

            var isSection = typeof calEvent.section !== 'undefined';
            if (isSection && calEvent.sectionNum === null) {
                // Choose later
                return this.displaySectionsOnCalendar(calEvent.number);
            }
            var course = isSection ? calEvent.section : calEvent.course;
            var html = this.getCourseDom(termId, course, isSection);
            return this.alert()
            .okBtn(isSection ? 'Change Section' : 'Remove')
            .cancelBtn("Go Back")
            .confirm(html)
            .then(function(resolved) {
                resolved.event.preventDefault();
                if (resolved.buttonClicked !== 'ok') return;
                if (isSection) {
                    this.displaySectionsOnCalendar(calEvent.number);
                }else{
                    this.promptToRemove(calEvent);
                }
            }.bind(this));
        },
        promptAddClass: function(course) {
            var termId = this.route.params.termId;
            var code = this.checkForConflict(course);
            var alertHandle = function() {};

            var html = this.getCourseDom(termId, course);

            if (code !== false || code === null) {
                alertHandle = function() {
                    return this.alert()
                    .okBtn(code === null ? 'Taking the same class twice?' : 'Conflict with ' + code)
                    .alert(html)
                }.bind(this)
            }else{
                alertHandle = function() {
                    return this.alert()
                    .okBtn('Add Class')
                    .cancelBtn("Go Back")
                    .confirm(html)
                    .then(function(resolved) {
                        resolved.event.preventDefault();
                        if (resolved.buttonClicked !== 'ok') return;

                        this.pushToEventSource(course);

                        this.refreshCalendar();
                        this.alert().success(course.c + ' added to the planner!');
                    }.bind(this));
                }.bind(this)
            }
            return alertHandle()
        },
        displaySectionsOnCalendar: function(courseNum) {
            this.loading.go(30);
            var termId = this.termId;
            this.searchModal = false;
            this.removeFromSource(termId, courseNum);

            this.grayOutEvents(termId);
            this.pushAwaitSectionsToEventSource(termId, courseNum);
        },
        showChooseSectionModal: function() {
            var termId = this.termId;
            if (typeof this.eventSource[termId] === 'undefined') return;
            var events = this.eventSource[termId].filter(function(el) {
                return el.awaitSelection === false && el.sectionNum === null;
            })
            if (events.length === 0) return;
            this.sectionList = events;
            this.chooseSectionModal = true;
        },
        closeChooseModalThenDisplaySections: function(calEvent) {
            this.chooseSectionModal = false;
            this.promptForAction(calEvent);
        },
        initializeCalendar: function() {
            var self = this;
            var termId = this.route.params.termId;
            $('#calendar-' + termId).fullCalendar({
                columnFormat: 'ddd',
                minTime: '07:00',
                maxTime: '23:00',
                defaultDate: self.dateMap.Monday,
                allDayText: 'TBD',
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
                },
                dayClick: function(date, jsEvent, view) {
                    if (self.noAwaitSection(termId)) {
                        return self.showChooseSectionModal();
                    }
                    self.jumpOutAwait();
                    self.refreshCalendar();
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
            })

            setTimeout(function() {
                try {
                    var element = document.getElementsByClassName('bookmark')[0];
                    element.value = window.location.href;
                    element.setSelectionRange(0, element.value.length)
                }catch(e) {}
            }, 500);
        },
        showShareMenu: function() {
            window._vueContext = {};
            window._vueContext.saveCalendarAsImage = this.saveCalendarAsImage;
            window._vueContext.saveCalendarAsICS = this.saveCalendarAsICS;
            window._vueContext.bookmark = this.bookmark

            var html = '<p>Share...</p>';
            html += '<span class="block mt2">';
            html += '<a class="btn btn-outline {{ color }} h6" onclick="window._vueContext.saveCalendarAsImage()">';
            html += 'save as image';
            html += '</a></span>';

            html += '<span class="block mt2">';
            html += '<a class="btn btn-outline {{ color }} h6" onclick="window._vueContext.saveCalendarAsICS()">';
            html += 'save as calendar';
            html += '</a></span>';

            html += '<span class="block mt2">';
            html += '<a class="btn btn-outline {{ color }} h6" onclick="window._vueContext.bookmark()">';
            html += 'get a bookmark link';
            html += '</a></span>';

            this.alert()
            .okBtn('OK')
            .alert(html)
        }
    },
    created: function() {
        var self = this;
        $script([dist + 'jquery/3.1.0/jquery-3.1.0.min.js', dist + 'moment/2.14.1/moment.min.js', dist + 'lz-string/1.4.4/lz-string.min.js'], 'jQuery', function() {
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
                self.emptyEventSource(self.termId);
                return self.decodeHash()
                .then(function() {
                    // no valid was decoded
                    return self.loadAutosave()
                })
                .catch(function() {
                    // hash was used instead of local copy
                    self.lock = true;
                })
            }).then(function() {
                self.ready = true;
                self.$nextTick(function() {
                    self.initializeCalendar();
                    // We will now force the allDaySlot in the bottom of the page
                    self.$nextTick(function() {
                        $('.fc-day-grid').insertAfter($('.fc-time-grid'))
                        $('.fc-divider').insertAfter($('.fc-time-grid'))
                    })

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
