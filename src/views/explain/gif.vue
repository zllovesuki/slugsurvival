<template>
    <div>
        <div class="overflow-hidden bg-white rounded mb2 clearfix">
            <div class="m0 p2">
                <div class="clearfix">
                    <h3>Instantly Search For Classes</h3>
                    <p>
                        <img src="https://rachel.s3.fmt01.sdapi.net/img/slugsurvival-campaign/add-3.gif" alt="" />
                    </p>
                </div>
            </div>
            <div class="m0 p2 border-top">
                <div class="clearfix">
                    <h3>Select Section with Ease</h3>
                    <p>
                        <img src="https://rachel.s3.fmt01.sdapi.net/img/slugsurvival-campaign/choose-section-3.gif" alt="" />
                    </p>
                </div>
            </div>
            <div class="m0 p2 border-top">
                <div class="clearfix">
                    <h3>You Have Other Obligations?</h3>
                    <p>
                        <img src="https://rachel.s3.fmt01.sdapi.net/img/slugsurvival-campaign/own-2.gif" alt="" />
                    </p>
                </div>
            </div>
            <div class="m0 p2 border-top">
                <div class="clearfix">
                    <h3>Instantly Checks For Schedule Conflicts (!)</h3>
                    <p>
                        <img src="https://rachel.s3.fmt01.sdapi.net/img/slugsurvival-campaign/conflict-2.gif" alt="" />
                    </p>
                </div>
            </div>
            <div class="m0 p2 border-top">
                <div class="clearfix">
                    <h3>Check Openings in Real Time</h3>
                    <p>
                        <img src="https://rachel.s3.fmt01.sdapi.net/img/slugsurvival-campaign/real-time-2.gif" alt="" />
                    </p>
                </div>
            </div>
            <div class="m0 p2 border-top">
                <div class="clearfix">
                    <h3>... and RateMyProfessors</h3>
                    <p>
                        <img src="https://rachel.s3.fmt01.sdapi.net/img/slugsurvival-campaign/rmp-2.gif" alt="" />
                    </p>
                </div>
            </div>
            <div class="m0 p2 border-top">
                <div class="clearfix">
                    <h3>Be Notified for Changes</h3>
                    <p>
                        <img src="https://rachel.s3.fmt01.sdapi.net/img/slugsurvival-campaign/tracker.gif" alt="" />
                    </p>
                </div>
            </div>
            <div class="m0 p2 border-top">
                <div class="clearfix">
                    <h3>Of Course You Can Unsubscribe</h3>
                    <p>
                        <img src="https://rachel.s3.fmt01.sdapi.net/img/slugsurvival-campaign/manage.gif" alt="" />
                    </p>
                </div>
            </div>
            <div class="m0 p2 border-top">
                <div class="clearfix">
                    <h3>(new) Analyze Changes</h3>
                    <p>
                        <img src="https://rachel.s3.fmt01.sdapi.net/img/slugsurvival-campaign/analytics.gif" alt="" />
                    </p>
                </div>
            </div>
        </div>
    </div>
</template>
<script>

module.exports = {
    mounted: function() {
        this.$store.dispatch('setTitle', 'gif')
        this.$store.dispatch('hideSpinner')
    }
}
</script>
