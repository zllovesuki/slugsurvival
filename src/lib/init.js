var MobileDetect = require('mobile-detect')

module.exports = function(_, router) {
    _.dispatch('removeLegacyStorage')

    _.dispatch('checkVersion')
    _.dispatch('addOnlineOfflineListener')
    _.dispatch('realtime')

    _.commit('saveMobileDetect', new MobileDetect(window.navigator.userAgent))

    router.beforeEach(function(to, from, next) {
        _.commit('shouldAddMargin', false);
        _.dispatch('showSpinner').then(next);
    })

    router.afterEach(function(to, from) {
        if (from.name === null) return
        if (_.getters.Tracker !== null) {
            _.getters.Tracker.setCustomUrl(window.location.origin + to.path)
            _.getters.Tracker.setDocumentTitle(to.name)
            _.getters.Tracker.trackPageView()
        }
    })

    return _.dispatch('ensureDataLoaded').then(function() {
        window.loading_screen.finish()
    })
}
