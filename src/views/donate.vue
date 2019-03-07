<style>
.bmc-button img{
    width: 27px !important;
    margin-bottom: 1px !important;
    box-shadow: none !important;
    border: none !important;
    vertical-align: middle !important;
}
.bmc-button{
    line-height: 36px !important;
    height:37px !important;
    text-decoration: none !important;
    display:inline-flex !important;
    color:#ffffff !important;
    background-color:#BB5794 !important;
    border-radius: 3px !important;
    border: 1px solid transparent !important;
    padding: 0px 9px !important;
    font-size: 17px !important;
    letter-spacing:-0.08px !important;
    box-shadow: 0px 1px 2px rgba(190, 190, 190, 0.5) !important;
    -webkit-box-shadow: 0px 1px 2px 2px rgba(190, 190, 190, 0.5) !important;
    margin: 0 auto !important;
    font-family:'Lato', sans-serif !important;
    -webkit-box-sizing: border-box !important;
    box-sizing: border-box !important;
    -o-transition: 0.3s all linear !important;
    -webkit-transition: 0.3s all linear !important;
    -moz-transition: 0.3s all linear !important;
    -ms-transition: 0.3s all linear !important;
    transition: 0.3s all linear !important;
}
.bmc-button:hover, .bmc-button:active, .bmc-button:focus {
    -webkit-box-shadow: 0px 1px 2px 2px rgba(190, 190, 190, 0.5) !important;
    text-decoration: none !important;
    box-shadow: 0px 1px 2px 2px rgba(190, 190, 190, 0.5) !important;
    opacity: 0.85 !important;
    color:#ffffff !important;
}
</style>
<template>
    <div>
        <div class="ml1 mt1 mb1">
            <router-link class="btn button-narrow mxn2 muted" :to="{ name: 'donate' }" tag="span">&#128521;</router-link>
            <chevron-right></chevron-right>
            <span class="btn button-narrow mxn1 h5">
                Buy Me a Coffee
            </span>
        </div>
        <div class="mt1 mb1">
            <div class="overflow-hidden bg-white rounded mb2 clearfix">
                <div class="m0 p2">
                    <div class="clearfix">
                        <h3>If you like my work, please consider donating.</h3>
                    </div>
                </div>
                <div class="m0 p2 border-top">
                    <div class="clearfix">
                        <h3 class="muted">Buy Me a Latte</h3>
                        <a class="bmc-button m1" target="_blank" href="https://www.buymeacoffee.com/miragespace"><img src="https://www.buymeacoffee.com/assets/img/BMC-btn-logo.svg" alt="Buy me a Latte"><span style="margin-left:5px">Buy me a Latte</span></a>
                    </div>
                    <div class="clearfix">
                        <h3 class="muted">PayPal</h3>
                        <a class="h5 flex-auto black clickable btn btn-outline" target="_blank" href="https://paypal.me/miragespace">paypal.me/miragespace</a>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
<script>
module.exports = {
    components: {
        chevronRight: require('../lib/icons/chevron-right.vue')
    },
    data: function() {
        return {}
    },
    mounted: function() {
        this.$store.dispatch('hideSpinner')
        this.$store.dispatch('setTitle', 'Donate');
    }
}
</script>
