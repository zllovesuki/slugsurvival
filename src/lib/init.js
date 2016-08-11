module.exports = function(_, router) {
    router.beforeEach(function (transition) {
        router.app.ensureDataLoaded().then(function() {
            transition.next();
        })
    })
}
