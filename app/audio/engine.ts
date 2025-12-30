import * as Tone from 'tone'

// Storage key for persisted settings
const STORAGE_KEY = 'vibegames_audio_settings'

interface AudioSettings {
  muted: boolean
  volume: number
}

interface Song {
  start: () => void
  stop: () => void
  dispose: () => void
}

type SongFactory = () => Song

class AudioEngine {
  private static instance: AudioEngine | null = null
  private initialized = false
  private muted = false
  private volume = 0.7
  private masterGain: Tone.Gain | null = null
  private currentSong: Song | null = null
  private currentSongId: string | null = null
  private songRegistry: Map<string, SongFactory> = new Map()

  private constructor() {
    this.loadSettings()
  }

  static getInstance(): AudioEngine {
    if (!AudioEngine.instance) {
      AudioEngine.instance = new AudioEngine()
    }
    return AudioEngine.instance
  }

  private loadSettings(): void {
    if (typeof window === 'undefined') return

    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const settings: AudioSettings = JSON.parse(stored)
        this.muted = settings.muted ?? false
        this.volume = settings.volume ?? 0.7
      }
    } catch {
      // Use defaults if storage fails
    }
  }

  private saveSettings(): void {
    if (typeof window === 'undefined') return

    try {
      const settings: AudioSettings = {
        muted: this.muted,
        volume: this.volume
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
    } catch {
      // Ignore storage errors
    }
  }

  /**
   * Initialize the audio context. Must be called after user interaction.
   */
  async init(): Promise<boolean> {
    if (this.initialized) return true
    if (typeof window === 'undefined') return false

    try {
      // Start Tone.js context (requires user gesture)
      await Tone.start()

      // Create master gain node
      this.masterGain = new Tone.Gain(this.muted ? 0 : this.volume).toDestination()

      this.initialized = true
      return true
    } catch (error) {
      console.warn('Failed to initialize audio:', error)
      return false
    }
  }

  /**
   * Check if audio is initialized
   */
  isInitialized(): boolean {
    return this.initialized
  }

  /**
   * Get the master gain node for connecting synths
   */
  getMasterOutput(): Tone.Gain | null {
    return this.masterGain
  }

  /**
   * Check if audio is muted
   */
  isMuted(): boolean {
    return this.muted
  }

  /**
   * Get current volume (0-1)
   */
  getVolume(): number {
    return this.volume
  }

  /**
   * Set master volume (0-1)
   */
  setVolume(value: number): void {
    this.volume = Math.max(0, Math.min(1, value))
    if (this.masterGain && !this.muted) {
      this.masterGain.gain.value = this.volume
    }
    this.saveSettings()
  }

  /**
   * Toggle mute state
   */
  toggleMute(): boolean {
    this.muted = !this.muted
    if (this.masterGain) {
      this.masterGain.gain.value = this.muted ? 0 : this.volume
    }
    this.saveSettings()
    return this.muted
  }

  /**
   * Set mute state
   */
  setMuted(muted: boolean): void {
    this.muted = muted
    if (this.masterGain) {
      this.masterGain.gain.value = this.muted ? 0 : this.volume
    }
    this.saveSettings()
  }

  /**
   * Register a song factory
   */
  registerSong(id: string, factory: SongFactory): void {
    this.songRegistry.set(id, factory)
  }

  /**
   * Start playing a song by ID
   */
  startSong(id: string): boolean {
    if (!this.initialized || !this.masterGain) return false

    // Stop current song if playing
    this.stopSong()

    const factory = this.songRegistry.get(id)
    if (!factory) {
      console.warn(`Song not found: ${id}`)
      return false
    }

    try {
      this.currentSong = factory()
      this.currentSongId = id
      this.currentSong.start()
      return true
    } catch (error) {
      console.warn(`Failed to start song ${id}:`, error)
      return false
    }
  }

  /**
   * Stop the current song
   */
  stopSong(): void {
    if (this.currentSong) {
      try {
        this.currentSong.stop()
        this.currentSong.dispose()
      } catch {
        // Ignore cleanup errors
      }
      this.currentSong = null
      this.currentSongId = null
    }
  }

  /**
   * Get current song ID
   */
  getCurrentSongId(): string | null {
    return this.currentSongId
  }

  /**
   * Clean up all resources
   */
  dispose(): void {
    this.stopSong()
    if (this.masterGain) {
      this.masterGain.dispose()
      this.masterGain = null
    }
    this.initialized = false
  }
}

// Export singleton getter
export function getAudioEngine(): AudioEngine {
  return AudioEngine.getInstance()
}

// Export Tone for use in other audio modules
export { Tone }
