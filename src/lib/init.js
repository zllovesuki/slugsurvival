var MobileDetect = require('mobile-detect')

module.exports = function(_, router) {
    var element = document.getElementById('loading');
    element.parentNode.removeChild(element);

    _.dispatch('removeLegacyStorage')

    _.dispatch('checkVersion')
    _.dispatch('addOnlineOfflineListener')
    _.dispatch('realtime')

    _.commit('saveMobileDetect', new MobileDetect(window.navigator.userAgent))

    router.beforeEach(function(to, from, next) {
        _.commit('shouldAddMargin', false);
        _.dispatch('showSpinner').then(function() {
            _.dispatch('ensureDataLoaded').then(next);
        });
    })

    router.afterEach(function(to, from) {
        if (from.name === null) return
        if (_.getters.Tracker !== null) {
            _.getters.Tracker.setCustomUrl(window.location.origin + to.path)
            _.getters.Tracker.setDocumentTitle(to.name)
            _.getters.Tracker.trackPageView()
        }
    })
}
