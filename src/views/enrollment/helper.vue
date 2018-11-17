<template>
    <div>
        <transition-group name="fade" mode="out-in">
    		<div class="overflow-hidden bg-white rounded mb2" v-if="ready" key="notify">
    			<div class="m0 p1">
    				<div class="clearfix">
    					<span class="btn black h4">Notify Me When My Class Changes: </span>
    				</div>
    				<div class="clearfix">
    					<span class="ml1 btn black h5 muted not-clickable">
                            SlugSurvival will notify you when your desired classes have significant changes (eg. Open -> Closed, 25% seats remaining, cancelled, etc).
                        </span>
    				</div>
    			</div>
                <div class="m0 p1 border-top">
    				<div class="clearfix">
                        <span class="btn black h4">First, add the classes that you want to be notified for: </span>
                    </div>
                    <div class="m0 p1">
                        <div class="clearfix">
                            <div class="md-flex">
                                <div class="p1 flex m1 h6 white bold clickable btn-outline" v-bind:style="{ backgroundColor: colorMap.searchAnything }" @click="showSearchModal"><i class="fa fa-search fa-lg">&nbsp;</i>search anything</div>
                                <div class="p1 flex m1 h6 black bold clickable btn-outline" v-bind:style="{ backgroundColor: colorMap.blank }" @click="importPlanner"><i class="fa fa-cart-arrow-down fa-lg">&nbsp;</i>or, Import from Local Planner</div>
                            </div>
                        </div>
                    </div>
                    <div class="clearfix">
                        <select class="col col-6 p1 ml1 h6" id="quarters"></select>
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
    			<div class="m0 p1 border-top">
                    <div class="clearfix">
                        <span class="btn black h4">Then, select one or more ways to be notified. </span>
                    </div>
                    <div class="m0 p1">
        				<div class="clearfix">
                            <div class="md-flex">
                                <div class="p1 flex m1 h6 bold black clickable btn-outline" v-bind:style="{ backgroundColor: colorMap.blank }" @click="showSub"><i class="fa fa-phone-square fa-lg">&nbsp;</i>Via SMS</div>
                                <div class="p1 flex m1 h6 bold black clickable btn-outline" v-bind:style="{ backgroundColor: colorMap.blank }" @click="showSub"><i class="fa fa-envelope fa-lg">&nbsp;</i>Via Email</div>
                            </div>
        				</div>
                    </div>
    			</div>
            </div>
        </transition-group>
        <div class="overflow-hidden bg-white rounded mb2">
            <div class="m0 p1">
                <div class="clearfix">
					<span class="btn black h4">Manage My Subscription: </span>
				</div>
				<div class="clearfix">
					<span class="ml1 btn black h5 muted not-clickable">
                        You can edit the list of classes being notified, or unsubscribe notification altogether.
                    </span>
				</div>
			</div>
            <div class="m0 p1 border-top">
                <div class="clearfix">
                    <div class="sm-flex ml1">
                        <router-link class="p1 m1 h6 btn white clickable btn-outline" v-bind:style="{ backgroundColor: colorMap.regular }" :to="{ name: 'enrollManage' }" tag="div"><i class="fa fa-pencil fa-lg">&nbsp;</i> Manage subscription</router-link>
                    </div>
				</div>
			</div>
		</div>
        <search :show="searchModal" :resetOnShow="true" v-on:close="searchModal = false" :callback="addToNotifyList" :selected-term-id="termCode"></search>
        <modal :show="sub.modal" v-on:close="sub.modal = false">
			<h4 slot="header">Subscribe to Changes</h4>
			<span slot="body">
				<form v-on:submit.prevent class="h5">
                    <label for="recipient" class="mt2 block">
                        <input type="text" class="col-8 mb1 field inline-block" v-model="sub.recipient" placeholder="phone number or email">
                        <button type="submit" class="col-3 btn ml1 mb1 inline-block black" v-bind:class="{'muted': sub.verified || sub.cooldown || !sub.recipient.length > 0 || (sub.counter > 0 && sub.counter < 60) || sub.sendInflight}" :disabled="sub.verified || sub.cooldown || !sub.recipient.length > 0 || (sub.counter > 0 && sub.counter < 60) || sub.sendInflight" @click="sendVerify">{{ sub.text }}</button>
                    </label>
                    <label for="code" class="mt2 block" v-if="sub.sent">
                        <input type="text" class="col-8 mb1 field inline-block" v-model="sub.code" placeholder="passcode received">
                        <button type="submit" class="col-3 btn ml1 mb1 inline-block black" v-bind:class="{'muted': sub.verified || !sub.code.length > 0 || sub.verifyInflight}" :disabled="sub.verified || !sub.code.length > 0 || sub.verifyInflight" @click="verifyCode">Verify</button>
                    </label>
                    <label for="reset" class="mnx2 mt2 block h6" v-if="sub.sent">
                        <button type="submit" class="col-10 btn mb1 inline-block black" v-bind:class="{'muted': sub.verified || sub.verifyInflight || sub.sendInflight}" :disabled="sub.verified || sub.verifyInflight || sub.sendInflight" @click="startAgain">
                            Oops start over please
                        </button>
                    </label>
                    <span class="btn black h6 muted not-clickable" v-show="!sub.sent">
                        Please include country code for your phone number. <br />
                        For example: 18314590111
                    </span>
                    <span class="btn black h6 clickable" @click="hasCode" v-show="!sub.sent">
                        <u>Click here if you already have a code</u>
                    </span>
                    <hr />
                    <span class="btn black h6 not-clickable" v-show="!sub.sent">
                        (up to 1 message/4-hour/course)<br />
                        You will receive message like:
                    </span>
                    <span class="btn black h6 muted not-clickable" v-show="!sub.sent">
                        CHEM 1N - 01 (61326) has 2 events: <br/>
                        1) Status changes to Open (from Closed). <br/>
                        2) Has 25% or less available seats remaining (1 available, was 0).
                    </span>
                    <hr v-show="!sub.sent"/>
					<span class="block h6 mb1">
                        We take privacy seriously.
                        <router-link v-bind:class="'h6 ' + color" :to="{ name: 'explainPrivacy' }" target="_blank"> Learn More</router-link>
                    </span>
				</form>
			</span>
		</modal>
    </div>
