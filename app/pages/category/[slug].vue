<script setup lang="ts">
const route = useRoute()
const { getCategoryBySlug, getGamesByCategory } = useGames()

const slug = route.params.slug as string
const category = getCategoryBySlug(slug)

if (!category) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Category not found'
  })
}

const games = getGamesByCategory(slug)

useSeoMeta({
  title: `${category.name} Games - Free Online Arcade Games | VibeGames`,
  description: `Play free ${category.name.toLowerCase()} games online. Browse ${games.length} ${category.name.toLowerCase()} arcade games in your browser.`,
  ogTitle: `${category.name} Games | VibeGames`,
  ogDescription: `Play free ${category.name.toLowerCase()} games online. No download required.`,
  ogImage: '/og-image.svg',
  twitterCard: 'summary_large_image'
})

useHead({
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: `${category.name} Games`,
        description: `Collection of ${category.name.toLowerCase()} arcade games`,
        url: `https://vibegames.io/category/${slug}`,
        mainEntity: {
          '@type': 'ItemList',
          name: category.name,
          numberOfItems: games.length,
          itemListElement: games.map((game, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            item: {
              '@type': 'VideoGame',
              name: game.title,
              url: `https://vibegames.io/games/${game.slug}`
            }
          }))
        }
      })
    }
  ]
})
</script>

<template>
  <div class="py-8">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Header -->
      <div class="mb-8">
        <NuxtLink
          to="/games"
          class="inline-flex items-center gap-2 font-pixel text-xs text-text-secondary hover:text-neon-cyan transition-colors mb-4"
        >
          <Icon name="mdi:arrow-left" />
          All Games
        </NuxtLink>

        <div class="flex items-center gap-4">
          <Icon :name="category.icon" class="text-4xl text-neon-cyan" />
          <div>
            <h1 class="font-pixel text-xl text-neon-cyan">{{ category.name }}</h1>
            <p class="font-retro text-lg text-text-secondary">
              {{ games.length }} {{ games.length === 1 ? 'game' : 'games' }} in this category
            </p>
          </div>
        </div>
      </div>

      <!-- Games Grid -->
      <div v-if="games.length" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        <GameCard v-for="game in games" :key="game.slug" :game="game" />
      </div>

      <!-- Empty State -->
      <div v-else class="text-center py-16">
        <Icon name="mdi:gamepad-variant-outline" class="text-6xl text-text-muted mb-4" />
        <p class="font-pixel text-sm text-text-muted mb-2">No games yet</p>
        <p class="font-retro text-text-muted">Check back soon for new {{ category.name.toLowerCase() }} games!</p>
      </div>
    </div>
  </div>
</template>
