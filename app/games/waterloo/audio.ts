import { Tone, getAudioEngine } from '~/audio/engine'

// =============================================================================
// Sound Effects
// =============================================================================

// Rate limiting for musket fire to prevent zooming noise
let lastMusketTime = 0
const MUSKET_COOLDOWN = 100 // ms between musket sounds

/**
 * Play musket fire sound - sharp crack (with rate limiting)
 */
export function playMusketFire(): void {
  const engine = getAudioEngine()
  const output = engine.getMasterOutput()
  if (!output || !engine.isInitialized()) return

  // Rate limit to prevent overlapping sounds causing "zoom" effect
  const now = Date.now()
  if (now - lastMusketTime < MUSKET_COOLDOWN) return
  lastMusketTime = now

  // Use membrane synth for a sharper "crack" instead of noise
  const crack = new Tone.MembraneSynth({
    pitchDecay: 0.01,
    octaves: 2,
    oscillator: { type: 'sine' },
    envelope: { attack: 0.001, decay: 0.05, sustain: 0, release: 0.02 }
  }).connect(output)
  crack.volume.value = -12

  crack.triggerAttackRelease('G3', '32n')
  setTimeout(() => crack.dispose(), 150)
}

// Rate limiting for cannon sounds
let lastCannonTime = 0
const CANNON_COOLDOWN = 200 // ms between cannon sounds

/**
 * Play cannon fire sound - deep boom with rumble (with rate limiting)
 */
export function playCannonFire(): void {
  const engine = getAudioEngine()
  const output = engine.getMasterOutput()
  if (!output || !engine.isInitialized()) return

  // Rate limit to prevent overlapping sounds
  const now = Date.now()
  if (now - lastCannonTime < CANNON_COOLDOWN) return
  lastCannonTime = now

  // Low boom only (no noise for cleaner sound)
  const boom = new Tone.MembraneSynth({
    pitchDecay: 0.1,
    octaves: 4,
    oscillator: { type: 'sine' },
    envelope: { attack: 0.001, decay: 0.6, sustain: 0, release: 0.4 }
  }).connect(output)
  boom.volume.value = -8

  boom.triggerAttackRelease('C1', '4n')

  setTimeout(() => {
    boom.dispose()
  }, 800)
}

// Rate limiting for impact sounds
let lastImpactTime = 0
const IMPACT_COOLDOWN = 150 // ms between impact sounds

/**
 * Play cannonball impact sound (with rate limiting)
 */
export function playCannonImpact(): void {
  const engine = getAudioEngine()
  const output = engine.getMasterOutput()
  if (!output || !engine.isInitialized()) return

  // Rate limit to prevent overlapping sounds
  const now = Date.now()
  if (now - lastImpactTime < IMPACT_COOLDOWN) return
  lastImpactTime = now

  const impact = new Tone.MembraneSynth({
    pitchDecay: 0.05,
    octaves: 3,
    oscillator: { type: 'sine' },
    envelope: { attack: 0.001, decay: 0.2, sustain: 0, release: 0.1 }
  }).connect(output)
  impact.volume.value = -6

  impact.triggerAttackRelease('E1', '8n')
  setTimeout(() => impact.dispose(), 400)
}

/**
 * Play cavalry charge bugle call
 */
export function playCavalryCharge(): void {
  const engine = getAudioEngine()
  const output = engine.getMasterOutput()
  if (!output || !engine.isInitialized()) return

  const bugle = new Tone.Synth({
    oscillator: { type: 'sawtooth' },
    envelope: { attack: 0.02, decay: 0.1, sustain: 0.4, release: 0.2 }
  }).connect(output)

  const now = Tone.now()
  // Quick ascending bugle call
  bugle.triggerAttackRelease('G4', '16n', now)
  bugle.triggerAttackRelease('C5', '16n', now + 0.1)
  bugle.triggerAttackRelease('E5', '16n', now + 0.2)
  bugle.triggerAttackRelease('G5', '8n', now + 0.3)

  setTimeout(() => bugle.dispose(), 700)
}

/**
 * Play unit hit/death sound
 */
