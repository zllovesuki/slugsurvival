module.exports = function(storage) {
    return function(store) {
        store.subscribe(function(mutation, state) {

            var termId;
            if (mutation.payload && mutation.payload.termId) termId = mutation.payload.termId;

            switch (mutation.type) {
                case 'saveTermCourses':

                var coursesData = mutation.payload.coursesData;
                var onlineTimestamp = mutation.payload.timestamp.term;
                var skipSaving = mutation.payload.skipSaving || false;

                if (skipSaving) return;

                return Bluebird.all([
                    storage.setItem('termCourseTimestamp-' + termId, onlineTimestamp),
                    storage.setItem('termCourse-' + termId, coursesData)
                ])
                break;

                case 'saveCourseInfo':

                var courseInfo = mutation.payload.courseInfo;
                var onlineTimestamp = mutation.payload.timestamp.courses;
                var skipSaving = mutation.payload.skipSaving || false;

                if (skipSaving) return;

                return Bluebird.all([
                    storage.setItem('termCourseInfoTimestamp-' + termId, onlineTimestamp),
                    storage.setItem('termCourseInfo-' + termId, courseInfo)
                ])

                break;

                case 'saveInstructorNameToTidMapping':

                var rmp = mutation.payload.rmp;
                var onlineTimestamp = mutation.payload.timestamp.rmp;
                var skipSaving = mutation.payload.skipSaving || false;

                if (skipSaving) return;

                return Bluebird.all([
                    storage.setItem('rmpTimestamp', onlineTimestamp),
                    storage.setItem('rmp', rmp)
                ])

                break;

                case 'saveTermsList':

                var termsList = mutation.payload.termsList;
                var onlineTimestamp = mutation.payload.timestamp.termsList;
                var skipSaving = mutation.payload.skipSaving || false;

                if (skipSaving) return;

                return Bluebird.all([
                    storage.setItem('termsListTimestamp', onlineTimestamp),
                    storage.setItem('termsList', termsList)
                ])

                break;

                case 'saveSubjects':

                var subjects = mutation.payload.subjects;
                var onlineTimestamp = mutation.payload.timestamp.subjects;
                var skipSaving = mutation.payload.skipSaving || false;

                if (skipSaving) return;

                return Bluebird.all([
                    storage.setItem('subjectsTimestamp', onlineTimestamp),
                    storage.setItem('subjects', subjects)
                ])

                case 'saveMajorMinor':

                var mm = mutation.payload.mm;
                var onlineTimestamp = mutation.payload.timestamp.mm;
                var skipSaving = mutation.payload.skipSaving || false;

                if (skipSaving) return;

                return Bluebird.all([
                    storage.setItem('mmTimestamp', onlineTimestamp),
                    storage.setItem('majorMinor', mm)
                ])

                break;

                case 'saveHistoricData':

                var historicData = mutation.payload.historicData;
                var onlineTimestamp = mutation.payload.timestamp.term;
                var skipSaving = mutation.payload.skipSaving || false;

                if (skipSaving) return;

                return Bluebird.all([
                    storage.setItem('historicDataTimestamp', onlineTimestamp),
                    storage.setItem('historicData', historicData)
                ])

                break;

                case 'saveFinalSchedule':

                var final = mutation.payload.finalSchedule;
                var onlineTimestamp = mutation.payload.timestamp.term;
                var skipSaving = mutation.payload.skipSaving || false;

                if (skipSaving) return;

                return Bluebird.all([
                    storage.setItem('finalScheduleTimestamp', onlineTimestamp),
                    storage.setItem('finalSchedule', final)
                ])

                break;

                default:
                break;
            }
        })
    }
}
