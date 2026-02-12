import Vue from 'vue'
import VueI18n from 'vue-i18n'

Vue.use(VueI18n)

const DEFAULT_LANG = 'en'
const LOCALE_KEY = 'zpan-locale'
const locales = require.context('./locales', true, /[A-Za-z0-9-_,\s]+\.json$/i)

function loadLocaleMessages() {
  const messages = {}
  locales.keys().forEach(key => {
    const matched = key.match(/([A-Za-z0-9-_]+)\./i)
    if (matched && matched.length > 1) {
      const locale = matched[1]
      messages[locale] = locales(key)
    }
  })
  return messages
}

const messages = loadLocaleMessages()

const i18n = new VueI18n({
  locale: process.env.VUE_APP_I18N_LOCALE || DEFAULT_LANG,
  fallbackLocale: process.env.VUE_APP_I18N_FALLBACK_LOCALE || DEFAULT_LANG,
  messages: messages
})


export const setup = lang => {
  let locale = localStorage.getItem(LOCALE_KEY);
  if (lang) {
    locale = lang
    localStorage.setItem(LOCALE_KEY, locale);
  } else if (!locale) {
    // Try to match navigator.language with available locales
    const navLang = navigator.language;
    const availableLocales = Object.keys(messages);
    
    // Exact match first
    if (availableLocales.includes(navLang)) {
      locale = navLang;
    } else {
      // Try to match language prefix (e.g., 'zh' from 'zh-CN')
      const langPrefix = navLang.split('-')[0];
      const matched = availableLocales.find(l => l.startsWith(langPrefix));
      locale = matched || DEFAULT_LANG;
    }
  } else {
    // Validate stored locale exists in loaded messages
    if (!messages[locale]) {
      locale = DEFAULT_LANG;
    }
  }

  i18n.locale = locale
}

setup()
export default i18n