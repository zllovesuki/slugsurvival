<template>
    <div>
        <div class="overflow-hidden bg-white rounded mb2">
			<div class="m0 p1">
				<div class="clearfix">
					<span class="btn black h5">Check Openings in Real Time: </span>
				</div>
				<div class="clearfix">
					<span class="ml1 btn black h6 muted not-clickable">
                        You can check the openings in real time when you search for classes in the planner.
                    </span>
				</div>
			</div>
			<div class="m0 p2 border-top">
				<div class="clearfix">
					<a class="h6 ml1 mb1 bold btn btn-outline white" v-bind:style="{ backgroundColor: colorMap.regular }" v-link="{ name: 'termsList' }">Take me to the Interactive Planner</a>
				</div>
			</div>
		</div>
		<div class="overflow-hidden bg-white rounded mb2" v-if="ready">
			<div class="m0 p1">
				<div class="clearfix">
					<span class="btn black h5">Notify Me When There Are Changes: </span>
				</div>
				<div class="clearfix">
					<span class="ml1 btn black h6 muted not-clickable">
                        SlugSurvival will notify you when your desired classes have significant changes (eg. Open -> Closed, 25% seats remaining, etc).
                    </span>
				</div>
                <div class="clearfix">
					<span class="ml1 btn black h6 not-clickable">
                        <a class="h6 bold btn btn-outline white" v-bind:style="{ backgroundColor: colorMap.alert }" v-link="{ name: 'enrollManage' }" target="_blank">But I Signed Up Already</a>
                    </span>
				</div>
			</div>
            <div class="m0 p1 border-top">
				<div class="clearfix">
                    <span class="btn black h5">First, add the classes that you want to be notified for: </span>
                </div>
                <div class="m0 p2">
                    <div class="clearfix">
                        <a class="h6 ml1 mb1 bold btn btn-outline white" v-bind:style="{ backgroundColor: colorMap.searchAnything }" @click="showSearchModal">search anything</a>
                        &nbsp; or,
                        <a class="h6 ml1 mb1 bold btn btn-outline white" v-bind:style="{ backgroundColor: colorMap.regular }" @click="importPlanner">Import from Local Planner</a>
                    </div>
                </div>
                <div class="clearfix">
                    <span class="btn black h5">For {{ termName }}: </span>
				</div>
				<div class="clearfix">
					<table class="h6 col col-12">
						<template v-for="course in courses" track-by="num">
							<tr>
								<td class="col col-6">
									<span class="btn clickable left" @click="showCourse(monitoredTerm, course)">{{ course.c }} - {{ course.s }}</span>
								</td>
							</tr>
						</template>
                        <tr v-show="courses.length === 0">
                            <td class="col col-6">
                                <span class="btn not-clickable left muted">(none)</span>
                            </td>
                        </tr>
					</table>
				</div>
			</div>
			<div class="m0 p1 border-top" v-show="courses.length > 0">
                <div class="clearfix">
                    <span class="btn black h5">Then, select one or more ways to be notified. </span>
                </div>
                <div class="m0 p2">
    				<div class="clearfix">
    					<a class="h6 ml1 mb1 bold btn btn-outline white" v-bind:style="{ backgroundColor: colorMap.regular }" @click="showSub">Via SMS</a>
                        <a class="h6 ml1 mb1 bold btn btn-outline white" v-bind:style="{ backgroundColor: colorMap.regular }" @click="showSub">Via Email</a>
                        <a class="h6 ml1 mb1 bold btn btn-outline white" v-bind:style="{ backgroundColor: colorMap.regular }" @click="comingSoon">Via Push Notifications</a>
    				</div>
                </div>
			</div>
		</div>
        <search :show.sync="searchModal" :callback="addToNotifyList" :selected-term-id="monitoredTerm"></search>
        <modal :show.sync="sub.modal">
			<h4 slot="header">Subscribe to Changes</h4>
			<span slot="body">
				<form v-on:submit.prevent class="h5">
                    <label for="recipient" class="mt2 block">
                        <input type="text" class="col-8 mb2 field inline-block" v-model="sub.recipient" placeholder="15554443333/hello@me.com">
                        <button type="submit" class="col-3 btn btn-outline ml1 mb2 inline-block {{ color }}" :disabled="sub.verified || !sub.recipient.length > 0 || sub.sent || sub.sendInflight" @click="sendVerify">{{ sub.text }}</button>
                    </label>
                    <label for="code" class="mt2 block" v-if="sub.sent">
                        <input type="text" class="col-8 mb2 field inline-block" v-model="sub.code" placeholder="passcode received">
                        <button type="submit" class="col-3 btn btn-outline ml1 mb2 inline-block {{ color }}" :disabled="sub.verified || !sub.code.length > 0 || sub.verifyInflight" @click="verifyCode">Verify</button>
                    </label>
                    <hr />
					<span class="block mb1">
                        We take privacy seriously.
                        <a class="h6 bold {{ color }}" v-link="{ name: 'explainPrivacy' }" target="_blank"> Learn More</a>
                    </span>
				</form>
			</span>
		</modal>
    </div>
</template>

<script>
var getters = require('../../lib/vuex/getters.js')
var actions = require('../../lib/vuex/actions.js')
var config = require('../../../config')

