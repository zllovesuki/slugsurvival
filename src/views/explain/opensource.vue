<template>
    <div>
        <div class="overflow-hidden bg-white rounded mb2 clearfix">
            <div class="m0 p2">
                <div class="clearfix">
                    <h3>SlugSurvival: Open Source</h3>
                </div>
            </div>
            <div class="m0 p2 border-top">
                <div class="clearfix">
                    <h3 class="muted">Being Creative Shouldn't Be Difficult</h3>
                    <ol>
                        <li>
                            Which is why I encourage UCSC students to make and create.
                        </li>
                        <li>
                            Hopefully making this service more accessible for developers will help.
                        </li>
                        <li>
                            This page is a WIP. I will update as I find fit.
                        </li>
                        <li>
                            If you have more questions, don't hesitate to send me an email or send me a message via live chat.
                        </li>
                        <li>
                            Let's jump straight into it.
                        </li>
                    </ol>
                </div>
            </div>
            <div class="m0 p2 border-top">
                <div class="clearfix">
                    <h3 class="muted">However</h3>
                    <ol>
                        <li>
                            If you do decide to use my APIs, please leave a credit when it is due.
                        </li>
                        <li>
                            Something like "Data Provided by SlugSurvival" (with a link pointed to this page) is sufficient.
                        </li>
                    </ol>
                </div>
            </div>
            <div class="m0 p2 border-top">
                <div class="clearfix">
                    <h3 class="muted">Data: Terms Information</h3>
                    <p>
                        <pre>https://data.slugsurvival.com/terms</pre> contains the list of terms in JSON format
                    </p>
                </div>
            </div>
            <div class="m0 p2 border-top">
                <div class="clearfix">
                    <h3 class="muted">Data: Term Information</h3>
                    <p>
                        There are two parts of a term. Access via <pre>https://data.slugsurvival.com/term/:termCode</pre>
                    </p>
                    <p>
                        Key 'term' contains the essential information. Under each key is the subject, and the value is an array of the courses.
                    </p>
                    <p>
                        Key 'courses' contains a more detailed information. Under each key is the course number, and the value is an object pertains to the information about the course.
                    </p>
                </div>
            </div>
            <div class="m0 p2 border-top">
                <div class="clearfix">
                    <h3 class="muted">Data: RateMyProfessors Mapping</h3>
                    <p>
                        <pre>https://data.slugsurvival.com/rmp</pre> contains a map of professor's name (FirstnameLastname) to corresponding teacher ID (tid) on RateMyProfessors
                    </p>
                </div>
            </div>
            <div class="m0 p2 border-top">
                <div class="clearfix">
                    <h3 class="muted">Data: RateMyProfessors Ratings</h3>
                    <p>
                        There are two parts of a rating. Access via <pre>https://data.slugsurvival.com/rmp/:tid</pre>
                    </p>
                    <p>
                        Key 'stats' contains the essential information. Such as quality.
                    </p>
                    <p>
                        Key 'scores' contains a more detailed information. Such as based on how many ratings, tags, and etc.
                    </p>
                </div>
            </div>
            <div class="m0 p2 border-top">
                <div class="clearfix">
                    <h3 class="muted">Enrollment: Available Terms</h3>
                    <p>
                        <pre>https://tracking.slugsurvival.com/fetch/available</pre> contains an array of terms in which SlugSurvival was/is tracking.
                    </p>
                </div>
            </div>
            <div class="m0 p2 border-top">
                <div class="clearfix">
                    <h3 class="muted">Enrollment: Course</h3>
                    <p>
                        <pre>https://tracking.slugsurvival.com/fetch/:termCode/:courseNum</pre> contains an array of changes for that course.
                    </p>
                    <p>
                        <pre>https://tracking.slugsurvival.com/fetch/:termCode/:courseNum/latestOne</pre> if you only want the latest one.
                    </p>
                </div>
            </div>
            <div class="m0 p2 border-top">
                <div class="clearfix">
                    <h3 class="muted">Enrollment: Realtime</h3>
                    <p>
                        This is a Socket.io only endpoint. Connect to <pre>https://realtime.slugsurvival.com</pre> and listen on 'delta' events.
                    </p>
                </div>
            </div>
            <div class="m0 p2 border-top">
                <div class="clearfix">
                    <h3 class="muted">Notification</h3>
                    <p>
                        This API is currently *not* available for third-party usage.
                    </p>
                </div>
            </div>
        </div>
    </div>
</template>
<script>
module.exports = {
    computed: {
        colorMap: function() {
            return this.$store.getters.colorMap;
        }
    },
    mounted: function() {
        this.$store.dispatch('setTitle', 'Open Source');
        this.$store.dispatch('hideSpinner')
    }
}
</script>
