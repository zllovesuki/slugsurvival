module.exports = {
    Tracker: function(state) {
        return state.Tracker;
    },
    version: function(state) {
        return require('../../../version.json')
    },
    alert: function(state) {
        return state.alert.delay(3000);
    },
    route: function(state) {
        return state.route
    },
    title: function(state) {
        return state.title;
    },
    basicDataLoaded: function(state) {
        return state.flatTermsList.length !== 0 && Object.keys(state.historicFrequency).length !== 0;
    },
    termId: function(state) {
        return state.route.params.termId;
    },
    termName: function(state) {
        return state.termName;
    },
    numOfYears: function(state) {
        return state.numOfYears;
    },
    flatTermsList: function(state) {
        return state.flatTermsList;
    },
    termsList: function(state) {
        return state.termsList;
    },
    termDates: function(state) {
        return state.termDates;
    },
    historicData: function(state) {
        return state.historicData;
    },
    historicFrequency: function(state) {
        return state.historicFrequency;
    },
    indexSearch: function(state) {
        return state.search;
    },
    flatCourses: function(state) {
        return state.flatCourses;
    },
    sortedCourses: function(state) {
        return state.sortedCourses;
    },
    courseInfo: function(state) {
        return state.courseInfo;
    },
    subjectList: function(state) {
        return state.subjectList;
    },
    majorMinor: function(state) {
        return state.majorMinor;
    },
    eventSource: function(state) {
        return state.events
    },
    colorMap: function(state) {
        return state.colorMap
    },
    dateMap: function(state) {
        return state.dateMap
    },
    latestTermCode: function(state) {
        return (typeof state.flatTermsList[0] === undefined ? null : parseInt(state.flatTermsList[0].code))
    },
    blockScroll: function(state) {
        return state.blockScroll;
    },
    shouldAddMargin: function(state) {
        return state.shouldAddMargin
    },
    academicPlanner: function(state) {
        return state.academicPlanner
    },
    onlineState: function(state) {
        return state.onlineState;
    },
    showFinal: function(state) {
        return state.showFinal
    },
    finalSchedule: function(state) {
        return state.finalSchedule
    },
    rmpEmptyCounter: function(state) {
        return state.rmpEmptyCounter
    }
}
