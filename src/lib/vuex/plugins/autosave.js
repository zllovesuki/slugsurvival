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
            }else if (mutation.type === 'saveAcademicPlanner') {
                if (Object.keys(mutation.payload).reduce(function(yearTotal, year) {
                    return Object.keys(mutation.payload[year]).reduce(function(quarterTotal, quarter) {
                        return mutation.payload[year][quarter].length > 0 ? quarterTotal + 1 : quarterTotal;
                    }, 0) > 0 ? yearTotal + 1 : yearTotal;
                }, 0) > 0) {
                    storage.setItem('academicPlanner', mutation.payload)
                }else{
                    storage.removeItem('academicPlanner')
                }
            }
        })
    }
}
