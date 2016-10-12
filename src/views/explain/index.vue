<template>
    <div>
        <div class="ml1 mt1 mb1">
            <router-link class="btn button-narrow mxn2 muted" :to="{ name: 'mainPage' }" tag="span">?</router-link>
            <chevron-right></chevron-right>
            <span class="btn button-narrow mxn1">
                Explaining Things
            </span>
        </div>
        <div class="mt2 mb1">
            <router-view></router-view>
        </div>
    </div>
</template>
<script>
module.exports = {
    components: {
        chevronRight: require('../../lib/icons/chevron-right.vue')
    }
}
</script>
