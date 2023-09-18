const fs = require('node:fs')
const path = require('node:path')
const parseLocale = require('accept-language-parser')
const i18next = require('i18next')

let isInit = false
const translationFolder = process.env.TRANSLATION_FOLDER || (path.resolve(process.cwd(), 'translations'))

const getTranslations = () => {
  const translations = {}
  try {
    fs.readdirSync(translationFolder).forEach(file => {
      const result = file.match(/\w+\.([a-zA-Z-]{2,5})\..*/)
      if (result) {
        if (!translations[result[1]]) {
          translations[result[1]] = { translation: {} }
        }

        translations[result[1]].translation = { ...require(`${translationFolder}/${file}`) }
      }
    })
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('i18n plugin throw error : ', error)
  }

  return translations
}

const fallbackLng = process.env.LOCALE || 'en'
module.exports = {
  type: 'i18n',
  handle: (req, res, app, next) => {
    if (!isInit) {
      i18next.init({
        fallbackLng,
        resources: getTranslations()
      })

      isInit = true
    }

    req.attributes.locale = parseLocale.pick(i18next.languages, req.headers['accept-language']) || fallbackLng

    const match = req.url.match(/\/([a-z]{2}(?:-[a-z]{2})?)\/.*/)
    if (match) {
      req.attributes.locale = match[1]
    }

    if (req.query.lang) {
      req.attributes.locale = req.query.lang
    }

    next()
  }
}