export function playUnitHit(): void {
  const engine = getAudioEngine()
  const output = engine.getMasterOutput()
  if (!output || !engine.isInitialized()) return

  const hit = new Tone.NoiseSynth({
    noise: { type: 'pink' },
    envelope: { attack: 0.001, decay: 0.05, sustain: 0, release: 0.02 }
  }).connect(output)

  hit.triggerAttackRelease('32n')
  setTimeout(() => hit.dispose(), 100)
}

/**
 * Play command/order issued - drum roll
 */
export function playOrderIssued(): void {
  const engine = getAudioEngine()
  const output = engine.getMasterOutput()
  if (!output || !engine.isInitialized()) return

  const drum = new Tone.MembraneSynth({
    pitchDecay: 0.02,
    octaves: 2,
    oscillator: { type: 'sine' },
    envelope: { attack: 0.001, decay: 0.1, sustain: 0, release: 0.05 }
  }).connect(output)

  const now = Tone.now()
  drum.triggerAttackRelease('C3', '32n', now)
  drum.triggerAttackRelease('C3', '32n', now + 0.05)

  setTimeout(() => drum.dispose(), 200)
}

/**
 * Play unit selection sound
 */
export function playUnitSelect(): void {
  const engine = getAudioEngine()
  const output = engine.getMasterOutput()
  if (!output || !engine.isInitialized()) return

  const synth = new Tone.Synth({
    oscillator: { type: 'triangle' },
    envelope: { attack: 0.001, decay: 0.08, sustain: 0, release: 0.02 }
  }).connect(output)

  synth.triggerAttackRelease('E5', '32n')
  setTimeout(() => synth.dispose(), 150)
}

/**
 * Play victory fanfare - triumphant military
 */
export function playBattleVictory(): void {
  const engine = getAudioEngine()
  const output = engine.getMasterOutput()
  if (!output || !engine.isInitialized()) return

  const brass = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'sawtooth' },
    envelope: { attack: 0.02, decay: 0.1, sustain: 0.4, release: 0.3 }
  }).connect(output)

  const drum = new Tone.MembraneSynth({
    pitchDecay: 0.02,
    octaves: 3,
    envelope: { attack: 0.001, decay: 0.3, sustain: 0, release: 0.1 }
  }).connect(output)

  const now = Tone.now()
  // Triumphant fanfare in D major
  brass.triggerAttackRelease(['D4', 'F#4', 'A4'], '8n', now)
  drum.triggerAttackRelease('C2', '8n', now)
  brass.triggerAttackRelease(['D4', 'F#4', 'A4'], '8n', now + 0.2)
  brass.triggerAttackRelease(['E4', 'G4', 'B4'], '8n', now + 0.4)
  brass.triggerAttackRelease(['F#4', 'A4', 'D5'], '4n', now + 0.6)
  drum.triggerAttackRelease('C2', '4n', now + 0.6)
  brass.triggerAttackRelease(['A4', 'D5', 'F#5'], '2n', now + 1.0)
  drum.triggerAttackRelease('C2', '4n', now + 1.0)

  setTimeout(() => {
    brass.dispose()
    drum.dispose()
  }, 2500)
}

/**
 * Play defeat sound - somber horn
 */
export function playBattleDefeat(): void {
  const engine = getAudioEngine()
  const output = engine.getMasterOutput()
  if (!output || !engine.isInitialized()) return

  const horn = new Tone.Synth({
    oscillator: { type: 'sawtooth' },
    envelope: { attack: 0.1, decay: 0.3, sustain: 0.4, release: 0.5 }
  }).connect(output)

  const now = Tone.now()
  // Descending minor - somber
  horn.triggerAttackRelease('D4', '4n', now)
  horn.triggerAttackRelease('C4', '4n', now + 0.5)
  horn.triggerAttackRelease('Bb3', '4n', now + 1.0)
  horn.triggerAttackRelease('A3', '2n', now + 1.5)

  setTimeout(() => horn.dispose(), 3000)
}

/**
 * Play routing unit sound - panicked drums
 */
