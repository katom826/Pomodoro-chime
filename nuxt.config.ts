// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  srcDir: 'app/',
  css: ['~/assets/css/reset.scss', '~/assets/css/globals.scss'],
  compatibilityDate: '2026-03-13',
  devtools: { enabled: true },
  app: {
    baseURL: '/Pomodoro-chime/'
  },
  ssr: false
})
