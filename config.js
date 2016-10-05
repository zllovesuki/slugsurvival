module.exports = {
    apiVersion: 2,
    port: require('./config.json').port,
    siteURL: require('./config.json').siteURL,
    dbURL: require('./config.json').dbURL,
    trackingURL: require('./config.json').trackingURL,
    notifyURL: require('./config.json').notifyURL,
    monitoredTerm: require('./config.json').monitoredTerm,
    analytics: require('./config.json').analytics
}
