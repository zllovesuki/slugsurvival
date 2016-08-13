var listen = [
    'mergeEventSource',
    'removeFromSource'
];
var helper = require('../helper')

module.exports = function(storage) {
    return function(store) {
        store.subscribe(function(mutation, state) {
            if (listen.indexOf(mutation.type) !== -1) {
                var termId = mutation.payload[0];
                var array = helper.compact(state.events[termId]);
                storage.setItem(termId, array);
            }
        })
    }
}
