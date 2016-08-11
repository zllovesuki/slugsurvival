var listen = [
    'pushToEventSource',
    'removeFromSource'
];

module.exports = function(storage) {
    return function(store) {
        store.subscribe(function(mutation, state) {
            if (listen.indexOf(mutation.type) !== -1) {
                var termId = mutation.payload[0];
                storage.setItem(termId, state.events[termId])
            }
        })
    }
}
