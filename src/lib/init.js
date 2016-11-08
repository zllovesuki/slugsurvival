module.exports = function(_, router) {
    var element = document.getElementById('loading');
    element.parentNode.removeChild(element);

    _.dispatch('checkVersion')
    _.dispatch('addOnlineOfflineListener')

    router.beforeEach(function(to, from, next) {
        _.commit('shouldAddMargin', false);
        _.dispatch('ensureDataLoaded').then(next);
    })
}
