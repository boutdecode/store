module.exports = {
  plugin: require('./plugins/store'),
  providers: {
    nedb: require('./providers/nedb'),
    sqlite: require('./providers/sqlite')
  }
}
