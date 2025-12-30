<script setup lang="ts">
const { getAllGames, getAllCategories } = useGames()

const games = getAllGames()
const categories = getAllCategories()

const selectedCategory = ref<string | null>(null)
const searchQuery = ref('')

const filteredGames = computed(() => {
  let result = games

  if (selectedCategory.value) {
    result = result.filter(g => g.categories.includes(selectedCategory.value!))
  }

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(g =>
      g.title.toLowerCase().includes(query) ||
      g.description.toLowerCase().includes(query)
    )
  }

  return result
})

useSeoMeta({
  title: 'All Games - VibeGames',
  description: 'Browse all arcade games. Classic games, puzzles, shooters, and more.'
})
</script>

<template>
  <div class="py-8">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="font-pixel text-xl text-neon-cyan mb-4">All Games</h1>
        <p class="font-retro text-lg text-text-secondary">
          Browse the full collection of arcade games
        </p>
      </div>

      <!-- Filters -->
      <div class="flex flex-col sm:flex-row gap-4 mb-8">
        <!-- Search -->
        <div class="relative flex-1">
          <Icon name="mdi:magnify" class="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search games..."
            class="w-full bg-arcade-surface border-2 border-arcade-border pl-10 pr-4 py-3 font-retro text-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-neon-cyan transition-colors"
          />
        </div>

        <!-- Category Filter -->
        <div class="flex flex-wrap gap-2">
          <button
            :class="[
              'px-3 py-2 font-pixel text-[10px] border-2 transition-colors',
              !selectedCategory
                ? 'bg-neon-cyan text-arcade-bg border-neon-cyan'
                : 'bg-arcade-surface text-text-secondary border-arcade-border hover:border-neon-cyan hover:text-neon-cyan'
            ]"
            @click="selectedCategory = null"
          >
            All
          </button>
          <button
            v-for="category in categories"
            :key="category.slug"
            :class="[
              'px-3 py-2 font-pixel text-[10px] border-2 transition-colors',
              selectedCategory === category.slug
                ? 'bg-neon-cyan text-arcade-bg border-neon-cyan'
                : 'bg-arcade-surface text-text-secondary border-arcade-border hover:border-neon-cyan hover:text-neon-cyan'
            ]"
            @click="selectedCategory = category.slug"
          >
            {{ category.name }}
          </button>
        </div>
      </div>

      <!-- Games Grid -->
      <div v-if="filteredGames.length" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        <GameCard v-for="game in filteredGames" :key="game.slug" :game="game" />
      </div>

      <!-- Empty State -->
      <div v-else class="text-center py-16">
        <Icon name="mdi:gamepad-variant-outline" class="text-6xl text-text-muted mb-4" />
        <p class="font-pixel text-sm text-text-muted mb-2">No games found</p>
        <p class="font-retro text-text-muted">Try adjusting your search or filters</p>
      </div>
    </div>
  </div>
</template>
