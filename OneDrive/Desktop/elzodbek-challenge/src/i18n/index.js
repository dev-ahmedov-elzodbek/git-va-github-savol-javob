import { createI18n } from 'vue-i18n'
import { messages } from './messages.js'

const savedLang = localStorage.getItem('gf_lang') || 'uz'

export const i18n = createI18n({
  legacy: false,
  locale: savedLang,
  fallbackLocale: 'uz',
  messages
})
