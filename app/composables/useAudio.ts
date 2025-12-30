import { getAudioEngine } from '~/audio/engine'
import { playSfx as playSfxInternal, getSfxNames } from '~/audio/sfx'
import { registerSongs, type SongId } from '~/audio/songs'

// Global reactive state (shared across all component instances)
const isMuted = ref(false)
const isInitialized = ref(false)
const currentSong = ref<string | null>(null)

// Track if songs are registered
let songsRegistered = false

export function useAudio() {
  const engine = getAudioEngine()

  /**
   * Initialize the audio engine (must be called after user interaction)
   */
  const initAudio = async (): Promise<boolean> => {
    if (isInitialized.value) return true

    const success = await engine.init()
    if (success) {
      isInitialized.value = true
      isMuted.value = engine.isMuted()

      // Register songs on first init
      if (!songsRegistered) {
        registerSongs()
        songsRegistered = true
      }
    }
    return success
  }

  /**
   * Ensure audio is initialized before playing
   * Call this on first user interaction
   */
  const ensureAudioReady = async (): Promise<boolean> => {
    if (isInitialized.value) return true
    return await initAudio()
  }

  /**
   * Play a sound effect by name
   */
  const playSfx = async (name: string): Promise<void> => {
    await ensureAudioReady()
    playSfxInternal(name)
  }

  /**
   * Start playing a song
   */
  const startSong = async (id: SongId): Promise<boolean> => {
    await ensureAudioReady()
    const success = engine.startSong(id)
    if (success) {
      currentSong.value = id
    }
    return success
  }

  /**
   * Stop the current song
   */
  const stopSong = (): void => {
    engine.stopSong()
    currentSong.value = null
  }

  /**
   * Toggle mute state
   */
  const toggleMute = async (): Promise<boolean> => {
    await ensureAudioReady()
    const newState = engine.toggleMute()
    isMuted.value = newState
    return newState
  }

  /**
   * Set mute state
   */
  const setMuted = async (muted: boolean): Promise<void> => {
    await ensureAudioReady()
    engine.setMuted(muted)
    isMuted.value = muted
  }

  // Sync state on mount (in case settings were loaded from storage)
  onMounted(() => {
    if (engine.isInitialized()) {
      isMuted.value = engine.isMuted()
      currentSong.value = engine.getCurrentSongId()
      isInitialized.value = true
    }
  })

  return {
    // State
    isMuted: readonly(isMuted),
    isInitialized: readonly(isInitialized),
    currentSong: readonly(currentSong),

    // Methods
    initAudio,
    ensureAudioReady,
    playSfx,
    startSong,
    stopSong,
    toggleMute,
    setMuted,

    // Utilities
    getSfxNames
  }
}