</template>

<script>
var helper = require('../../lib/vuex/helper')
var config = require('../../../config')
var request = require('superagent')

module.exports = {
    data: function() {
        return {
            ready: false,
            searchModal: false,
            courses: [],
            termCode: null,
            selectizeRef: null,
            sub: {
                modal: false,
                recipient: '',
                code: '',
                text: 'Get code',
                counter: 120,
                sent: false,
                sendInflight: false,
                cooldown: false,
                verified: false,
                verifyInflight: false,
                shouldResend: false,
                timer: null
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
        termDates: function() {
            return this.$store.getters.termDates;
        }
    },
    watch: {
        'termCode': function(val, oldVal) {
            if (!this.ready) return;
            this.termCode = val;
            this.switchTerm(oldVal);
        }
    },
    methods: {
        hasCode: function() {
            this.sub.sent = true
            this.sub.text = ''
        },
        showSub: function() {
            if (this.courses.length === 0) return this.alert.error('Add classes first!')
            this.sub.recipient = '';
            this.sub.modal = true;
        },
        sendVerify: function() {
            var self = this;
            self.$store.dispatch('showSpinner')
            self.sub.sendInflight = true;
            self.alert.success('Loading... Please do not click again.')
            if (self.$store.getters.Tracker !== null) {
                self.$store.getters.Tracker.trackEvent('sendVerify', 'recipient', self.sub.recipient);
            }
            return request.post(config.notifyURL + '/' + (self.sub.shouldResend ? 'verifyResend' : 'verifyNewUser'))
            .send({
                recipient: self.sub.recipient,
                termId: parseInt(self.termCode)
            })
            .ok(function(res) {
                return true
            })
            .then(function(res) {
                return res.body
            })
            .then(function(res) {
                self.$store.dispatch('hideSpinner')
                self.sub.sendInflight = false;
                self.sub.cooldown = true;
                self.sub.counter -= 1;
                if (res.ok !== true) {
                    self.startAgain()
                    return self.alert.error(res.message || 'An error has occured.');
                }
                self.sub.sent = true;
                self.sub.timer = setInterval(function() {
                    if (self.sub.counter === 0) {
                        self.$nextTick(function() {
                            self.sub.text = 'Resend';
                            self.sub.shouldResend = true;
                            self.sub.cooldown = false;
                            self.sub.counter = 120;
                        })
                        return clearInterval(self.sub.timer);
                    }
                    self.sub.text = 'Resend (' + self.sub.counter + ')'
                    self.sub.counter--;
                }, 1000)
            })
        },
        startAgain: function() {
            this.resetSub({text: 'Get Code', verified: false, modal: true})
        },
        verifyCode: function() {
            var self = this;
            self.$store.dispatch('showSpinner')
            self.sub.verifyInflight = true;
            self.alert.success('Loading... Please do not click again.')
            return request.post(config.notifyURL + '/verifyUser')
            .send({
                recipient: self.sub.recipient,
                code: parseInt(self.sub.code),
                termId: parseInt(self.termCode)
            })
            .ok(function(res) {
                return true
            })
            .then(function(res) {
                return res.body
            })
            .then(function(res) {
                if (res.ok !== true) {
                    self.sub.verifyInflight = false;
                    self.$store.dispatch('hideSpinner')
                    return self.alert.error(res.message || 'An error has occured.');
                }
                if (self.$store.getters.Tracker !== null) {
                    self.$store.getters.Tracker.trackEvent('verified', 'recipient', self.sub.recipient);
                }
                return self.$store.dispatch('updateWatch', {
                    recipient: self.sub.recipient,
                    code: self.sub.code,
                    courses: self.courses,
                    termId: self.termCode
                })
                .then(function() {
                    clearInterval(self.sub.timer);
                    self.$store.dispatch('hideSpinner')
                    self.alert.success('Subscribed to changes!');
                    self.$router.push({ name: 'enrollManage'})
                    if (self.$store.getters.Tracker !== null) {
                        self.$store.getters.Tracker.trackEvent('updateWatch', 'new_courses', self.courses.map(function(el) { return el.c; }).join(','));
                    }
                })
            })
        },
        resetSub: function(merge) {
            clearInterval(this.sub.timer)
            this.sub = Object.assign({
                recipient: '',
                code: '',
                counter: 120,
                sent: false,
                sendInflight: false,
                cooldown: false,
                verifyInflight: false,
                shouldResend: false,
                timer: null
            }, merge)
        },
        showSearchModal: function() {
            this.searchModal = true;
            setTimeout(function() {
                document.getElementsByClassName('search-box')[0].focus();
            }, 75);
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
                        if (self.$store.getters.Tracker !== null) {
                            self.$store.getters.Tracker.trackEvent('enrollment', 'remove', termId + '_' + course.num)
                        }
                    });
                });
            })
        },
        removeFromList: function(course) {
            this.courses = this.courses.filter(function(el) {
                return el.num !== course.num
            })
        },
        importPlanner: function() {
            var self = this;
            // In case the user is accessing via a bookmark link
            return this.$store.dispatch('emptyEventSource', this.termCode)
            .then(function() {
                // Force to load from local
                return self.$store.dispatch('loadAutosave', {
                    termId: self.termCode + '',
                    alert: false
                })
                .then(function() {
                    var events = self.$store.getters.eventSource[self.termCode];
                    if (!events) return;
                    self.courses = [];
                    var compact = helper.compact(events);
                    var split = [], course, courseInfo;

                    for (var i = 0, length = compact.length; i < length; i++) {
                        split = compact[i].split('-');
                        if (split[0] / 100000 >= 1) continue;
                        course = self.flatCourses[self.termCode][split[0]];
                        self.courses.push(course)
                    }
                })
            })
        },
        addToNotifyList: function(course) {
            var self = this;

            try {
                if (this.$store.getters.Tracker !== null) {
                    this.$store.getters.Tracker.trackEvent('searchCb', 'clicked', termId + '_' + course.c + '-' + course.s)
                }
            }catch(e) {}

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
                    if (resolved.buttonClicked !== 'ok') {
                        self.$store.getters.Tracker.trackEvent('enrollment', 'back', self.termCode + '_' + course.num)
                        return
                    }
                    self.alert.success(course.c + ' added to the list!');
                    self.courses.push(course);
                    if (self.$store.getters.Tracker !== null) {
                        self.$store.getters.Tracker.trackEvent('enrollment', 'add', self.termCode + '_' + course.num)
                    }
                });
            })
        },
        switchTerm: function(oldTermCode) {
            var self = this;
            self.courses = [];
            self.$store.dispatch('showSpinner')
            self.$store.commit('setTermName', null)
            if (!!oldTermCode) self.$store.commit('emptyTerm', oldTermCode)
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
        this.$store.dispatch('setTitle', 'Tracker');

        this.$store.dispatch('showDisclaimer')

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
