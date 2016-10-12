<template>
    <div>
        <div class="ml1 mt1 mb1">
            <router-link class="btn button-narrow mxn2 muted" :to="{ name: 'analytics' }" tag="span">A</router-link>
            <chevron-right></chevron-right>
            <span class="btn button-narrow mxn1">
                Analytics (alpha)
            </span>
        </div>
        <div class="mt2 mb1">
            <router-view transition="fade"></router-view>
        </div>
    </div>
</template>
<script>
module.exports = {
    created: function() {
        var self = this;
        $script([dist + 'Chart.js/2.3.0/Chart.bundle.min.js', dist + 'moment/2.14.1/moment.min.js'], 'Chart.js')
    }
}
</script>
