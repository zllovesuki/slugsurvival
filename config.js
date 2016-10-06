module.exports = {
    apiVersion: 2,
    port: 3001,
    siteURL: require('./config/config.json').siteURL,
    dbURL: require('./config/config.json').dbURL,
    trackingURL: require('./config/config.json').trackingURL,
    notifyURL: require('./config/config.json').notifyURL,
    monitoredTerm: require('./config/config.json').monitoredTerm,
    analytics: require('./config/config.json').analytics
}
