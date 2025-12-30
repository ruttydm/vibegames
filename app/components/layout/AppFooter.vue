<script setup lang="ts">
const currentYear = new Date().getFullYear()

const socialLinks = [
  { icon: 'mdi:github', href: '#', label: 'GitHub' },
  { icon: 'mdi:twitter', href: '#', label: 'Twitter' }
]

const footerLinks = [
  { label: 'All Games', href: '/games' },
  { label: 'Multiplayer', href: '/multiplayer' },
  { label: 'About', href: '/about' }
]
</script>

<template>
  <footer class="bg-arcade-surface border-t-2 border-arcade-border mt-auto">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="flex flex-col md:flex-row items-center justify-between gap-6">
        <!-- Logo & Copyright -->
        <div class="flex flex-col items-center md:items-start gap-2">
          <NuxtLink to="/" class="flex items-center gap-2 group">
            <Icon name="mdi:gamepad-square" class="text-xl text-neon-cyan" />
            <span class="font-pixel text-xs text-neon-cyan">VIBEGAMES</span>
          </NuxtLink>
          <p class="font-retro text-sm text-text-muted">
            Made with <span class="text-neon-pink">&#9829;</span> &copy; {{ currentYear }}
          </p>
        </div>

        <!-- Navigation Links -->
        <nav class="flex items-center gap-6">
          <NuxtLink
            v-for="link in footerLinks"
            :key="link.href"
            :to="link.href"
            class="font-retro text-sm text-text-secondary hover:text-neon-cyan transition-colors"
          >
            {{ link.label }}
          </NuxtLink>
        </nav>

        <!-- Social Links -->
        <div class="flex items-center gap-4">
          <a
            v-for="social in socialLinks"
            :key="social.label"
            :href="social.href"
            :aria-label="social.label"
            class="text-text-secondary hover:text-neon-cyan transition-colors"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Icon :name="social.icon" class="text-xl" />
          </a>
        </div>
      </div>

      <!-- Decorative Pixel Line -->
      <div class="mt-8 flex justify-center gap-1">
        <span v-for="i in 20" :key="i" class="w-2 h-2 bg-arcade-border" :class="{ 'bg-neon-cyan': i % 5 === 0 }" />
      </div>
    </div>
  </footer>
</template>
