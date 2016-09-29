<template>
    <div>
        <section id="container" class="container clearfix">
            <div class="clearfix mt3">
                <div class="mb2 sm-flex center nowrap">
                    <div class="flex-auto block">
                        <p class="inline h2 clickable" v-link="{ name: 'index' }">SlugSurvival | <small class="muted" >{{ title }}</small></p>
                    </div>
                </div>

                <div class="p0 col col-12">
                    <router-view transition="fade"></router-view>
                </div>
            </div>
        </section>
        <div class="container mb2 clearfix">
            <div class="sm-flex center nowrap mb2 h5">
                <div class="flex-auto muted" @click="egg">version 1.12.0</div>
            </div>
        </div>
    </div>
</template>

<script>
var _st = require('./lib/vuex/store.js')
var getters = require('./lib/vuex/getters.js')
var actions = require('./lib/vuex/actions.js')

module.exports = {
    store: _st,
    vuex: {
        getters: getters,
        actions: actions
    },
    methods: {
        egg: function() {
            this.alert().alert('<img src="https://img.s3.fmt01.sdapi.net/16360519.gif" alt="" />');
        }
    },
    ready: function() {
        // global context
        window.App = this;
    }
}
</script>

<style>
hr {
    border: 0;
    height: 1px;
    background-image: linear-gradient(to right, rgba(0, 0, 0, 0), rgba(0, 0, 0, 0.75), rgba(0, 0, 0, 0));
}

body {
    font-family: "Lato", "Helvetica Neue", "Luxi Sans", "DejaVu Sans", Tahoma, "Hiragino Sans GB", "Microsoft Yahei", sans-serif;
    font-size: 1em;
    line-height: 1.5;
    background-color: #f1f2f3;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
}

body.modal-open {
    overflow: hidden;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
}

::selection {
    background: #ffb7b7;
    /* WebKit/Blink Browsers */
}

::-moz-selection {
    background: #ffb7b7;
    /* Gecko Browsers */
}

ul li {
    list-style-type: none;
}

pre {
    overflow-x: hidden;
}

pre code {
    display: block;
    overflow-x: auto;
    background: white;
    color: #4d4d4c;
    font-family: Menlo, Monaco, Consolas, monospace;
    line-height: 1.25;
    padding: 10px;
}

.clickable {
    cursor: pointer;
}

.not-clickable {
    cursor: default;
}

a.link {
    color: inherit;
    text-decoration: none;
}

img {
    display: block;
    margin: 0 auto;
}

svg {
    max-width: 100%;
    height: auto
}

.icon,
svg {
    position: relative;
    top: .25em
}

.icon {
    width: 1em;
    height: 1em
}

.fade-transition {
    transition: all .5s ease;
}

.fade-enter,
.fade-leave {
    opacity: 0;
    transform: translate3d(10px, 0, 0);
}

.x-scrollable {
    overflow-x: auto;
    overflow-y: hidden;
}

.y-scrollable {
    overflow-x: hidden;
    overflow-y: auto;
}

.alertify p {
    margin-bottom: 0.5rem !important;
}

.alertify .dialog .msg {
    padding: 5px !important;
}

@media (max-height: 480px) {
    .alertify .dialog>* {
        max-height: 400px;
        overflow: auto;
    }
}

@media (min-height: 480px) and (max-height: 600px) {
    .alertify .dialog>* {
        max-height: 420px;
        overflow: auto;
    }
}

@media (min-height: 600px) and (max-height: 680px) {
    .alertify .dialog>* {
        max-height: 528px;
        overflow: auto;
    }
}
</style>
