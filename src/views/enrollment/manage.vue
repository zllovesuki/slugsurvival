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
                            <label for="recipient" class="block">
                                <input type="text" class="col-12 field inline-block" v-model="sub.recipient" placeholder="phone/email">
                            </label>
                            <label for="code" class="mt2 block">
                                <input type="text" class="col-12 field inline-block" v-model="sub.code" placeholder="passcode">
                            </label>
                            <label for="submit" class="mt2 block">
                                <button type="submit" class="btn btn-primary inline-block" :disabled="sub.inFlight">Check</button>
                            </label>
        				</form>
                    </span>
				</div>
			</div>
            <div class="m0 p1 border-top" v-show="sub.verified">
                <div class="m0 p2">
                    <div class="clearfix">
                        <a class="muted h6 bold btn btn-outline black" @click="showSearchModal">search anything</a>
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
            <div class="m0 p1 border-top" v-show="sub.verified">
                <div class="clearfix">
                    <span class="btn black h5">What would you like to do?</span>
                </div>
                <div class="m0 p2">
    				<div class="clearfix">
                        <button type="button" class="muted h6 ml1 mb1 bold btn btn-outline {{ color }}" :disabled="sub.inFlight" @click="update">Update Subscription</button>
                        <button type="button" class="muted h6 ml1 mb1 bold btn btn-outline red" :disabled="sub.inFlight" @click="unSub">Unsubscribe Me</button>
    				</div>
                </div>
			</div>
		</div>
        <search :show.sync="searchModal" :callback="addToNotifyList" :selected-term-id="monitoredTerm"></search>
    </div>
</template>

<script>
var getters = require('../../lib/vuex/getters.js')
var actions = require('../../lib/vuex/actions.js')
var helper = require('../../lib/vuex/helper.js')
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
                recipient: '',
                code: '',
                inFlight: false,
                verified: false
            }
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
        },
        update: function() {
            var self = this;
            self.loading.go(30);
            self.sub.inFlight = true;
            return self.updateWatch(self.sub.recipient, self.sub.code, self.courses)
            .then(function() {
                self.loading.go(100);
                self.sub.inFlight = false;
                self.alert().success('Subscription list updated.');
            })
        },
        unSub: function() {
            var self = this;
            self.loading.go(30);
            return fetch(config.notifyURL + '/verify/stop', {
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
                self.loading.go(100);
                if (!res.ok) {
                    return self.alert().error(res.message);
                }
                self.loading.go(100);
                self.sub.inFlight = false;
                self.route.router.go({ name: 'enrollHelper'})
                self.alert().success('Unsubscribed. You will no longer receive notifications.');
            })
            .catch(function(e) {
                console.log(e);
                self.loading.go(100);
                self.sub.inFlight = false;
                self.alert().error('An error has occurred.')
            })
        },
        checkSub: function() {
            var self = this;
            self.loading.go(30);
            self.sub.inFlight = true;
            return fetch(config.notifyURL + '/watch/get', {
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
                if (!res.ok) {
                    self.loading.go(100);
                    self.sub.inFlight = false;
                    return self.alert().error(res.message);
                }
                self.loading.go(100);
                self.sub.verified = true;
                self.sub.inFlight = false;
                self.courses = res.courses.map(function(num) {
                    return self.flatCourses[self.monitoredTerm][num]
                });
            })
            .catch(function(e) {
                console.log(e);
                self.loading.go(100);
                self.sub.inFlight = false;
                self.alert().error('An error has occurred.')
            })
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
        }
    },
    ready: function() {
        var self = this;
        this.loading.go(30);
        this.setTitle('Manage');

        this.fetchTermCourses(this.monitoredTerm)
        .then(function() {
            self.loading.go(100);
            self.ready = true;
        })
    }
}
</script>