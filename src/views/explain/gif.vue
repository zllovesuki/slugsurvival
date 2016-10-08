<template>
    <div>
        <div class="overflow-hidden bg-white rounded mb2 clearfix">
            <div class="m0 p2">
                <div class="clearfix">
                    <h3>Instantly Search For Classes</h3>
                    <p>
                        <img src="https://img.s3.fmt01.sdapi.net/slugsurvival-campaign/add.gif" alt="" />
                    </p>
                    <hr />
                    <h3>Check Openings in Real Time</h3>
                    <p>
                        <img src="https://img.s3.fmt01.sdapi.net/slugsurvival-campaign/choose-section.gif" alt="" />
                    </p>
                    <p>
                        <img src="https://img.s3.fmt01.sdapi.net/slugsurvival-campaign/real-time.gif" alt="" />
                    </p>
                    <hr />
                    <h3>... and RateMyProfessors</h3>
                    <p>
                        <img src="https://img.s3.fmt01.sdapi.net/slugsurvival-campaign/rmp.gif" alt="" />
                    </p>
                    <hr />
                    <h3>You Have Other Obligations?</h3>
                    <p>
                        <img src="https://img.s3.fmt01.sdapi.net/slugsurvival-campaign/own.gif" alt="" />
                    </p>
                    <hr />
                    <h3>Be Notified for Changes</h3>
                    <p>
                        <img src="https://img.s3.fmt01.sdapi.net/slugsurvival-campaign/tracker.gif" alt="" />
                    </p>
                    <hr />
                    <h3>Of Course You Can Unsubscribe</h3>
                    <p>
                        <img src="https://img.s3.fmt01.sdapi.net/slugsurvival-campaign/manage.gif" alt="" />
                    </p>
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
