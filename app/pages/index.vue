<script setup lang="ts">
const { getFeaturedGames, getAllGames, getAllCategories } = useGames()
const { lobbies, fetchLobbies, subscribeToLobbies } = useLobbies()

const featuredGames = getFeaturedGames()
const allGames = getAllGames()
const categories = getAllCategories()

// Fetch lobbies on mount and subscribe for updates
onMounted(() => {
  fetchLobbies()
  subscribeToLobbies()
})

useSeoMeta({
  title: 'VibeGames - Free Retro Arcade Games Online',
  description: 'Play free retro arcade games online. Snake, Asteroids, Waterloo tactics, and more. Multiplayer support, no ads, no login required.',
  ogTitle: 'VibeGames - Free Retro Arcade Games Online',
  ogDescription: 'Play free retro arcade games online. Multiplayer support, no ads, no login required.',
  ogImage: '/og-image.svg',
  twitterCard: 'summary_large_image'
})

// Structured data for the website
useHead({
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'VibeGames',
        description: 'Free retro arcade games collection',
        url: 'https://vibegames.io',
        potentialAction: {
          '@type': 'SearchAction',
          target: 'https://vibegames.io/games?q={search_term_string}',
          'query-input': 'required name=search_term_string'
        }
      })
    },
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: 'Featured Games',
        itemListElement: featuredGames.map((game, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          item: {
            '@type': 'VideoGame',
            name: game.title,
            description: game.description,
            url: `https://vibegames.io/games/${game.slug}`,
            image: game.thumbnail
          }
        }))
      })
    }
  ]
})
</script>

<template>
  <div class="scanlines">
    <!-- Hero Section -->
    <section class="relative py-16 md:py-24 overflow-hidden">
      <!-- Animated Background Grid -->
      <div class="absolute inset-0 opacity-10">
        <div class="absolute inset-0" style="background-image: linear-gradient(var(--color-neon-cyan) 1px, transparent 1px), linear-gradient(90deg, var(--color-neon-cyan) 1px, transparent 1px); background-size: 50px 50px;" />
      </div>

      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <!-- ASCII Art Logo -->
        <pre class="font-mono text-[6px] sm:text-[8px] md:text-[10px] text-neon-cyan leading-none mb-6 hidden sm:block" aria-hidden="true">
