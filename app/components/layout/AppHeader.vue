<script setup lang="ts">
const { playerName, isEditingName, initPlayer, setPlayerName, randomizeName, toggleEdit, closeEdit } = usePlayer()

const menuOpen = ref(false)
const editInput = ref('')
const inputRef = ref<HTMLInputElement | null>(null)

const navLinks = [
  { label: 'Games', href: '/games', icon: 'mdi:gamepad-variant' },
  { label: 'Multiplayer', href: '/multiplayer', icon: 'mdi:account-group' },
  { label: 'About', href: '/about', icon: 'mdi:information' }
]

// Initialize player on mount
onMounted(() => {
  initPlayer()
})

// Handle opening the edit modal
const openEdit = () => {
  editInput.value = playerName.value
  toggleEdit()
  nextTick(() => {
    inputRef.value?.focus()
    inputRef.value?.select()
  })
}

// Save the new name
const saveName = () => {
  if (editInput.value.trim()) {
    setPlayerName(editInput.value)
  }
  closeEdit()
}

// Generate random and save
const generateAndSave = () => {
  randomizeName()
  closeEdit()
}

// Handle clicking outside
const handleBackdropClick = () => {
  closeEdit()
}
</script>

<template>
  <header class="sticky top-0 z-50 bg-arcade-bg/95 backdrop-blur-sm border-b-2 border-arcade-border">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16">
        <!-- Logo -->
        <NuxtLink to="/" class="flex items-center gap-3 group">
          <div class="text-2xl">
            <Icon name="mdi:gamepad-square" class="text-neon-cyan group-hover:text-neon-pink transition-colors" />
          </div>
          <span class="font-pixel text-sm text-neon-cyan group-hover:text-neon-pink transition-colors hidden sm:block">
            VIBEGAMES
          </span>
        </NuxtLink>

        <!-- Desktop Navigation -->
        <nav class="hidden md:flex items-center gap-6">
          <NuxtLink
            v-for="link in navLinks"
            :key="link.href"
            :to="link.href"
            class="flex items-center gap-2 font-pixel text-xs text-text-secondary hover:text-neon-cyan transition-colors"
          >
            <Icon :name="link.icon" class="text-lg" />
            {{ link.label }}
          </NuxtLink>
        </nav>

        <!-- Right side: Search + Username -->
        <div class="hidden md:flex items-center gap-4">
          <!-- Search -->
          <div class="relative">
            <Icon name="mdi:magnify" class="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Search games..."
              class="w-48 lg:w-64 bg-arcade-surface border border-arcade-border pl-10 pr-4 py-2 font-retro text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-neon-cyan transition-colors"
            />
          </div>

          <!-- Username Display -->
          <button
            class="flex items-center gap-2 px-3 py-2 bg-arcade-surface border border-arcade-border hover:border-neon-pink transition-colors group"
            @click="openEdit"
          >
            <Icon name="mdi:account" class="text-lg text-neon-pink" />
            <span class="font-pixel text-[10px] text-text-primary group-hover:text-neon-pink transition-colors max-w-24 truncate">
              {{ playerName || '...' }}
            </span>
            <Icon name="mdi:pencil" class="text-sm text-text-muted group-hover:text-neon-pink transition-colors" />
          </button>
        </div>

        <!-- Mobile: Username + Menu Button -->
        <div class="md:hidden flex items-center gap-2">
          <!-- Mobile Username -->
          <button
            class="flex items-center gap-1 px-2 py-1 bg-arcade-surface border border-arcade-border"
            @click="openEdit"
          >
            <Icon name="mdi:account" class="text-neon-pink" />
            <span class="font-pixel text-[8px] text-text-primary max-w-16 truncate">
              {{ playerName || '...' }}
            </span>
          </button>

          <!-- Menu Button -->
          <button
            class="p-2 text-text-secondary hover:text-neon-cyan transition-colors"
            @click="menuOpen = !menuOpen"
          >
            <Icon :name="menuOpen ? 'mdi:close' : 'mdi:menu'" class="text-2xl" />
          </button>
        </div>
      </div>
    </div>

    <!-- Mobile Menu -->
    <Transition
      enter-active-class="transition-all duration-200 ease-out"
      enter-from-class="opacity-0 -translate-y-2"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition-all duration-150 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-2"
    >
      <div v-if="menuOpen" class="md:hidden bg-arcade-surface border-b-2 border-arcade-border">
        <div class="px-4 py-4 space-y-4">
          <!-- Mobile Search -->
          <div class="relative">
            <Icon name="mdi:magnify" class="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Search games..."
              class="w-full bg-arcade-bg border border-arcade-border pl-10 pr-4 py-2 font-retro text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-neon-cyan transition-colors"
            />
          </div>

          <!-- Mobile Navigation Links -->
          <nav class="flex flex-col gap-2">
            <NuxtLink
              v-for="link in navLinks"
              :key="link.href"
              :to="link.href"
              class="flex items-center gap-3 px-4 py-3 font-pixel text-xs text-text-secondary hover:text-neon-cyan hover:bg-arcade-bg transition-colors"
              @click="menuOpen = false"
            >
              <Icon :name="link.icon" class="text-lg" />
              {{ link.label }}
            </NuxtLink>
          </nav>
        </div>
      </div>
    </Transition>

    <!-- Edit Username Modal -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition-opacity duration-150"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition-opacity duration-100"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-if="isEditingName"
          class="fixed inset-0 z-[100] flex items-start justify-center pt-20 px-4 bg-arcade-bg/80"
          @click.self="handleBackdropClick"
        >
          <div class="w-full max-w-sm bg-arcade-surface border-4 border-neon-pink p-6 shadow-[0_0_30px_rgba(255,46,99,0.3)]">
            <div class="flex items-center justify-between mb-4">
              <h3 class="font-pixel text-xs text-neon-pink">CHANGE NAME</h3>
              <button
                class="text-text-secondary hover:text-neon-pink transition-colors"
                @click="closeEdit"
              >
                <Icon name="mdi:close" class="text-xl" />
              </button>
            </div>

            <div class="space-y-4">
              <div>
                <label class="block font-pixel text-[10px] text-text-muted mb-2">YOUR NAME</label>
                <input
                  ref="inputRef"
                  v-model="editInput"
                  type="text"
                  maxlength="20"
                  placeholder="Enter your name..."
                  class="w-full bg-arcade-bg border-2 border-arcade-border px-4 py-3 font-pixel text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-neon-pink transition-colors"
                  @keyup.enter="saveName"
                />
                <p class="font-retro text-xs text-text-muted mt-1">Max 20 characters</p>
              </div>

              <div class="flex gap-3">
                <Button class="flex-1" variant="pink" @click="saveName">
                  <Icon name="mdi:check" class="mr-1" />
                  Save
                </Button>
                <Button variant="ghost" @click="generateAndSave">
                  <Icon name="mdi:dice-3" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </header>
</template>
