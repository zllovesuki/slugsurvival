<template>
    <div>
        <div class="overflow-hidden bg-white rounded mb2" v-if="ready">
			<div class="m0 p1">
				<div class="clearfix">
					<span class="btn black h5">Manage Your Subscription</span>
				</div>
				<div class="clearfix">
                    <span class="ml1 btn black h6 muted not-clickable">
                        To retrive your notification subscription, login with your phone number/emails and your passcode.
                    </span>
				</div>
			</div>
			<div class="m0 p2 border-top" v-show="!sub.verified">
				<div class="clearfix">
                    <span class="btn black h6 not-clickable">
                        <form v-on:submit.prevent="checkSub" class="h6">
                            <label for="term" class="block mb2">
                                <select class="col-12 inline-block" id="quarters"></select>
                            </label>
                            <label for="recipient" class="block">
                                <input type="text" class="col-12 field inline-block" v-model="sub.recipient" placeholder="phone/email">
                            </label>
                            <label for="code" class="mt2 block">
                                <input type="text" class="col-12 field inline-block" v-model="sub.code" placeholder="passcode">
                            </label>
                            <label for="submit" class="mt2 block">
                                <button type="submit" class="btn btn-outline inline-block white" v-bind:style="{ backgroundColor: colorMap.regular }" :disabled="sub.inFlight">Check</button>
                            </label>
        				</form>
                    </span>
				</div>
			</div>
            <div class="m0 p1 border-top" v-show="sub.verified">
                <div class="m0 p2">
                    <div class="clearfix">
                        <div class="sm-flex">
                            <div class="p1 flex m1 h6 btn white clickable" v-bind:style="{ backgroundColor: colorMap.searchAnything }" @click="showSearchModal"><i class="fa fa-search fa-lg">&nbsp;</i>search anything</div>
                        </div>
                    </div>
                </div>
                <div class="clearfix">
                    <span class="btn black h5">For {{ termName }}: </span>
				</div>
				<div class="clearfix">
                    <table class="h6 col col-12">
                        <tr v-for="course in courses" :key="course.num">
                            <td class="col col-6">
                                <span class="btn clickable left" @click="showCourse(termCode, course)">{{ course.c }} - {{ course.s }}</span>
                            </td>
                        </tr>
                        <tr v-show="courses.length === 0">
                            <td class="col col-6">
                                <span class="btn not-clickable left muted">(none)</span>
                            </td>
                        </tr>
					</table>
				</div>
			</div>
            <div class="m0 p1 border-top" v-show="sub.verified">
                <div class="clearfix">
                    <span class="btn black h5">What would you like to do?</span>
                </div>
                <div class="m0 p2">
    				<div class="clearfix">
                        <button type="button" class="h6 ml1 mb1 bold btn btn-outline white" v-bind:style="{ backgroundColor: colorMap.regular }" :disabled="sub.inFlight" @click="update">Update Subscription</button>
                        <button type="button" class="h6 ml1 mb1 bold btn btn-outline white" v-bind:style="{ backgroundColor: colorMap.alert }" :disabled="sub.inFlight" @click="unSub">Unsubscribe Me</button>
    				</div>
                </div>
			</div>
		</div>
        <search :show="searchModal" v-on:close="searchModal = false" :callback="addToNotifyList" :selected-term-id="termCode"></search>
    </div>
</template>

<script>
var config = require('../../../config')

