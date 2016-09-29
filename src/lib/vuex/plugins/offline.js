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

                return fetch('/db/timestamp/terms/' + termId + '.json')
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

                return fetch('/db/timestamp/courses/' + termId + '.json')
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

                case 'buildIndexedSearch':

                var index = mutation.payload[1];
                var workaround = mutation.payload[2];
                var skipSaving = mutation.payload[3];

                if (skipSaving) return;

                if (!workaround) {
                    return fetch('/db/timestamp/index/' + termId + '.json')
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
