const i18next = require('i18next')

module.exports = {
  trans (code, options = {}) {
    return i18next.t(code, options)
  }
}
