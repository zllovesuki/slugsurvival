var listen = [
    'mergeEventSource',
    'removeFromSource'
];
var helper = require('../helper')

module.exports = function(storage) {
    return function(store) {
        store.subscribe(function(mutation, state) {
            if (mutation.payload.skipSaving === true) return;
            switch(mutation.type) {
                case 'saveAcademicPlanner':
                return Bluebird.reduce(Object.keys(mutation.payload.table), function(yearTotal, year) {
                    return Bluebird.reduce(Object.keys(mutation.payload.table[year]), function(quarterTotal, quarter) {
                        return mutation.payload.table[year][quarter].length > 0 ? quarterTotal + 1 : quarterTotal;
                    }, 0)
                    .then(function(qTotal) {
                        return qTotal > 0 ? yearTotal + 1 : yearTotal;
                    })
                }, 0)
                .then(function(total) {
                    if (total > 0) {
                        storage.setItem('academicPlanner', {
                            plannerYear: mutation.payload.plannerYear,
                            table: mutation.payload.table
                        })
                    }else{
                        storage.removeItem('academicPlanner')
                    }
                })
                break;
                case 'mergeEventSource':
                case 'removeFromSource':
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
                break;
                default:
                break;
            }
        })
    }
}
