<template>
    <div>
        <div class="ml1 mt1 mb1">
            <router-link class="btn button-narrow mxn2 muted" :to="{ name: 'analyticsCourse' }" tag="span">A</router-link>
            <chevron-right></chevron-right>
            <span class="btn button-narrow mxn1">
                Analytics (alpha)
            </span>
        </div>
        <div class="mt2 mb1">
            <transition name="fade" mode="out-in">
                <router-view></router-view>
            </transition>
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

<style>
.selectize-input input[type="text"] {
    width: 150px !important;
    height: 1rem !important;
}
</style>
