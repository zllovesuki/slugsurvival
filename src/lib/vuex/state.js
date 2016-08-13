var alertify = require('alertify.js'),
    Nanobar = require('nanobar');

module.exports = {
    termsList: {},
    flatTermsList: [],
    termName: '',

    flatCourses: {},

    courseInfo: {},

    instructorNameToTidMapping: {},
    instructorStats: {},

    historicData: {},

    search: {},

    title: 'Index',

    events: {

    },
    dateMap: {
        'Monday': '2016-08-01',
        'Tuesday': '2016-08-02',
        'Wednesday': '2016-08-03',
        'Thursday': '2016-08-04',
        'Friday': '2016-08-05',
        'Saturday': '2016-08-06'
    },

    loading: new Nanobar(),
    alert: alertify.reset().closeLogOnClick(true).logPosition("bottom right")
}
