module.exports = {
    apiVersion: 2,
    port: require('./config/config.json').port || 3001,
    siteURL: require('./config/config.json').siteURL,
    dbURL: require('./config/config.json').dbURL,
    trackingURL: require('./config/config.json').trackingURL,
    advisoryURL: require('./config/config.json').advisoryURL,
    notifyURL: require('./config/config.json').notifyURL,
    realtimeURL: require('./config/config.json').realtimeURL,
    monitoredTerm: require('./config/config.json').monitoredTerm,
    analytics: require('./config/config.json').analytics
}
