import tailwindcss from '@tailwindcss/vite'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  modules: [
    '@nuxt/eslint',
    '@nuxt/fonts',
    '@nuxt/icon',
    '@nuxt/image'
  ],

  css: ['~/assets/css/main.css'],

  components: {
    dirs: [
      { path: '~/components/ui', pathPrefix: false },
      { path: '~/components/layout', pathPrefix: false },
      { path: '~/components/game', pathPrefix: false }
    ]
  },

  fonts: {
    families: [
      { name: 'Press Start 2P', provider: 'google' },
      { name: 'VT323', provider: 'google' }
    ]
  },

  vite: {
    plugins: [tailwindcss()]
  },

  nitro: {
    experimental: {
      websocket: true
    }
  }
})