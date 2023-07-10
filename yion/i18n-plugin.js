const parseLocale = require('accept-language-parser')
const i18next = require('i18next')

module.exports = {
  type: 'i18n',
  handle: (req, res, app, next) => {
    const locale = process.env.LOCALE || 'en'

    req.attributes.localeFallback = locale
    req.attributes.locale = parseLocale.pick(i18next.languages, req.headers['accept-language']) || locale

    const match = req.url.match(/\/([a-z]{2}(?:-[a-z]{2})?)\/.*/)
    if (match) {
      req.attributes.locale = match[1]
    }

    next()
  }
}
