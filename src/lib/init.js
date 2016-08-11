module.exports = function(_, router) {
    var element = document.getElementById('loading');
    element.parentNode.removeChild(element);
    
    router.beforeEach(function (transition) {
        router.app.ensureDataLoaded().then(function() {
            transition.next();
        })
    })
}