██╗   ██╗██╗██████╗ ███████╗ ██████╗  █████╗ ███╗   ███╗███████╗███████╗
██║   ██║██║██╔══██╗██╔════╝██╔════╝ ██╔══██╗████╗ ████║██╔════╝██╔════╝
╚██╗ ██╔╝██║██████╔╝█████╗  ██║  ███╗███████║██╔████╔██║█████╗  ███████╗
 ╚████╔╝ ██║██╔══██╗██╔══╝  ██║   ██║██╔══██║██║╚██╔╝██║██╔══╝  ╚════██║
  ╚██╔╝  ██║██████╔╝███████╗╚██████╔╝██║  ██║██║ ╚═╝ ██║███████╗███████║
   ╚═╝   ╚═╝╚═════╝ ╚══════╝ ╚═════╝ ╚═╝  ╚═╝╚═╝     ╚═╝╚══════╝╚══════╝
        </pre>

        <!-- Mobile Logo -->
        <h1 class="sm:hidden font-pixel text-2xl neon-text-cyan mb-6">VIBEGAMES</h1>

        <!-- Tagline -->
        <p class="font-pixel text-xs sm:text-sm text-neon-yellow animate-pulse mb-8">
          INSERT COIN TO PLAY
        </p>

        <p class="font-retro text-xl text-text-secondary max-w-2xl mx-auto mb-8">
          Classic arcade games, reimagined for the web. Play solo or challenge your friends in real-time multiplayer.
        </p>

        <div class="flex flex-wrap justify-center gap-4">
          <Button as="a" href="/games" size="lg">
            <Icon name="mdi:gamepad-variant" class="mr-2" />
            Browse Games
          </Button>
          <Button as="a" href="/multiplayer" variant="pink" size="lg">
            <Icon name="mdi:account-group" class="mr-2" />
            Multiplayer
          </Button>
        </div>
      </div>
    </section>

    <!-- Featured Games -->
    <section class="py-12 bg-arcade-surface/50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between mb-8">
          <h2 class="font-pixel text-sm text-neon-pink flex items-center gap-2">
            <Icon name="mdi:star" />
            Featured Games
          </h2>
          <NuxtLink to="/games" class="font-pixel text-xs text-text-secondary hover:text-neon-cyan transition-colors">
            View All
            <Icon name="mdi:arrow-right" class="inline" />
          </NuxtLink>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <GameCard v-for="game in featuredGames" :key="game.slug" :game="game" />
        </div>
      </div>
    </section>

    <!-- Categories -->
    <section class="py-12">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 class="font-pixel text-sm text-neon-yellow flex items-center gap-2 mb-8">
          <Icon name="mdi:shape" />
          Categories
        </h2>

        <div class="flex flex-wrap gap-3">
          <NuxtLink
            v-for="category in categories"
            :key="category.slug"
            :to="`/category/${category.slug}`"
            class="flex items-center gap-2 px-4 py-3 bg-arcade-surface border-2 border-arcade-border font-pixel text-xs text-text-secondary hover:border-neon-cyan hover:text-neon-cyan transition-all hover:-translate-y-1"
          >
            <Icon :name="category.icon" class="text-lg" />
            {{ category.name }}
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- Multiplayer Lobbies -->
    <section class="py-12 bg-arcade-surface/50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between mb-8">
          <h2 class="font-pixel text-sm text-neon-green flex items-center gap-2">
            <Icon name="mdi:access-point" class="animate-pulse" />
            Live Lobbies
            <span v-if="lobbies.length > 0" class="text-neon-green">({{ lobbies.length }})</span>
          </h2>
          <NuxtLink to="/multiplayer" class="font-pixel text-xs text-text-secondary hover:text-neon-cyan transition-colors">
            Create Room
            <Icon name="mdi:plus" class="inline" />
          </NuxtLink>
        </div>

        <div class="space-y-3">
          <NuxtLink
            v-for="lobby in lobbies"
            :key="lobby.id"
            :to="`/games/${lobby.gameSlug}`"
            class="flex items-center justify-between p-4 bg-arcade-surface border-2 border-arcade-border hover:border-neon-green transition-colors"
          >
            <div class="flex items-center gap-4">
              <span class="w-3 h-3 bg-neon-green rounded-full animate-pulse" />
              <div>
                <span class="font-pixel text-xs text-text-primary">{{ lobby.gameName }}</span>
                <span class="font-retro text-sm text-text-muted ml-3">{{ lobby.id }}</span>
              </div>
            </div>
            <div class="flex items-center gap-4">
              <span class="font-retro text-sm text-text-secondary">
                {{ lobby.players }}/{{ lobby.maxPlayers }} players
              </span>
              <Button size="sm" variant="green" @click.prevent>Join</Button>
            </div>
          </NuxtLink>

          <div v-if="lobbies.length === 0" class="text-center py-8 bg-arcade-surface border-2 border-arcade-border border-dashed">
            <Icon name="mdi:account-group-outline" class="text-4xl text-text-muted mb-2" />
            <p class="font-pixel text-xs text-text-muted mb-1">No active lobbies</p>
            <p class="font-retro text-text-muted">Start a game and invite friends!</p>
          </div>
        </div>
      </div>
    </section>

    <!-- All Games Grid -->
    <section class="py-12">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between mb-8">
          <h2 class="font-pixel text-sm text-neon-cyan flex items-center gap-2">
            <Icon name="mdi:grid" />
            All Games
          </h2>
          <NuxtLink to="/games" class="font-pixel text-xs text-text-secondary hover:text-neon-cyan transition-colors">
            View All
            <Icon name="mdi:arrow-right" class="inline" />
          </NuxtLink>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          <GameCard v-for="game in allGames.slice(0, 8)" :key="game.slug" :game="game" />
        </div>

        <div class="text-center mt-8">
          <Button as="a" href="/games" variant="ghost">
            See All Games
            <Icon name="mdi:arrow-right" class="ml-2" />
          </Button>
        </div>
      </div>
    </section>
  </div>
</template>