export function playUnitRouting(): void {
  const engine = getAudioEngine()
  const output = engine.getMasterOutput()
  if (!output || !engine.isInitialized()) return

  const drum = new Tone.MembraneSynth({
    pitchDecay: 0.01,
    octaves: 2,
    envelope: { attack: 0.001, decay: 0.1, sustain: 0, release: 0.05 }
  }).connect(output)

  const now = Tone.now()
  // Rapid descending drums
  drum.triggerAttackRelease('G3', '32n', now)
  drum.triggerAttackRelease('E3', '32n', now + 0.08)
  drum.triggerAttackRelease('C3', '32n', now + 0.16)

  setTimeout(() => drum.dispose(), 300)
}

// =============================================================================
// Napoleonic Military March Music
// =============================================================================

interface NapoleonicMarch {
  start: () => void
  stop: () => void
  dispose: () => void
}

/**
 * Create a Napoleonic military march
 * Features: snare drum, bass drum, fife/flute melody
 * Style: British Grenadiers / La Marseillaise inspired
 */
export function createNapoleonicMarch(): NapoleonicMarch {
  const engine = getAudioEngine()
  const output = engine.getMasterOutput()

  let isPlaying = false
  let snareDrum: Tone.NoiseSynth | null = null
  let bassDrum: Tone.MembraneSynth | null = null
  let fife: Tone.Synth | null = null
  let snarePattern: Tone.Pattern<string> | null = null
  let bassPattern: Tone.Sequence<number> | null = null
  let melodyPart: Tone.Part<{ time: number; note: string; duration: string }> | null = null

  // Military march in D major, 4/4 time at 120 BPM
  // Melody inspired by period military marches
  const melodyNotes = [
    // Bar 1 - Opening phrase
    { time: '0:0:0', note: 'D5', duration: '8n' },
    { time: '0:0:2', note: 'D5', duration: '8n' },
    { time: '0:1:0', note: 'E5', duration: '8n' },
    { time: '0:1:2', note: 'F#5', duration: '8n' },
    { time: '0:2:0', note: 'G5', duration: '4n' },
    { time: '0:3:0', note: 'F#5', duration: '8n' },
    { time: '0:3:2', note: 'E5', duration: '8n' },

    // Bar 2
    { time: '1:0:0', note: 'D5', duration: '4n' },
    { time: '1:1:0', note: 'A4', duration: '4n' },
    { time: '1:2:0', note: 'B4', duration: '8n' },
    { time: '1:2:2', note: 'C#5', duration: '8n' },
    { time: '1:3:0', note: 'D5', duration: '4n' },

    // Bar 3 - Second phrase
    { time: '2:0:0', note: 'E5', duration: '8n' },
    { time: '2:0:2', note: 'E5', duration: '8n' },
    { time: '2:1:0', note: 'F#5', duration: '8n' },
    { time: '2:1:2', note: 'G5', duration: '8n' },
    { time: '2:2:0', note: 'A5', duration: '4n' },
    { time: '2:3:0', note: 'G5', duration: '8n' },
    { time: '2:3:2', note: 'F#5', duration: '8n' },

    // Bar 4
    { time: '3:0:0', note: 'E5', duration: '4n' },
    { time: '3:1:0', note: 'D5', duration: '4n' },
    { time: '3:2:0', note: 'C#5', duration: '8n' },
    { time: '3:2:2', note: 'B4', duration: '8n' },
    { time: '3:3:0', note: 'A4', duration: '4n' },

    // Bar 5 - Triumphant section
    { time: '4:0:0', note: 'D5', duration: '4n.' },
    { time: '4:1:2', note: 'E5', duration: '8n' },
    { time: '4:2:0', note: 'F#5', duration: '4n' },
    { time: '4:3:0', note: 'G5', duration: '4n' },

    // Bar 6
    { time: '5:0:0', note: 'A5', duration: '2n' },
    { time: '5:2:0', note: 'G5', duration: '8n' },
    { time: '5:2:2', note: 'F#5', duration: '8n' },
    { time: '5:3:0', note: 'E5', duration: '8n' },
    { time: '5:3:2', note: 'D5', duration: '8n' },

    // Bar 7 - Resolution
    { time: '6:0:0', note: 'G5', duration: '4n' },
    { time: '6:1:0', note: 'F#5', duration: '4n' },
    { time: '6:2:0', note: 'E5', duration: '4n' },
    { time: '6:3:0', note: 'D5', duration: '4n' },

    // Bar 8 - Final cadence
    { time: '7:0:0', note: 'A4', duration: '4n' },
    { time: '7:1:0', note: 'B4', duration: '4n' },
    { time: '7:2:0', note: 'C#5', duration: '4n' },
    { time: '7:3:0', note: 'D5', duration: '4n' }
  ]

  function start(): void {
    if (isPlaying || !output) return
    isPlaying = true

    // Stop transport first to avoid glitches
    Tone.getTransport().stop()
    Tone.getTransport().position = 0
    Tone.getTransport().bpm.value = 112

    // Snare drum - softer, longer decay
    snareDrum = new Tone.NoiseSynth({
      noise: { type: 'pink' },
      envelope: { attack: 0.005, decay: 0.15, sustain: 0, release: 0.1 }
    })
    snareDrum.volume.value = -18
    snareDrum.connect(output)

    // Bass drum - deeper, softer
    bassDrum = new Tone.MembraneSynth({
      pitchDecay: 0.05,
      octaves: 6,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.01, decay: 0.4, sustain: 0, release: 0.2 }
    })
    bassDrum.volume.value = -14
    bassDrum.connect(output)

    // Fife (high-pitched flute-like sound) - softer
    fife = new Tone.Synth({
      oscillator: { type: 'sine' },
      envelope: { attack: 0.05, decay: 0.1, sustain: 0.4, release: 0.2 }
    })
    fife.volume.value = -10
    fife.connect(output)

    // Snare pattern - proper military march rhythm (not constant)
    // Pattern: hit on 1, 2&, 3, 4& (classic march feel)
    snarePattern = new Tone.Sequence(
      (time, shouldHit) => {
        if (snareDrum && shouldHit) {
          snareDrum.triggerAttackRelease('16n', time)
        }
      },
      [true, false, true, true, true, false, true, true], // 1 . 2& 3 . 4&
      '8n'
    )

    // Bass drum on beats 1 and 3 only
    bassPattern = new Tone.Sequence(
      (time, beat) => {
        if (bassDrum && (beat === 0 || beat === 2)) {
          bassDrum.triggerAttackRelease('C1', '4n', time)
        }
      },
      [0, 1, 2, 3],
      '4n'
    )

    // Melody part
    melodyPart = new Tone.Part((time, value) => {
      if (fife) {
        fife.triggerAttackRelease(value.note, value.duration, time)
      }
    }, melodyNotes)
    melodyPart.loop = true
    melodyPart.loopEnd = '8m'

    // Start all parts with slight offset to avoid initial glitch
    snarePattern.start('0:1:0') // Start snare after 1 beat
    bassPattern.start(0)
    melodyPart.start(0)

    // Small delay before starting transport
    setTimeout(() => {
      if (isPlaying) {
        Tone.getTransport().start()
      }
    }, 100)
  }

  function stop(): void {
    if (!isPlaying) return
    isPlaying = false

    Tone.getTransport().stop()
    Tone.getTransport().position = 0

    snarePattern?.stop()
    bassPattern?.stop()
    melodyPart?.stop()
  }

  function dispose(): void {
    stop()

    snarePattern?.dispose()
    bassPattern?.dispose()
    melodyPart?.dispose()
    snareDrum?.dispose()
    bassDrum?.dispose()
    fife?.dispose()

    snarePattern = null
    bassPattern = null
    melodyPart = null
    snareDrum = null
    bassDrum = null
    fife = null
  }

  return { start, stop, dispose }
}

// Register the march with the audio engine
export function registerWaterlooMusic(): void {
  const engine = getAudioEngine()
  engine.registerSong('waterloo-march', createNapoleonicMarch)
}
