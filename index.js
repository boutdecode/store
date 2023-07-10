const i18next = require('i18next')

module.exports = {
  init (defaultLocale, resources) {
    i18next.init({
      fallbackLng: defaultLocale,
      resources
    })
  },

  trans (code, options = {}) {
    return i18next.t(code, options)
  }
}
