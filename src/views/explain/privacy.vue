<template>
    <div>
        <div class="overflow-hidden bg-white rounded mb2 clearfix">
            <div class="m0 p2">
                <div class="clearfix">
                    <h3>Let's be real here, No One Is Going to Read 50 Pages.</h3>
                </div>
            </div>
            <div class="m0 p2 border-top">
                <div class="clearfix">
                    <h3 class="muted">What You Care</h3>
                    <ol>
                        <li>
                            Your identity remains anonymous.
                        </li>
                        <li>
                            We <b>do</b> have analytics to track page views. However, you do <a href="https://communistanalytics.com/index.php?module=CoreAdminHome&action=optOut&language=en" target="_blank">have a choice to opt-out</a>.
                        </li>
                        <li>
                            We <b>do not</b> store your personal data (except when you sign up for notifications, then we have your phone number and/or email address).
                        </li>
                        <li>
                            We <b>do not</b> moniterize the data collected. <i>This website/service is provided strictly for a charitable cause: helping new/continuing students.</i>
                        </li>
                    </ol>
                </div>
            </div>
            <div class="m0 p2 border-top">
                <div class="clearfix">
                    <h3 class="muted">Ask Me Anything</h3>
                    <p>
                        If you have furthur questions and/or concerns, please <a href="mailto:inbox@chens.email">shoot me an email</a>.
                    </p>
                </div>
            </div>
        </div>
    </div>
</template>
<script>
module.exports = {
    mounted: function() {
        this.$store.dispatch('setTitle', 'Privacy');
        this.$store.dispatch('hideSpinner')
    }
}
</script>