module.exports = {
    data: function() {
        return {
            ready: false,
            searchModal: false,
            availableTerms: [],
            termCode: null,
            selectizeRef: null,
            courses: [],
            sub: {
                recipient: '',
                code: '',
                inFlight: false,
                verified: false
            }
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
        color: function() {
            return this.$store.getters.color;
        },
        flatCourses: function() {
            return this.$store.getters.flatCourses;
        },
        termName: function() {
            return this.$store.getters.termName;
        },
        termDates: function() {
            return this.$store.getters.termDates;
        }
    },
    watch: {
        'termCode': function(val, oldVal) {
            if (!this.ready) return;
            this.termCode = val;
            this.switchTerm();
        }
    },
    methods: {
        showSearchModal: function() {
            this.searchModal = true;
            setTimeout(function() {
                document.getElementsByClassName('search-box')[0].focus();
            }, 75);
        },
        addToNotifyList: function(course) {
            var self = this;
            return self.$store.dispatch('getCourseDom', {
                termId: self.termCode,
                courseObj: course,
                isSection: false
            })
            .then(function(html) {
                return self.alert
                .okBtn('Notify')
                .cancelBtn("Go Back")
                .confirm(html)
                .then(function(resolved) {
                    resolved.event.preventDefault();
                    if (resolved.buttonClicked !== 'ok') return;
                    self.alert.success(course.c + ' added to the list!');
                    self.courses.push(course);
                });
            })
        },
        update: function() {
            var self = this;
            self.$store.dispatch('showSpinner')
            self.sub.inFlight = true;
            return self.$store.dispatch('updateWatch', {
                recipient: self.sub.recipient,
                code: self.sub.code,
                courses: self.courses,
                termId: self.termCode
            })
            .then(function() {
                self.$store.dispatch('hideSpinner')
                self.sub.inFlight = false;
                self.alert.success('Subscription list updated.');
                if (self.$store.getters.Tracker !== null) {
                    self.$store.getters.Tracker.trackEvent('updateWatch', 'update_courses', self.courses.map(function(el) { return el.c; }).join(','));
                }
            })
        },
        unSub: function() {
            var self = this;
            self.$store.dispatch('showSpinner')
            return fetch(config.notifyURL + '/verify/stop', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    recipient: self.sub.recipient,
                    code: self.sub.code,
                    termId: self.termCode
                })
            })
            .then(function(res) {
                return res.json()
                .catch(function(e) {
                    return res.text();
                })
            })
            .then(function(res) {
                self.$store.dispatch('hideSpinner')
                if (!res.ok) {
                    return self.alert.error(res.message);
                }
                if (self.$store.getters.Tracker !== null) {
                    self.$store.getters.Tracker.trackEvent('unsubscribe', 'recipient', self.sub.recipient);
                }
                self.$store.dispatch('hideSpinner')
                self.sub.inFlight = false;
                self.alert.success('Unsubscribed. You will no longer receive notifications.');
                self.$router.push({ name: 'enrollHelper'})
            })
            .catch(function(e) {
                console.log(e);
                self.$store.dispatch('hideSpinner')
                self.sub.inFlight = false;
                self.alert.error('An error has occurred.')
            })
        },
        checkSub: function() {
            var self = this;
            self.$store.dispatch('showSpinner')
            self.sub.inFlight = true;
            return fetch(config.notifyURL + '/watch/get', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    recipient: self.sub.recipient,
                    code: self.sub.code,
                    termId: self.termCode
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
                    self.$store.dispatch('hideSpinner')
                    self.sub.inFlight = false;
                    return self.alert.error(res.message);
                }
                self.$store.dispatch('hideSpinner')
                self.sub.verified = true;
                self.sub.inFlight = false;
                self.courses = res.courses.map(function(num) {
                    return self.flatCourses[self.termCode][num]
                });
            })
            .catch(function(e) {
                console.log(e);
                self.$store.dispatch('hideSpinner')
                self.sub.inFlight = false;
                self.alert.error('An error has occurred.')
            })
        },
        showCourse: function(termId, course) {
            var self = this;
            return self.$store.dispatch('getCourseDom', {
                termId: termId,
                courseObj: course,
                isSection: false
            })
            .then(function(html) {
                return self.alert
                .okBtn('Remove Class')
                .cancelBtn("Go Back")
                .confirm(html)
                .then(function(resolved) {
                    resolved.event.preventDefault();
                    if (resolved.buttonClicked !== 'ok') return;
                    return self.alert
                    .okBtn("Yes")
                    .cancelBtn("No")
                    .confirm('Remove ' + course.c + ' from the list?')
                    .then(function(resolved) {
                        resolved.event.preventDefault();
                        if (resolved.buttonClicked !== 'ok') return;
                        self.removeFromList(course);
                        self.alert.success('Removed!');
                    });
                });
            })
        },
        removeFromList: function(course) {
            this.courses = this.courses.filter(function(el) {
                return el.num !== course.num
            })
        },
        switchTerm: function() {
            var self = this;
            self.courses = [];
            self.$store.dispatch('showSpinner')
            self.$store.commit('setTermName', self.$store.getters.termsList[self.termCode])
            return self.$store.dispatch('fetchTermCourses', self.termCode).then(function() {
                self.$store.dispatch('hideSpinner')
            })
        },
        initSelectize: function() {
            var self = this;
            this.selectizeRef = $('#quarters').selectize({
                options: self.availableTerms.map(function(term) {
                    return { text: term.name, value: term.code }
                }),
                placeholder: 'select a quarter...',
                dropdownParent: "body",
                hideSelected: true,
                onChange: function(val) {
                    self.termCode = val;
                },
                render: {
                    option: function(item, escape) {
                        return '<div class="h6">' + escape(item.text) + '</div>';
                    },
                    item: function(item, escape) {
                        return '<div class="h6 inline-block">' + escape(item.text) + '</div>';
                    }
                }
            })
        }
    },
    mounted: function() {
        var self = this;
        this.$store.dispatch('setTitle', 'Manage');

        return self.$store.dispatch('fetchAvailableTerms')
        .then(function(list) {
            self.availableTerms = list.filter(function(term) {
                return self.termDates[term.code].start !== null;
            });
            self.termCode = self.availableTerms[self.availableTerms.length - 1].code;
            return self.switchTerm();
        })
        .then(function() {
            self.ready = true;
            self.$nextTick(function() {
                self.initSelectize()
                // TODO: don't hard code this
                $('#quarters-selectized').prop('readonly', true)
                self.selectizeRef[0].selectize.setValue(self.termCode)
                self.$store.dispatch('hideSpinner')
            })
        })
    },
    beforeDestroy: function() {
        // garbage collection
        this.selectizeRef[0].selectize.destroy()
    }
}
</script>
