module.exports = function(_, router) {
    var element = document.getElementById('loading');
    element.parentNode.removeChild(element);

    _.dispatch('checkVersion')
    _.dispatch('addOnlineOfflineListener')

    router.beforeEach(function(to, from, next) {
        if (typeof Piwik !== 'undefined' && _.getters.Tracker === null) {
            _.commit('setTracker', Piwik.getAsyncTracker())
            _.getters.Tracker.enableHeartBeatTimer(10);
        }

        if (_.getters.Tracker !== null) {
            _.getters.Tracker.trackEvent('pageView', 'triggered', from.name + '_' + to.name)
        }

        _.commit('shouldAddMargin', false);
        _.dispatch('showSpinner').then(function() {
            _.dispatch('ensureDataLoaded').then(next);
        });
    })
}
