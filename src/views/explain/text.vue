<template>
    <div>
        <div class="overflow-hidden bg-white rounded mb2 clearfix">
            <div class="m0 p2">
                <div class="clearfix">
                    <h3>What is this "SlugSurvival" thing?</h3>
                </div>
            </div>
            <div class="m0 p2 border-top">
                <div class="clearfix">
                    <h3 class="muted">Disclaimer</h3>
                    <ol>
                        <li>
                            SlugSurvival is not affiliated with UCSC or any of its family of sites.
                        </li>
                        <li>
                            Selecting courses <b><u>nor</u></b> signing up for notifications on SlugSurvial <b><u>will</u></b> automatically enroll you into the courses in the AIS (my.ucsc.edu).
                        </li>
                    </ol>
                </div>
            </div>
            <div class="m0 p2 border-top">
                <div class="clearfix">
                    <h3 class="muted">TL; DR. Can I just watch a video?</h3>
                    <p>
                        <a class="h6 ml2 mt1 bold btn btn-outline white" v-bind:style="{ backgroundColor: colorMap.regular }" v-link="{ name: 'explainGif' }">Sure, Click Here For a Short Introduction</a>
                    </p>
                </div>
            </div>
            <div class="m0 p2 border-top">
                <div class="clearfix">
                    <h3 class="muted">Short Answer</h3>
                    <p>
                        It's an awesome tool to help you to plan courses.
                    </p>
                </div>
            </div>
            <div class="m0 p2 border-top">
                <div class="clearfix">
                    <h3 class="muted">Long Answer</h3>
                    <ol>
                        <li>
                            SlugSurvival aims to simplifies the process of checking courses on the school's AIS (Academic Information System)
                        </li>
                        <li>
                            Students can find their classes on SlugSurvival instantly instead of waiting for a few seconds
                        </li>
                        <li>
                            Students can check the enrollment status in real time without having to wait for more than 1 second.
                        </li>
                        <li>
                            Students have the liberty of exporting the planner to their choices of calendars, like iCal or Google or Microsoft, or exported as an image.
                        </li>
                    </ol>
                    <p>In addition,</p>
                    <ol>
                        <li>
                            Students can add their own schedules on the planner while planning for courses.
                        </li>
                        <li>
                            <b>Students can choose to be notified (via SMS and/or Email) on course openings changes.</b>
                        </li>
                    </ol>
                </div>
            </div>
        </div>
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
    ready: function() {
        this.setTitle('Explain');
    }
}
</script>
