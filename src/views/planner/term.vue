<template>
    <div>
        <div class="overflow-hidden bg-white rounded mb2 clearfix" v-show="!lock">
            <div class="m0 p2" v-show="!ready">
                Loading...
            </div>
            <div class="m0 p2" v-show="ready">
                <div class="clearfix">
                    <div class="left">
                        <div class="sm-flex">
                            <router-link class="p1 flex-auto h6 btn white clickable" v-bind:style="{ backgroundColor: colorMap.regular }" :to="{ name: 'viewList', params: { termId: termId } }" tag="div"><i class="fa fa-list fa-lg">&nbsp;</i>all classes</router-link>
                        </div>
                    </div>
                    <div class="right">
                        <div class="sm-flex">
                            <div class="p1 flex-auto h6 btn white clickable" v-bind:style="{ backgroundColor: colorMap.searchAnything }" v-on:click.prevent.stop="showSearchModal"><i class="fa fa-search fa-lg">&nbsp;</i>search anything</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div id="calendar-container" class="overflow-hidden bg-white rounded mb2 clearfix h6" v-show="ready">
            <div class="m0 p2">
                <div v-bind:id="'calendar-' + termId"></div>
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
                        <div class="sm-flex">
                            <div class="p1 flex-auto h6 btn white clickable" v-bind:style="{ backgroundColor: colorMap.share }" v-on:click.prevent.stop="showShareMenu"><i class="fa fa-share fa-lg">&nbsp;</i>click here to share the planner</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <search :show="searchModal" v-on:close="searchModal = false" :show-extra="true" :callback="promptAddClass" :selected-term-id="termId"></search>
    </div>
</template>

