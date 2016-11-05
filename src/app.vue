<template>
    <div>
        <div class="fixed bottom-0 right-0 m2" style="z-index: 2000">
			<a class="btn block muted" @click="showFeedback">
				<i class="fa fa-warning">&nbsp;</i>
			</a>
		</div>
        <section id="container" class="container clearfix" v-bind:class="{ 'mt3': shouldAddMargin }">
            <div class="clearfix mt3">
                <div class="mb2 sm-flex center nowrap">
                    <div class="flex-auto block">
                        <router-link class="inline h2 clickable" :to="{ name: 'mainPage' }" tag="span">SlugSurvival | <small class="muted" >{{ title }}</small></router-link>
                    </div>
                </div>

                <div class="p0 col col-12">
                    <transition name="fade" mode="out-in">
                        <router-view></router-view>
                    </transition>
                    <div class="mt2 mb1">
                        <transition name="fade" mode="out-in">
                            <div class="overflow-hidden bg-white rounded mb2" v-show="!termListsLoaded">
                                <div class="m0 p2">
                                    <div class="clearfix">
                                        Loading...
                                    </div>
                                </div>
                            </div>
                        </transition>
                    </div>
                </div>
            </div>
        </section>
        <div class="container mb2 clearfix">
            <div class="sm-flex center mb2 h6">
                <div class="flex-auto muted">
                    <div class="clearfix">
                        <router-link v-bind:class="'h6 bold btn ' + color" :to="{ name: 'mainPage' }">Main Page</router-link>
                        <router-link v-bind:class="'h6 bold btn ' + color" :to="{ name: 'explainText' }">What is SlugSurvival?</router-link>
                        <router-link v-bind:class="'h6 bold btn ' + color" :to="{ name: 'explainPrivacy' }">Privacy Policy</router-link>
                    </div>
                    <div class="clearfix" @click="egg">
                        version {{ version }}
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
module.exports = {
    data: function() {
        return {
            version: require('../version.json')
        }
    },
    computed: {
        route: function() {
            return this.$store.getters.route;
        },
        shouldAddMargin: function() {
            return ['viewList', 'term'].indexOf(this.route.name) !== -1
        },
        color: function() {
            return this.$store.getters.color;
        },
        title: function() {
            return this.$store.getters.title;
        },
        colorMap: function() {
            return this.$store.getters.colorMap;
        },
        termListsLoaded: function() {
            return this.$store.getters.termListsLoaded;
        }
    },
    methods: {
        egg: function() {
            this.$store.getters.alert.okBtn('WTF').alert('<img src="https://img.s3.fmt01.sdapi.net/16360519.gif" alt="" />')
        },
        showFeedback: function() {
            this.$store.getters.alert.okBtn('OK').alert('<a class="btn" href="https://goo.gl/forms/LuDkBkoQodzQLJz92" target="_blank">Found a problem? Click here to report!</a>')
        }
    },
    mounted: function() {
        // global context
        window.App = this;
        if (typeof Piwik !== 'undefined') {
            this.$store.commit('setTracker', Piwik.getAsyncTracker())
            this.$store.getters.Tracker.enableHeartBeatTimer(10);
        }
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
}
#container.modal-open {
    overflow: hidden;
}

::selection {
    background: #ffb7b7;
    /* WebKit/Blink Browsers */
}

.bg-black-transparent {
    background-color: rgba(0, 0, 0, 0.5);
}

#top-bar {
    width: 100%;
    max-width: 64em;
    z-index: 10;
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

.fade-enter-active, .fade-leave-active {
  transition: opacity .25s
}
.fade-enter, .fade-leave-active {
  opacity: 0
}
.list-complete-enter, .list-complete-leave-active {
  opacity: 0;
  transform: translateY(30px);
}
.list-complete-leave-active {
  position: absolute;
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
