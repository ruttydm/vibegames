<script setup lang="ts">
useSeoMeta({
  title: 'About - VibeGames',
  description: 'Learn about VibeGames and the developer behind these retro arcade games.'
})
</script>

<template>
  <div class="py-8">
    <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Header -->
      <div class="text-center mb-12">
        <Icon name="mdi:gamepad-square" class="text-6xl text-neon-cyan mb-4" />
        <h1 class="font-pixel text-xl text-neon-cyan mb-4">About VibeGames</h1>
        <p class="font-retro text-xl text-text-secondary">
          Classic arcade games, reimagined for the modern web
        </p>
      </div>

      <!-- Content -->
      <div class="space-y-8">
        <section class="bg-arcade-surface border-2 border-arcade-border p-6">
          <h2 class="font-pixel text-sm text-neon-pink mb-4 flex items-center gap-2">
            <Icon name="mdi:heart" />
            The Vibe
          </h2>
          <div class="font-retro text-lg text-text-secondary space-y-4">
            <p>
              VibeGames is a collection of arcade games I've built for fun. Each game is crafted with love,
              inspired by the classics that defined gaming history.
            </p>
            <p>
              Whether you're looking for a quick solo session or want to challenge a friend in real-time multiplayer,
              there's something here for everyone.
            </p>
          </div>
        </section>

        <section class="bg-arcade-surface border-2 border-arcade-border p-6">
          <h2 class="font-pixel text-sm text-neon-yellow mb-4 flex items-center gap-2">
            <Icon name="mdi:code-tags" />
            Built With
          </h2>
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div class="flex items-center gap-2 font-retro text-text-secondary">
              <Icon name="logos:nuxt-icon" class="text-2xl" />
              Nuxt
            </div>
            <div class="flex items-center gap-2 font-retro text-text-secondary">
              <Icon name="logos:vue" class="text-2xl" />
              Vue
            </div>
            <div class="flex items-center gap-2 font-retro text-text-secondary">
              <Icon name="logos:tailwindcss-icon" class="text-2xl" />
              Tailwind
            </div>
            <div class="flex items-center gap-2 font-retro text-text-secondary">
              <Icon name="logos:typescript-icon" class="text-2xl" />
              TypeScript
            </div>
            <div class="flex items-center gap-2 font-retro text-text-secondary">
              <Icon name="mdi:websocket" class="text-2xl text-neon-green" />
              WebSocket
            </div>
            <div class="flex items-center gap-2 font-retro text-text-secondary">
              <Icon name="mdi:canvas" class="text-2xl text-neon-cyan" />
              Canvas
            </div>
          </div>
        </section>

        <section class="bg-arcade-surface border-2 border-arcade-border p-6">
          <h2 class="font-pixel text-sm text-neon-green mb-4 flex items-center gap-2">
            <Icon name="mdi:account" />
            The Developer
          </h2>
          <div class="font-retro text-lg text-text-secondary space-y-4">
            <p>
              Hi! I'm a developer who loves creating games and interactive experiences.
              VibeGames is my personal playground where I experiment with game mechanics and web technologies.
            </p>
            <div class="flex gap-4 pt-4">
              <a
                href="#"
                class="flex items-center gap-2 text-text-secondary hover:text-neon-cyan transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Icon name="mdi:github" class="text-2xl" />
                GitHub
              </a>
              <a
                href="#"
                class="flex items-center gap-2 text-text-secondary hover:text-neon-cyan transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Icon name="mdi:twitter" class="text-2xl" />
                Twitter
              </a>
            </div>
          </div>
        </section>

        <!-- CTA -->
        <div class="text-center py-8">
          <p class="font-pixel text-xs text-neon-yellow animate-pulse mb-6">
            READY PLAYER ONE?
          </p>
          <Button as="a" href="/games" size="lg">
            <Icon name="mdi:play" class="mr-2" />
            Start Playing
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>
