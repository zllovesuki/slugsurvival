"use strict"
module.exports = function() {
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

                store.getters.storage.setItem('termCourseTimestamp-' + termId, onlineTimestamp)
                store.getters.storage.setItem('lz-termCourse-' + termId, coursesData)
                break;

                case 'saveCourseInfo':

                var courseInfo = mutation.payload.courseInfo;
                var onlineTimestamp = mutation.payload.timestamp.courses;
                var skipSaving = mutation.payload.skipSaving || false;

                if (skipSaving) return;

                store.getters.storage.setItem('termCourseInfoTimestamp-' + termId, onlineTimestamp)
                store.getters.storage.setItem('lz-termCourseInfo-' + termId, courseInfo)
                break;

                case 'saveInstructorNameToTidMapping':

                var rmp = mutation.payload.rmp;
                var onlineTimestamp = mutation.payload.timestamp.rmp;
                var skipSaving = mutation.payload.skipSaving || false;

                if (skipSaving) return;

                store.getters.storage.setItem('rmpTimestamp', onlineTimestamp)
                store.getters.storage.setItem('lz-rmp', rmp)
                break;

                case 'saveTermsList':

                var termsList = mutation.payload.termsList;
                var onlineTimestamp = mutation.payload.timestamp.termsList;
                var skipSaving = mutation.payload.skipSaving || false;

                if (skipSaving) return;

                store.getters.storage.setItem('termsListTimestamp', onlineTimestamp)
                store.getters.storage.setItem('lz-termsList', termsList)
                break;

                case 'saveSubjects':

                var subjects = mutation.payload.subjects;
                var skipSaving = mutation.payload.skipSaving || false;

                if (skipSaving) return;

                store.getters.storage.setItem('lz-subjects', subjects)
                break;

                case 'saveMajorMinor':

                var mm = mutation.payload.mm;
                var skipSaving = mutation.payload.skipSaving || false;

                if (skipSaving) return;

                store.getters.storage.setItem('lz-majorMinor', mm)
                break;

                case 'saveHistoricData':

                var historicData = mutation.payload.historicData;
                var skipSaving = mutation.payload.skipSaving || false;

                if (skipSaving) return;

                store.getters.storage.setItem('lz-historicData', historicData)
                break;

                case 'saveFinalSchedule':

                var final = mutation.payload.finalSchedule;
                var skipSaving = mutation.payload.skipSaving || false;

                if (skipSaving) return;

                store.getters.storage.setItem('lz-finalSchedule', final)
                break;

                default:
                break;
            }
        })
    }
}
