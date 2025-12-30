import { getAudioEngine } from '../engine'
import { createSnakeSong } from '~/games/snake/audio'
import { createPartySong } from '~/games/party/audio'

/**
 * Song Registry
 * Register all game theme songs here
 * Game-specific songs are located in their game folders (e.g., ~/games/snake/audio.ts)
 */

const songs = {
  snake: createSnakeSong,
  party: createPartySong
} as const

export type SongId = keyof typeof songs

/**
 * Initialize all songs with the audio engine
 */
export function registerSongs(): void {
  const engine = getAudioEngine()

  for (const [id, factory] of Object.entries(songs)) {
    engine.registerSong(id, factory)
  }
}

/**
 * Get list of available song IDs
 */
export function getSongIds(): SongId[] {
  return Object.keys(songs) as SongId[]
}
