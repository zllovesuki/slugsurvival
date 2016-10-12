var listen = [
    'mergeEventSource',
    'removeFromSource'
];
var helper = require('../helper')

module.exports = function(storage) {
    return function(store) {
        store.subscribe(function(mutation, state) {
            if (listen.indexOf(mutation.type) !== -1) {
                var termId = mutation.payload.termId;
                if (typeof state.events[termId] !== 'undefined') {
                    // we will not check if the course number is larger than 100000 (custom)
                    // as you should not be able to make changes
                    if (mutation.payload.skipSaving === true) return;
                    var array = helper.compact(state.events[termId]);
                    storage.setItem(termId, array);
                }else{
                    storage.removeItem(termId);
                }
            }
        })
    }
}
