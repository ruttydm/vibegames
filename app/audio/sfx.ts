import { Tone, getAudioEngine } from './engine'
import {
  playSnakeEat,
  playSnakeDie,
  playSnakeTurn,
  playSnakeSpeedup
} from '~/games/snake/audio'

type SynthType = Tone.Synth | Tone.NoiseSynth | Tone.MembraneSynth

/**
 * Play a one-shot sound effect
 */
function playOneShot(
  createSynth: () => SynthType,
  play: (synth: SynthType) => void,
  duration: number = 500
): void {
  const engine = getAudioEngine()
  const output = engine.getMasterOutput()
  if (!output || !engine.isInitialized()) return

  const synth = createSynth()
  synth.connect(output)
  play(synth)

  // Dispose after sound completes
  setTimeout(() => {
    try {
      synth.dispose()
    } catch {
      // Ignore disposal errors
    }
  }, duration)
}

// =============================================================================
// UI Sound Effects
// =============================================================================

export function playUiClick(): void {
  playOneShot(
    () => new Tone.Synth({
      oscillator: { type: 'square' },
      envelope: { attack: 0.001, decay: 0.05, sustain: 0, release: 0.01 }
    }),
    (synth) => (synth as Tone.Synth).triggerAttackRelease('C6', '32n'),
    100
  )
}

export function playUiHover(): void {
  playOneShot(
    () => new Tone.Synth({
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.001, decay: 0.03, sustain: 0, release: 0.01 }
    }),
    (synth) => (synth as Tone.Synth).triggerAttackRelease('G5', '64n'),
    80
  )
}

export function playUiSelect(): void {
  playOneShot(
    () => new Tone.Synth({
      oscillator: { type: 'square' },
      envelope: { attack: 0.001, decay: 0.1, sustain: 0.1, release: 0.05 }
    }),
    (synth) => (synth as Tone.Synth).triggerAttackRelease('E5', '16n'),
    150
  )
}

// =============================================================================
// Countdown Sound Effects
// =============================================================================

export function playCountdownBeep(): void {
  playOneShot(
    () => new Tone.Synth({
      oscillator: { type: 'square' },
      envelope: { attack: 0.001, decay: 0.1, sustain: 0.1, release: 0.05 }
    }),
    (synth) => (synth as Tone.Synth).triggerAttackRelease('A4', '8n'),
    200
  )
}

export function playCountdownGo(): void {
  playOneShot(
    () => new Tone.Synth({
      oscillator: { type: 'square' },
      envelope: { attack: 0.001, decay: 0.15, sustain: 0.2, release: 0.1 }
    }),
    (synth) => (synth as Tone.Synth).triggerAttackRelease('A5', '4n'),
    400
  )
}

// =============================================================================
// Snake Game Sound Effects (imported from ~/games/snake/audio.ts)
// =============================================================================

export { playSnakeEat, playSnakeDie, playSnakeTurn, playSnakeSpeedup }

// =============================================================================
// Generic Game Sound Effects
// =============================================================================

export function playScoreUp(): void {
  playOneShot(
    () => new Tone.Synth({
      oscillator: { type: 'square' },
      envelope: { attack: 0.001, decay: 0.1, sustain: 0.05, release: 0.05 }
    }),
    (synth) => (synth as Tone.Synth).triggerAttackRelease('E5', '16n'),
    200
  )
}

export function playPowerup(): void {
  const engine = getAudioEngine()
  const output = engine.getMasterOutput()
  if (!output || !engine.isInitialized()) return

  const synth = new Tone.Synth({
    oscillator: { type: 'square' },
    envelope: { attack: 0.001, decay: 0.1, sustain: 0.2, release: 0.1 }
  }).connect(output)

  // Ascending major arpeggio
  const now = Tone.now()
  synth.triggerAttackRelease('C5', '16n', now)
  synth.triggerAttackRelease('E5', '16n', now + 0.08)
  synth.triggerAttackRelease('G5', '16n', now + 0.16)
  synth.triggerAttackRelease('C6', '8n', now + 0.24)

  setTimeout(() => synth.dispose(), 500)
}

export function playGameOver(): void {
  const engine = getAudioEngine()
  const output = engine.getMasterOutput()
  if (!output || !engine.isInitialized()) return

  const synth = new Tone.Synth({
    oscillator: { type: 'sawtooth' },
    envelope: { attack: 0.01, decay: 0.2, sustain: 0.3, release: 0.3 }
  }).connect(output)

  // Sad descending minor
  const now = Tone.now()
  synth.triggerAttackRelease('E4', '8n', now)
  synth.triggerAttackRelease('D4', '8n', now + 0.2)
  synth.triggerAttackRelease('C4', '4n', now + 0.4)

  setTimeout(() => synth.dispose(), 1000)
}

export function playVictory(): void {
  const engine = getAudioEngine()
  const output = engine.getMasterOutput()
  if (!output || !engine.isInitialized()) return

  const synth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'square' },
    envelope: { attack: 0.01, decay: 0.1, sustain: 0.3, release: 0.2 }
  }).connect(output)

  // Triumphant chord progression
  const now = Tone.now()
  synth.triggerAttackRelease(['C5', 'E5', 'G5'], '8n', now)
  synth.triggerAttackRelease(['D5', 'F5', 'A5'], '8n', now + 0.15)
  synth.triggerAttackRelease(['E5', 'G5', 'B5'], '8n', now + 0.3)
  synth.triggerAttackRelease(['F5', 'A5', 'C6'], '4n', now + 0.45)

  setTimeout(() => synth.dispose(), 1000)
}

// =============================================================================
// SFX Registry - for playing by name
// =============================================================================

const sfxRegistry: Record<string, () => void> = {
  // UI
  'ui.click': playUiClick,
  'ui.hover': playUiHover,
  'ui.select': playUiSelect,

  // Countdown
  'countdown.beep': playCountdownBeep,
  'countdown.go': playCountdownGo,

  // Snake
  'snake.eat': playSnakeEat,
  'snake.die': playSnakeDie,
  'snake.turn': playSnakeTurn,
  'snake.speedup': playSnakeSpeedup,

  // Generic
  'score.up': playScoreUp,
  'powerup': playPowerup,
  'game.over': playGameOver,
  'victory': playVictory
}

/**
 * Play a sound effect by name
 */
export function playSfx(name: string): void {
  const sfx = sfxRegistry[name]
  if (sfx) {
    sfx()
  } else {
    console.warn(`Unknown SFX: ${name}`)
  }
}

/**
 * Get list of available SFX names
 */
export function getSfxNames(): string[] {
  return Object.keys(sfxRegistry)
}