module.exports = {
    vuex: {
        getters: getters,
        actions: actions
    },
    data: function() {
        return {
            ready: false,
            searchModal: false,
            monitoredTerm: config.monitoredTerm,
            courses: [],
            sub: {
                modal: false,
                recipient: '',
                code: '',
                text: 'Get code',
                counter: 300,
                sent: false,
                sendInflight: false,
                verified: false,
                verifyInflight: false,
                shouldResend: false,
                timer: null
            }
        }
    },
    methods: {
        showSub: function() {
            this.sub.recipient = '';
            this.sub.modal = true;
        },
        sendVerify: function() {
            var self = this;
            self.loading.go(30);
            self.sub.sendInflight = true;
            return fetch(config.notifyURL + '/verify/' + (self.sub.shouldResend ? 'resend' : 'new'), {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    recipient: self.sub.recipient
                })
            })
            .then(function(res) {
                self.loading.go(50);
                return res.json()
                .catch(function(e) {
                    return res.text();
                })
            })
            .then(function(res) {
                self.loading.go(100);
                self.sub.sendInflight = false;
                if (!res.ok) {
                    return self.alert().error(res.message);
                }
                self.sub.sent = true;
                self.sub.timer = setInterval(function() {
                    if (self.sub.counter === 0) {
                        self.sub.text = 'Resend';
                        self.sub.shouldResend = true;
                        self.sub.sent = false;
                        self.sub.counter = 300;
                        return clearInterval(self.sub.timer);
                    }
                    self.sub.text = 'Resend (' + self.sub.counter + ')'
                    self.sub.counter--;
                }, 1000)
            })
            .catch(function(e) {
                console.log(e);
                self.loading.go(100);
                self.sub.sendInflight = false;
                self.alert().error('An error has occurred.')
            })
        },
        verifyCode: function() {
            var self = this;
            self.loading.go(30);
            self.sub.verifyInflight = true;
            return fetch(config.notifyURL + '/verify/check', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    recipient: self.sub.recipient,
                    code: self.sub.code
                })
            })
            .then(function(res) {
                self.loading.go(50);
                return res.json()
                .catch(function(e) {
                    return res.text();
                })
            })
            .then(function(res) {
                self.loading.go(70);
                self.sub.verifyInflight = false;
                if (!res.ok) {
                    self.loading.go(100);
                    return self.alert().error(res.message);
                }
                self.updateWatch(self.sub.recipient, self.sub.code, self.courses)
                .then(function() {
                    clearInterval(self.sub.timer);
                    self.sub.verified = true;
                    self.sub.text = 'Verified';
                    self.sub.shouldResend = false;
                    self.sub.sent = false;
                    self.sub.counter = 300;
                    self.sub.modal = false;
                    self.loading.go(100);
                    self.route.router.go({ name: 'enrollManage'})
                    self.alert().success('Subscribed to changes!');
                })
            })
            .catch(function(e) {
                console.log(e);
                self.loading.go(100);
                self.sub.verifyInflight = false;
                self.alert().error('An error has occurred.')
            })
        },
        showSearchModal: function() {
            this.searchModal = true;
            setTimeout(function() {
                document.getElementsByClassName('search-box')[0].focus();
            }, 75);
        },
        showCourse: function(termId, course) {
            var html = this.getCourseDom(termId, course);
            return this.alert()
            .okBtn('Remove Class')
            .cancelBtn("Go Back")
            .confirm(html)
            .then(function(resolved) {
                resolved.event.preventDefault();
                if (resolved.buttonClicked !== 'ok') return;
                return this.alert()
                .okBtn("Yes")
                .cancelBtn("No")
                .confirm('Remove ' + course.c + ' from the list?')
                .then(function(resolved) {
                    resolved.event.preventDefault();
                    if (resolved.buttonClicked !== 'ok') return;
                    this.removeFromList(course);
                    this.alert().success('Removed!');
                }.bind(this));
            }.bind(this));
        },
        removeFromList: function(course) {
            this.courses = this.courses.filter(function(el) {
                return el.num !== course.num
            })
        },
        importPlanner: function() {
            // In case the user is accessing via a bookmark link
            this.emptyEventSource(this.monitoredTerm);
            // Force to load from local
            return this.loadAutosave(this.monitoredTerm + '', false)
            .then(function() {
                var events = this.eventSource[this.monitoredTerm];
                if (!events) return;
                this.courses = [];
                var compact = this.helper().compact(events);
                var split = [], course, courseInfo;

                for (var i = 0, length = compact.length; i < length; i++) {
                    split = compact[i].split('-');
                    if (split[0] / 100000 >= 1) continue;
                    course = this.flatCourses[this.monitoredTerm][split[0]];
                    this.courses.push(course)
                }
            }.bind(this))
        },
        addToNotifyList: function(course) {
            var html = this.getCourseDom(this.monitoredTerm, course);
            return this.alert()
            .okBtn('Notify')
            .cancelBtn("Go Back")
            .confirm(html)
            .then(function(resolved) {
                resolved.event.preventDefault();
                if (resolved.buttonClicked !== 'ok') return;
                this.alert().success(course.c + ' added to the list!');
                this.courses.push(course);
            }.bind(this));
        }
    },
    created: function() {

    },
    ready: function() {
        var self = this;
        this.loading.go(30);
        this.setTitle('Tracker');

        this.fetchTermCourses(this.monitoredTerm)
        .then(function() {
            self.loading.go(100);
            self.ready = true;
        })
    }
}
</script>