<script>
var helper = require('../../lib/vuex/helper')
module.exports = {
    data: function() {
        return {
            ready: false,
            searchModal: false,
            chooseSectionModal: false,
            sectionList: [],
            lock: false
        }
    },
    computed: {
        alert: function() {
            return this.$store.getters.alert;
        },
        termId: function() {
            return this.$store.getters.termId;
        },
        colorMap: function() {
            return this.$store.getters.colorMap;
        },
        dateMap: function() {
            return this.$store.getters.dateMap;
        },
        flatCourses: function() {
            return this.$store.getters.flatCourses;
        }
    },
    methods: {
        showSearchModal: function() {
            var self = this;
            var termId = this.termId;
            return this.$store.dispatch('noAwaitSection', termId)
            .then(function(noAwaitSection) {
                var p = function() {
                    if (noAwaitSection) return Bluebird.resolve();
                    return self.jumpOutAwait(termId).then(function() {
                        return self.$store.dispatch('refreshCalendar')
                    })
                }
                return p().then(function() {
                    self.searchModal = true;
                    setTimeout(function() {
                        document.getElementsByClassName('search-box')[0].focus();
                    }, 75);
                })
            })
        },
        promptToRemove: function(calEvent) {
            var self = this;
            var termId = this.termId;
            return this.alert
            .okBtn("Yes")
            .cancelBtn("No")
            .confirm('Remove ' + calEvent.course.c + ' from calendar?')
            .then(function(resolved) {
                resolved.event.preventDefault();
                if (resolved.buttonClicked !== 'ok') return;
                return self.$store.dispatch('removeFromSource', {
                    termId: termId,
                    courseNum: calEvent.number
                }).then(function() {
                    self.$store.dispatch('refreshCalendar')
                    self.alert.success('Removed!');
                })
            });
        },
        jumpOutAwait: function() {
            var self = this;
            var termId = this.termId;
            return this.$store.dispatch('getCurrentAwaitSection', termId)
            .then(function(currentAwait) {
                if (currentAwait === false) return;
                // Of course restore any missing color first
                return self.$store.dispatch('restoreEventsColor', termId)
                .then(function() {
                    // we first remove all awaitSelections of the old one
                    return self.$store.dispatch('removeFromSource', {
                        termId: termId,
                        courseNum: currentAwait.number
                    })
                })
                .then(function() {
                    // Then add back the "chooose later"
                    return self.$store.dispatch('pushToEventSource', {
                        termId: termId,
                        courseObj: currentAwait.course
                    })
                })
            })
        },
        promptForAction: function(calEvent) {
            var self = this;
            var termId = this.termId;
            var awaitSelection = calEvent.awaitSelection;

            if (awaitSelection === true && this.lock !== true) {
                if (calEvent.conflict !== false) {
                    return this.alert.error('Conflict with ' + calEvent.conflict);
                }

                if (calEvent.sectionNum === null) return;

                return this.$store.dispatch('restoreEventsColor', termId)
                .then(function() {
                    return self.$store.dispatch('pushSectionToEventSource', {
                        termId: termId,
                        courseNum: calEvent.number,
                        sectionNum: calEvent.sectionNum
                    })
                })
                .then(function() {
                    self.$store.dispatch('refreshCalendar')
                    self.alert.success(self.flatCourses[termId][calEvent.number].c + ' added to the planner!');
                })
            }

            return this.$store.dispatch('noAwaitSection', termId)
            .then(function(noAwaitSection) {
                if (!noAwaitSection) {
                    if (calEvent.color === self.colorMap.grayOut && calEvent.course.custom !== true) {
                        return self.jumpOutAwait()
                        .then(function() {
                            return self.displaySectionsOnCalendar(calEvent.number);
                        });
                    }
                    return;// this.alert.error('Choose a section first!')
                }else{
                    if (calEvent.sectionNum === null && self.lock === true) return;
                    var isSection = typeof calEvent.section !== 'undefined';
                    if (isSection && calEvent.sectionNum === null && self.lock !== true) {
                        // Choose later
                        return self.displaySectionsOnCalendar(calEvent.number);
                    }
                    var course = isSection ? calEvent.section : calEvent.course;
                    return self.$store.dispatch('getCourseDom', {
                        termId: termId,
                        courseObj: course,
                        isSection: isSection
                    })
                    .then(function(html) {
                        if (self.lock === true) {
                            return self.alert.okBtn('OK').alert(html);
                        }else{
                            return self.alert
                            .okBtn(isSection ? 'Change Section' : 'Remove')
                            .cancelBtn("Go Back")
                            .confirm(html)
                            .then(function(resolved) {
                                resolved.event.preventDefault();
                                if (resolved.buttonClicked !== 'ok') return;
                                if (isSection) {
                                    self.displaySectionsOnCalendar(calEvent.number);
                                }else{
                                    self.promptToRemove(calEvent);
                                }
                            });
                        }
                    })
                }
            })
        },
        promptAddClass: function(course) {
            var self = this;
            var termId = this.termId;
            var code = helper.checkForConflict(this.dateMap, this.$store.getters.eventSource[termId], course);
            var alertHandle = function() {};

            return this.$store.dispatch('getCourseDom', {
                termId: termId,
                courseObj: course,
                isSection: false
            }).then(function(html) {
                if (code !== false || code === null) {
                    alertHandle = function() {
                        return self.alert
                        .okBtn(code === null ? 'Taking the same class twice?' : 'Conflict with ' + code)
                        .alert(html)
                    }
                }else{
                    alertHandle = function() {
                        return self.alert
                        .okBtn('Add Class')
                        .cancelBtn("Go Back")
                        .confirm(html)
                        .then(function(resolved) {
                            resolved.event.preventDefault();
                            if (resolved.buttonClicked !== 'ok') return;

                            return self.$store.dispatch('pushToEventSource', {
                                termId: termId,
                                courseObj: course
                            }).then(function() {
                                self.$store.dispatch('refreshCalendar')
                                self.alert.success(course.c + ' added to the planner!');
                            })
                        });
                    }
                }
                return alertHandle()
            })
        },
        displaySectionsOnCalendar: function(courseNum) {
            this.$store.getters.loading.go(30);
            var self = this;
            var termId = this.termId;
            this.searchModal = false;
            return this.$store.dispatch('removeFromSource', {
                termId: termId,
                courseNum: courseNum
            }).then(function() {
                return self.$store.dispatch('grayOutEvents', termId)
            }).then(function() {
                return self.$store.dispatch('pushAwaitSectionsToEventSource', {
                    termId: termId,
                    courseNum: courseNum
                })
            })
        },
        initializeCalendar: function() {
            var self = this;
            var termId = this.termId;
            $('#calendar-' + termId).fullCalendar({
                columnFormat: 'ddd',
                minTime: '07:00',
                maxTime: '23:00',
                defaultDate: self.dateMap.Monday,
                allDayText: 'TBD',
                slotDuration: '01:00:00',
                //allDaySlot: false,
                weekends: false,
                defaultView: 'agendaWeek',
                header: false,
                contentHeight: 'auto',
                eventSources: [{
                    events: function(start, end, timezone, callback) {
                        callback(self.$store.getters.eventSource[termId]);
                    },
                }],
                eventClick: function(calEvent, jsEvent, view) {
                    self.promptForAction(calEvent);
                },
                dayClick: function(date, jsEvent, view) {
                    return self.jumpOutAwait().then(function() {
                        return self.$store.dispatch('refreshCalendar')
                    })
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
                self.$store.getters.loading.go(60);
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
            this.$store.getters.loading.go(30);
            this.loadCanvasBundle(function() {
                self.$store.getters.loading.go(80);
                html2canvas(document.getElementById('calendar-container'), {
                    useCORS: true
                }).then(function(canvas) {
                    canvas.toBlob(function(blob) {
                        self.$store.getters.loading.go(100);
                        saveAs(blob, 'Schedule for ' + self.$store.getters.termName + '.png');
                    });
                })
            })
        },
        saveCalendarAsICS: function() {
            var self = this;
            this.$store.getters.loading.go(50);
            this.loadICSBundle(function() {
                self.$store.getters.loading.go(100);
                self.$store.dispatch('exportICS');
            })
        },
        bookmark: function() {
            var html = '';
            this.$store.dispatch('dispatchReplaceHash');

            html += ['<p>', '<i>', 'Now you can bookmark this page!', '</i>', '</p>'].join('');
            html += ['<p>', 'Your planner will show up when you visit this URL on another device.', '</p>'].join('');
            html += ['<p>', '(That means you can share this URL to your friends!)', '</p>'].join('');
            html += ['<p class="pt1 px2 mt1">', '<input type="text" class="field block bookmark" onmouseover="this.setSelectionRange(0, this.value.length)">', '</p>'].join('');

            this.alert
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
            html += '<a class="btn btn-outline h6 white" style="background-color: ' + this.colorMap.regular + '" onclick="window._vueContext.saveCalendarAsImage()">';
            html += 'save as image';
            html += '</a></span>';

            html += '<span class="block mt2">';
            html += '<a class="btn btn-outline h6 white" style="background-color: ' + this.colorMap.regular + '" onclick="window._vueContext.saveCalendarAsICS()">';
            html += 'save as calendar';
            html += '</a></span>';

            html += '<span class="block mt2">';
            html += '<a class="btn btn-outline h6 white" style="background-color: ' + this.colorMap.regular + '" onclick="window._vueContext.bookmark()">';
            html += 'get a bookmark link';
            html += '</a></span>';

            this.alert
            .okBtn('OK')
            .alert(html)
        }
    },
    created: function() {
        var self = this;
        $script([dist + 'jquery/3.1.0/jquery-3.1.0.min.js', dist + 'lz-string/1.4.4/lz-string.min.js'], 'bundle', function() {
            $script(dist + 'fullcalender/2.9.1/fullcalendar.min.js', 'calendar')
        })
    },
    mounted: function() {
        var self = this;
        this.$store.getters.loading.go(30);
        this.$store.dispatch('setTitle', 'Planner');

        $script.ready('bundle', function() {
            self.$store.getters.loading.go(50);
        })
        $script.ready('calendar', function() {
            self.$store.getters.loading.go(70);
            self.$store.dispatch('fetchTermCourses').then(function() {
                return self.$store.dispatch('decodeHash')
                .then(function() {
                    // no valid was decoded
                    return self.$store.dispatch('loadAutosave', {
                        termId: self.termId
                    })
                })
                .catch(function(e) {
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
                console.log(e);
                self.ready = false;
                self.$store.getters.alert.error('Cannot load course data!')
            }).finally(function() {
                self.$store.getters.loading.go(100);
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
