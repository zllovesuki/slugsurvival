module.exports = {
    apiVersion: 2,
    port: require('./config.json').port,
    siteURL: require('./config.json').siteURL,
    dbURL: require('./config.json').dbURL,
    trackingURL: require('./config.json').trackingURL,
    analytics: require('./config.json').analytics
}
