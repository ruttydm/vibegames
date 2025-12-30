<script setup lang="ts">
defineProps<{
  avatar: string
  color: string
  name: string
  score?: number
  isHost?: boolean
  isReady?: boolean
  hasSubmitted?: boolean
  connected?: boolean
  size?: 'sm' | 'md' | 'lg'
  showName?: boolean
  showScore?: boolean
  showStatus?: boolean
}>()
</script>

<template>
  <div class="flex flex-col items-center gap-1" :class="{ 'opacity-50': connected === false }">
    <!-- Avatar Circle -->
    <div
      class="relative rounded-full flex items-center justify-center border-2 transition-all"
      :class="[
        size === 'sm' ? 'w-10 h-10 text-lg' : size === 'lg' ? 'w-20 h-20 text-4xl' : 'w-14 h-14 text-2xl',
        hasSubmitted ? 'ring-2 ring-neon-green ring-offset-2 ring-offset-arcade-bg' : ''
      ]"
      :style="{
        backgroundColor: `${color}20`,
        borderColor: color,
        boxShadow: hasSubmitted ? `0 0 15px ${color}` : 'none'
      }"
    >
      <span>{{ avatar }}</span>

      <!-- Host Crown -->
      <div
        v-if="isHost"
        class="absolute -top-2 -right-1 text-neon-yellow"
      >
        <Icon name="mdi:crown" :class="size === 'sm' ? 'w-3 h-3' : 'w-5 h-5'" />
      </div>

      <!-- Ready Check -->
      <div
        v-if="showStatus && isReady"
        class="absolute -bottom-1 -right-1 bg-neon-green rounded-full p-0.5"
      >
        <Icon name="mdi:check" class="w-3 h-3 text-arcade-bg" />
      </div>

      <!-- Submitted Check -->
      <div
        v-else-if="showStatus && hasSubmitted"
        class="absolute -bottom-1 -right-1 bg-neon-cyan rounded-full p-0.5"
      >
        <Icon name="mdi:check" class="w-3 h-3 text-arcade-bg" />
      </div>

      <!-- Disconnected -->
      <div
        v-if="connected === false"
        class="absolute inset-0 flex items-center justify-center bg-arcade-bg/70 rounded-full"
      >
        <Icon name="mdi:wifi-off" class="w-5 h-5 text-red-400" />
      </div>
    </div>

    <!-- Name -->
    <p
      v-if="showName !== false"
      class="font-retro text-white/80 truncate max-w-full"
      :class="size === 'sm' ? 'text-[10px]' : size === 'lg' ? 'text-sm' : 'text-xs'"
    >
      {{ name }}
    </p>

    <!-- Score -->
    <p
      v-if="showScore && score !== undefined"
      class="font-pixel text-neon-yellow"
      :class="size === 'sm' ? 'text-[10px]' : size === 'lg' ? 'text-lg' : 'text-sm'"
    >
      {{ score }}
    </p>
  </div>
</template>
