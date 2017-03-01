var config = require('../../../../config');

module.exports = function(storage) {
    return function(store) {
        store.subscribe(function(mutation, state) {

            var termId;
            if (mutation.payload && mutation.payload.termId) termId = mutation.payload.termId;

            switch (mutation.type) {
                case 'saveTermCourses':

                var coursesData = mutation.payload.coursesData;
                var skipSaving = mutation.payload.skipSaving || false;

                if (skipSaving) return;

                return fetch(config.dbURL + '/timestamp/terms/' + termId + '.json')
                .then(function(res) {
                    return res.json();
                })
                .then(function(onlineTimestamp) {
                    return Bluebird.all([
                        storage.setItem('termCourseTimestamp-' + termId, onlineTimestamp),
                        storage.setItem('termCourse-' + termId, coursesData)
                    ])
                })

                break;

                case 'saveCourseInfo':

                var courseInfo = mutation.payload.courseInfo;
                var skipSaving = mutation.payload.skipSaving || false;

                if (skipSaving) return;

                return fetch(config.dbURL + '/timestamp/courses/' + termId + '.json')
                .then(function(res) {
                    return res.json();
                })
                .then(function(onlineTimestamp) {
                    return Bluebird.all([
                        storage.setItem('termCourseInfoTimestamp-' + termId, onlineTimestamp),
                        storage.setItem('termCourseInfo-' + termId, courseInfo)
                    ])
                })

                break;

                case 'saveInstructorNameToTidMapping':

                var rmp = mutation.payload.rmp;
                var skipSaving = mutation.payload.skipSaving || false;

                if (skipSaving) return;

                return fetch(config.dbURL + '/timestamp/rmp.json')
                .then(function(res) {
                    return res.json();
                })
                .then(function(onlineTimestamp) {
                    return Bluebird.all([
                        storage.setItem('rmpTimestamp', onlineTimestamp),
                        storage.setItem('rmp', rmp)
                    ])
                })

                break;

                case 'saveTermsList':

                var termsList = mutation.payload.termsList;
                var skipSaving = mutation.payload.skipSaving || false;

                if (skipSaving) return;

                return fetch(config.dbURL + '/timestamp/terms.json')
                .then(function(res) {
                    return res.json();
                })
                .then(function(onlineTimestamp) {
                    return Bluebird.all([
                        storage.setItem('termsListTimestamp', onlineTimestamp),
                        storage.setItem('termsList', termsList)
                    ])
                })

                break;

                case 'saveSubjects':

                var subjects = mutation.payload.subjects;
                var skipSaving = mutation.payload.skipSaving || false;

                if (skipSaving) return;

                return fetch(config.dbURL + '/timestamp/subjects.json')
                .then(function(res) {
                    return res.json();
                })
                .then(function(onlineTimestamp) {
                    return Bluebird.all([
                        storage.setItem('subjectsTimestamp', onlineTimestamp),
                        storage.setItem('subjects', subjects)
                    ])
                })

                case 'saveMajorMinor':

                var mm = mutation.payload.mm;
                var skipSaving = mutation.payload.skipSaving || false;

                if (skipSaving) return;

                return fetch(config.dbURL + '/timestamp/major-minor.json')
                .then(function(res) {
                    return res.json();
                })
                .then(function(onlineTimestamp) {
                    return Bluebird.all([
                        storage.setItem('mmTimestamp', onlineTimestamp),
                        storage.setItem('majorMinor', mm)
                    ])
                })

                break;

                case 'saveHistoricData':

                var historicData = mutation.payload.historicData;
                var skipSaving = mutation.payload.skipSaving || false;

                if (skipSaving) return;

                return fetch(config.dbURL + '/timestamp/terms.json')
                .then(function(res) {
                    return res.json();
                })
                .then(function(onlineTimestamp) {
                    return Bluebird.all([
                        storage.setItem('historicDataTimestamp', onlineTimestamp),
                        storage.setItem('historicData', historicData)
                    ])
                })

                break;

                case 'flipLockMinMax':

                storage.setItem('lockMinMax', state.lockMinMax)

                break;

                default:
                break;
            }
        })
    }
}
