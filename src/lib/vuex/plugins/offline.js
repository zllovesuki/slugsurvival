var config = require('../../../../config');

module.exports = function(storage) {
    return function(store) {
        store.subscribe(function(mutation, state) {

            var termId = mutation.payload[0];

            switch (mutation.type) {
                case 'saveTermCourses':

                var coursesData = mutation.payload[1];
                var skipSaving = mutation.payload[2] || false;

                if (skipSaving) return;

                return fetch(config.dbURL + '/timestamp/terms/' + termId + '.json')
                .then(function(res) {
                    return res.json();
                })
                .then(function(onlineTimestamp) {
                    return Promise.all([
                        storage.setItem('termCourseTimestamp-' + termId, onlineTimestamp),
                        storage.setItem('termCourse-' + termId, coursesData)
                    ])
                })

                break;

                case 'saveCourseInfo':

                var courseInfo = mutation.payload[1];
                var skipSaving = mutation.payload[2] || false;

                if (skipSaving) return;

                return fetch(config.dbURL + '/timestamp/courses/' + termId + '.json')
                .then(function(res) {
                    return res.json();
                })
                .then(function(onlineTimestamp) {
                    return Promise.all([
                        storage.setItem('termCourseInfoTimestamp-' + termId, onlineTimestamp),
                        storage.setItem('termCourseInfo-' + termId, courseInfo)
                    ])
                })

                break;

                case 'saveInstructorNameToTidMapping':

                var rmp = mutation.payload[0];
                var skipSaving = mutation.payload[1] || false;

                if (skipSaving) return;

                return fetch(config.dbURL + '/timestamp/rmp.json')
                .then(function(res) {
                    return res.json();
                })
                .then(function(onlineTimestamp) {
                    return Promise.all([
                        storage.setItem('rmpTimestamp', onlineTimestamp),
                        storage.setItem('rmp', rmp)
                    ])
                })

                break;

                case 'saveTermsList':

                var termsList = mutation.payload[0];
                var skipSaving = mutation.payload[1] || false;

                if (skipSaving) return;

                return fetch(config.dbURL + '/timestamp/terms.json')
                .then(function(res) {
                    return res.json();
                })
                .then(function(onlineTimestamp) {
                    return Promise.all([
                        storage.setItem('termsListTimestamp', onlineTimestamp),
                        storage.setItem('termsList', termsList)
                    ])
                })

                break;

                case 'buildIndexedSearch':

                var index = mutation.payload[1];
                var workaround = mutation.payload[2];
                var skipSaving = mutation.payload[3];

                if (skipSaving) return;

                if (!workaround) {
                    return fetch(config.dbURL + '/timestamp/index/' + termId + '.json')
                    .then(function(res) {
                        return res.json();
                    })
                    .then(function(onlineTimestamp) {
                        return Promise.all([
                            storage.setItem('termIndexTimestamp-' + termId, onlineTimestamp),
                            storage.setItem('termIndex-' + termId, index)
                        ])
                    })
                }

                break;

                default:
                break;
            }
        })
    }
}
