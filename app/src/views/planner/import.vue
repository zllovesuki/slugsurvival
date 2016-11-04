<template>
    <div>
        <div class="overflow-hidden bg-white rounded mb2 clearfix" v-show="!enabled">
            <div class="m0 p2">
                <div class="clearfix">
                    <p>Unfortunately, due to security reasons, the website version of SlugSurvival does not support importing.</p>
                    <p>(Because it needs your GoldID credentials)</p>
                    <p>You need to download the desktop application to use this functionality.</p>
                    <p>(So nothing will be processed on our servers)</p>
                    <div class="md-flex center">
                        <a class="btn flex-auto"><i class="fa fa-windows fa-2x">&nbsp;</i>Windows</a>
                        <a class="btn flex-auto"><i class="fa fa-apple fa-2x">&nbsp;</i>macOS</a>
                        <a class="btn flex-auto"><i class="fa fa-linux fa-2x">&nbsp;</i>Linux</a>
                    </div>
                </div>
            </div>
        </div>
        <div class="overflow-hidden bg-white rounded mb2 clearfix" v-show="enabled">
            <div class="m0 p2">
                <div class="clearfix">
                    Hi
                </div>
            </div>
        </div>
    </div>
</template>

<script>
module.exports = {
    data: function() {
        return {
            enabled: typeof inElectron !== 'undefined'
        }
    }
}
</script>
