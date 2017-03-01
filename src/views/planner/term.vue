<template>
    <div>
        <div class="fixed bottom-0 left-0 m2" style="z-index: 2000">
            <a class="btn block muted" @click="$store.commit('flipLockMinMax')" v-tooltip="!lockMinMax ? 'Show 07:00am-11:00pm': 'Show concise time'">
                <i class="fa" v-bind:class="{'fa-minus-circle': lockMinMax, 'fa-plus-circle': !lockMinMax}">&nbsp;</i>
            </a>
        </div>
        <transition-group name="list-complete" appear>
            <div id="top-bar" class="rounded fixed top-0" v-bind:class="{ 'bg-black-transparent': !lock }" v-if="ready" key="actions">
                <div class="m0 p0 rounded">
                    <div class="clearfix">
                        <div class="right rounded" v-show="!lock">
                            <div class="inline-block m1 p1 h6 white bold clickable btn-outline" v-bind:style="{ backgroundColor: colorMap.searchAnything }" v-on:click.prevent.stop="showSearchModal"><i class="fa fa-search fa-lg">&nbsp;</i>search anything</div>
                            <router-link class="inline-block m1 p1 h6 white bold clickable btn-outline" v-bind:style="{ backgroundColor: colorMap.regular }" :to="{ name: 'viewList', params: { termId: termId } }" tag="div"><i class="fa fa-list fa-lg">&nbsp;</i>all classes</router-link>
                        </div>
                        <div class="right rounded bg-black-transparent" v-show="lock">
                            <div class="inline-block m1 h6 white bold clickable" @click="whyReadOnly">Read Only</div>
                        </div>
                    </div>
                </div>
            </div>
        </transition-group>
        <div class="overflow-hidden bg-white rounded mb2 clearfix" v-show="!lock && !ready">
            <div class="m0 p2">
                Loading...
            </div>
        </div>
        <div id="calendar-container" class="overflow-hidden bg-white mb2 clearfix h6" v-show="ready">
            <div class="m0 p1">
                <div v-bind:id="'calendar-' + termId"></div>
            </div>
        </div>
        <div class="overflow-hidden bg-white rounded mb2 clearfix">
            <div class="m0 p1">
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
            <div class="m0 p1">
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
            lock: false,
            inflight: false
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
        },
        lockMinMax: function() {
            return this.$store.getters.lockMinMax;
        }
    },
    watch: {
        'lockMinMax': function(old, oldVal) {
            var self = this;
            self.$store.dispatch('refreshCalendar')
            .then(function() {
                self.scrollToTop()
            })
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
                self.scrollToTop()
                return self.$store.dispatch('restoreEventsColor', termId)
                .then(function() {
                    return Bluebird.mapSeries(currentAwait, function(evt) {
                        // we first remove all awaitSelections of the old one
                        return self.$store.dispatch('removeFromSource', {
                            termId: termId,
                            courseNum: evt.number
                        }).then(function() {
                            // don't add section selection for Multiple
                            if (evt.multiple === true) return;
                            // Then add back the "chooose later"
                            return self.$store.dispatch('pushToEventSource', {
                                termId: termId,
                                courseObj: evt.course
                            })
                        })
                    })
                })
            })
        },
        scrollToTop: function() {
            if (this.lockMinMax) return;
            $('html, body').animate({
                scrollTop: $("#calendar-container").offset().top - 60
            }, 250);
        },
        promptForAction: function(calEvent) {
            if (this.inflight) return;
            var self = this;
            this.inflight = true;
            var promise = this._promptForAction(calEvent);
            if (typeof promise.then === 'function') {
                return promise.then(function() {
                    self.inflight = false;
                });
            }else{
                this.inflight = false;
                return Bluebird.resolve();
            }
        },
        _promptForAction: function(calEvent) {
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
                    if (calEvent.multiple === true) {
                        return self.$store.dispatch('selectMultiple', {
                            termId: termId,
                            courseNum: calEvent.number
                        })
                    } else {
                        return self.$store.dispatch('pushSectionToEventSource', {
                            termId: termId,
                            courseNum: calEvent.number,
                            sectionNum: calEvent.sectionNum
                        })
                    }
                })
                .then(function() {
                    self.$store.dispatch('refreshCalendar')
                    self.alert.success(self.flatCourses[termId][calEvent.number].c + ' added to the planner!');
                    self.scrollToTop();
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
                        courseNum: calEvent.number,
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
                                    return self.displaySectionsOnCalendar(calEvent.number);
                                }else{
                                    return self.promptToRemove(calEvent);
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

            return Bluebird.all([
                this.$store.dispatch('checkForMultiple', {
                    termId: termId,
                    courseNum: course.num
                }),
                this.$store.dispatch('getCourseDom', {
                    termId: termId,
                    courseObj: course,
                    isSection: false
                })
            ]).spread(function(multiple, html) {
                if (code !== false || code === null) {
                    alertHandle = function() {
                        return self.alert
                        .okBtn(code === null ? 'Taking the same class twice?' : 'Conflict with ' + code)
                        .alert(html)
                    }
                }else{
                    alertHandle = function() {
                        var alert = self.alert.okBtn('Add Class').cancelBtn('Go Back');
                        if (multiple.length > 1) {
                            alert = alert.okBtn('Show All On Calendar');
                        }
                        return alert.confirm(html)
                        .then(function(resolved) {
                            resolved.event.preventDefault();
                            if (resolved.buttonClicked !== 'ok') throw new Error();
                            if (multiple.length > 1) {
                                return self.displayMultipleOnCalendar(multiple)
                            }else{
                                return self.$store.dispatch('pushToEventSource', {
                                    termId: termId,
                                    courseObj: course
                                })
                            }
                        }).then(function() {
                            self.$store.dispatch('refreshCalendar')
                            if (multiple.length > 1) self.alert.success('Showing all ' + course.c + ' on the planner!');
                            else self.alert.success(course.c + ' added to the planner!');
                        }).catch(function() {

                        })
                    }
                }
                return alertHandle()
            })
        },
        displayMultipleOnCalendar: function(multiple) {
            var self = this;
            var termId = this.termId;
            this.searchModal = false;
            return self.$store.dispatch('grayOutEvents', termId)
            .then(function() {
                return self.$store.dispatch('pushMultipleToEventSource', {
                    termId: termId,
                    multiple: multiple
                })
            })
        },
        displaySectionsOnCalendar: function(courseNum) {
            this.$store.getters.loading.go(50);
            var self = this;
            var termId = this.termId;
            this.searchModal = false;
            return this.$store.dispatch('removeFromSource', {
                termId: termId,
                courseNum: courseNum
            }).then(function() {
                self.$store.getters.loading.go(60);
                return self.$store.dispatch('grayOutEvents', termId)
            }).then(function() {
                self.$store.getters.loading.go(70);
                return self.$store.dispatch('pushAwaitSectionsToEventSource', {
                    termId: termId,
                    courseNum: courseNum
                })
            }).then(function() {
                self.$store.getters.loading.go(100);
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
                slotDuration: '00:30:00',
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
                    if (self.inflight) return;
                    return self.jumpOutAwait().then(function() {
                        return self.$store.dispatch('refreshCalendar')
                    })
                }
            })
        },
        saveCalendarAsImage: function() {
            var self = this;
            this.$store.getters.loading.go(30);
            html2canvas(document.getElementById('calendar-container'), {
                useCORS: true
            }).then(function(canvas) {
                self.$store.getters.loading.go(60);
                canvas.toBlob(function(blob) {
                    self.$store.getters.loading.go(100);
                    saveAs(blob, 'Schedule for ' + self.$store.getters.termName + '.png');
                    if (self.$store.getters.Tracker !== null) {
                        self.$store.getters.Tracker.trackEvent('saveCalendarAsImage', 'clicked')
                    }
                });
            })
        },
        saveCalendarAsICS: function() {
            var self = this;
            self.$store.dispatch('exportICS');
            if (self.$store.getters.Tracker !== null) {
                self.$store.getters.Tracker.trackEvent('saveCalendarAsICS', 'clicked')
            }
        },
        bookmark: function() {
            var html = '';
            this.$store.dispatch('dispatchReplaceHash');

            html += ['<p>', '<i>', 'Now you can bookmark this page!', '</i>', '</p>'].join('');
            html += ['<p>', 'Your planner will show up when you visit this URL on another device.', '</p>'].join('');
            html += ['<p>', '(That means you can share this URL to your friends!)', '</p>'].join('');
            html += ['<p class="pt1 px2 mt1">', '<input type="text" class="field block h6 bookmark" onmouseover="this.select()">', '</p>'].join('');

            this.alert
            .okBtn('I\'m Done!')
            .alert(html)
            .then(function(resolved) {
                window.location.hash = '';
            })

            if (this.$store.getters.Tracker !== null) {
                this.$store.getters.Tracker.trackEvent('bookmark', 'clicked')
            }

            setTimeout(function() {
                try {
                    var element = document.getElementsByClassName('bookmark')[0];
                    element.value = window.location.href;
                    element.select();
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
            .alert(html);

            if (this.$store.getters.Tracker !== null) {
                this.$store.getters.Tracker.trackEvent('showShareMenu', 'clicked')
            }
        },
        whyReadOnly: function() {
            var html = '<p class="h6 muted">Why can\'t I modify the planner?</p>';
            html += '<p>You are accessing the planner via a bookmark link, therefore you cannot make any changes.</p>';
            html += '<hr />';
            html += '<a class="btn" onclick="window.location.href = window.location.href.substr(0, window.location.href.indexOf(\'#\'));">Click here to return to your planner</a>';

            this.alert
            .okBtn('OK')
            .alert(html)
        }
    },
    mounted: function() {
        var self = this;
        this.$store.getters.loading.go(30);
        this.$store.dispatch('setTitle', 'Planner');
        return self.$store.dispatch('fetchTermCourses').then(function() {
            self.$store.commit('setTermName', self.$store.getters.termsList[self.$store.getters.termId])
            return self.$store.dispatch('decodeHash')
            .then(function() {
                // no valid was decoded
                self.$store.dispatch('showDisclaimer')
                return self.$store.dispatch('loadAutosave', {
                    termId: self.termId,
                    alert: true
                })
            })
            .catch(function(e) {
                // hash was used instead of local copy
                self.lock = true;
            })
        }).then(function() {
            self.$store.getters.loading.go(70);
            self.ready = true;
            self.$store.dispatch('lockMinMax').then(function() {
                self.initializeCalendar();
                self.$store.dispatch('refreshCalendar', self.scrollToTop)
            })
        }).catch(function(e) {
            console.log(e);
            self.ready = false;
            self.$store.getters.alert.error('Cannot load course data!')
        }).finally(function() {
            if (!self.lock && self.ready) self.$store.commit('shouldAddMargin', true);
            self.$store.getters.loading.go(100);
        })
    },
    beforeDestroy: function() {
        var termId = this.termId;
        $('#calendar-' + termId).fullCalendar('destroy')
    }
}
</script>

<style>
ul {
    max-height: 20em;
}

.fc-agenda-view tr {
     height: 30px;
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
