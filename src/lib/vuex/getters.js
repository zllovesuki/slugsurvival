module.exports = {
    loading: function(state) {
        return state.loading;
    },
    route: function(state) {
        return state.route
    },
    title: function(state) {
        return state.title;
    },
    termId: function(state) {
        return state.route.params.termId;
    },
    termName: function(state) {
        return state.termName;
    },
    flatTermsList: function(state) {
        return state.flatTermsList;
    },
    termsList: function(state) {
        return state.termsList;
    },
    historicData: function(state) {
        return state.historicData;
    },
    indexSearch: function(state) {
        return state.search;
    },
    flatCourses: function(state) {
        return state.flatCourses;
    },
    courseInfo: function(state) {
        return state.courseInfo;
    },
    eventSource: function(state) {
        return state.events
    },
    dateMap: function(state) {
        return state.dateMap
    }
}
