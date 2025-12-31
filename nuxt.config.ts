import tailwindcss from '@tailwindcss/vite'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  app: {
    head: {
      htmlAttrs: { lang: 'en' },
      title: 'VibeGames - Free Retro Arcade Games',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Play free retro arcade games online. Snake, Asteroids, Waterloo tactics, and more. Multiplayer support, no ads, no login required.' },
        { name: 'keywords', content: 'arcade games, retro games, browser games, multiplayer games, snake, asteroids, free games, online games' },
        { name: 'author', content: 'VibeGames' },
        { name: 'robots', content: 'index, follow' },
        { name: 'theme-color', content: '#1a1a2e' },
        // Open Graph
        { property: 'og:type', content: 'website' },
        { property: 'og:site_name', content: 'VibeGames' },
        { property: 'og:title', content: 'VibeGames - Free Retro Arcade Games' },
        { property: 'og:description', content: 'Play free retro arcade games online. Snake, Asteroids, Waterloo tactics, and more. Multiplayer support, no ads, no login required.' },
        { property: 'og:image', content: '/og-image.svg' },
        { property: 'og:image:width', content: '1200' },
        { property: 'og:image:height', content: '630' },
        // Twitter
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: 'VibeGames - Free Retro Arcade Games' },
        { name: 'twitter:description', content: 'Play free retro arcade games online. Multiplayer support, no ads, no login required.' },
        { name: 'twitter:image', content: '/og-image.svg' }
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'canonical', href: 'https://vibegames.io' }
      ]
    }
  },

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
      { path: '~/components/game', pathPrefix: false },
      { path: '~/components/party/host', prefix: 'PartyHost' },
      { path: '~/components/party/shared', prefix: 'PartyShared' },
      { path: '~/components/party/controller', prefix: 'PartyController' }
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