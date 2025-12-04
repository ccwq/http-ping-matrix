import { createApp } from 'vue'
import { createI18n } from 'vue-i18n'
import { registerSW } from 'virtual:pwa-register'
import App from './App.vue'
import './style.css'
import en from './locales/en.json'
import zhCN from './locales/zh-CN.json'
import zhTW from './locales/zh-TW.json'

const savedLocale = localStorage.getItem('ping-matrix-locale') || 'en'

const i18n = createI18n({
  legacy: false,
  locale: savedLocale,
  fallbackLocale: 'en',
  messages: {
    en,
    'zh-CN': zhCN,
    'zh-TW': zhTW
  }
})

createApp(App).use(i18n).mount('#app')

if ('serviceWorker' in navigator) {
  registerSW({
    immediate: true,
    onRegisteredSW(swUrl) {
      console.debug('[ping-matrix] service worker registered', swUrl)
    },
    onRegisterError(error) {
      console.error('[ping-matrix] service worker registration failed', error)
    }
  })
}
