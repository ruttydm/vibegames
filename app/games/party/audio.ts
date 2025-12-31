import { Tone, getAudioEngine } from '~/audio/engine'

/**
 * Play a one-shot sound effect
 */
function playOneShot(
  createSynth: () => Tone.Synth | Tone.NoiseSynth | Tone.PolySynth | Tone.MembraneSynth,
  play: (synth: any) => void,
  duration: number = 500
): void {
  const engine = getAudioEngine()
  const output = engine.getMasterOutput()
  if (!output || !engine.isInitialized()) return

  const synth = createSynth()
  synth.connect(output)
  play(synth)

  setTimeout(() => {
    try {
      synth.dispose()
    } catch {
      // Ignore
    }
  }, duration)
}

// =============================================================================
// Party Sound Effects
// =============================================================================

export function playPartyJoin(): void {
  const engine = getAudioEngine()
  const output = engine.getMasterOutput()
  if (!output || !engine.isInitialized()) return

  const synth = new Tone.Synth({
    oscillator: { type: 'square' },
    envelope: { attack: 0.01, decay: 0.1, sustain: 0.1, release: 0.1 }
  }).connect(output)

  // Welcoming ascending notes
  const now = Tone.now()
  synth.triggerAttackRelease('C5', '16n', now)
  synth.triggerAttackRelease('E5', '16n', now + 0.08)
  synth.triggerAttackRelease('G5', '8n', now + 0.16)

  setTimeout(() => synth.dispose(), 400)
}

export function playPartyReady(): void {
  playOneShot(
    () => new Tone.Synth({
      oscillator: { type: 'square' },
      envelope: { attack: 0.001, decay: 0.08, sustain: 0.05, release: 0.05 }
    }),
    (synth) => synth.triggerAttackRelease('G5', '16n'),
    150
  )
}

export function playPartyStart(): void {
  const engine = getAudioEngine()
  const output = engine.getMasterOutput()
  if (!output || !engine.isInitialized()) return

  const synth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'square' },
    envelope: { attack: 0.01, decay: 0.15, sustain: 0.2, release: 0.1 }
  }).connect(output)

  // Exciting fanfare
  const now = Tone.now()
  synth.triggerAttackRelease(['C5', 'E5'], '8n', now)
  synth.triggerAttackRelease(['E5', 'G5'], '8n', now + 0.12)
  synth.triggerAttackRelease(['G5', 'C6'], '4n', now + 0.24)

  setTimeout(() => synth.dispose(), 600)
}

export function playPartyCorrect(): void {
  const engine = getAudioEngine()
  const output = engine.getMasterOutput()
  if (!output || !engine.isInitialized()) return

  const synth = new Tone.Synth({
    oscillator: { type: 'square' },
    envelope: { attack: 0.001, decay: 0.1, sustain: 0.1, release: 0.1 }
  }).connect(output)

  // Happy success sound
  const now = Tone.now()
  synth.triggerAttackRelease('E5', '16n', now)
  synth.triggerAttackRelease('G5', '16n', now + 0.06)
  synth.triggerAttackRelease('C6', '8n', now + 0.12)

  setTimeout(() => synth.dispose(), 300)
}

export function playPartyWrong(): void {
  playOneShot(
    () => new Tone.Synth({
      oscillator: { type: 'sawtooth' },
      envelope: { attack: 0.01, decay: 0.15, sustain: 0.1, release: 0.1 }
    }),
    (synth) => synth.triggerAttackRelease('C3', '8n'),
    250
  )
}

export function playPartyBuzz(): void {
  playOneShot(
    () => new Tone.MembraneSynth({
      pitchDecay: 0.05,
      envelope: { attack: 0.001, decay: 0.1, sustain: 0, release: 0.05 }
    }),
    (synth) => synth.triggerAttackRelease('C2', '16n'),
    150
  )
}

export function playPartyTick(): void {
  playOneShot(
    () => new Tone.Synth({
      oscillator: { type: 'square' },
      envelope: { attack: 0.001, decay: 0.03, sustain: 0, release: 0.01 }
    }),
    (synth) => synth.triggerAttackRelease('A4', '64n'),
    50
  )
}

export function playPartyTimerWarning(): void {
  playOneShot(
    () => new Tone.Synth({
      oscillator: { type: 'square' },
      envelope: { attack: 0.001, decay: 0.1, sustain: 0.05, release: 0.05 }
    }),
    (synth) => synth.triggerAttackRelease('E4', '16n'),
    150
  )
}

export function playPartyReveal(): void {
  const engine = getAudioEngine()
  const output = engine.getMasterOutput()
  if (!output || !engine.isInitialized()) return

  const synth = new Tone.Synth({
    oscillator: { type: 'triangle' },
    envelope: { attack: 0.01, decay: 0.3, sustain: 0.2, release: 0.2 }
  }).connect(output)

  // Dramatic reveal flourish
  const now = Tone.now()
  synth.triggerAttackRelease('C4', '16n', now)
  synth.triggerAttackRelease('E4', '16n', now + 0.1)
  synth.triggerAttackRelease('G4', '16n', now + 0.2)
  synth.triggerAttackRelease('C5', '4n', now + 0.3)

  setTimeout(() => synth.dispose(), 800)
}

export function playPartyCelebration(): void {
  const engine = getAudioEngine()
  const output = engine.getMasterOutput()
  if (!output || !engine.isInitialized()) return

  const synth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'square' },
    envelope: { attack: 0.01, decay: 0.15, sustain: 0.3, release: 0.2 }
  }).connect(output)

  // Victory celebration!
  const now = Tone.now()
  synth.triggerAttackRelease(['C5', 'E5', 'G5'], '8n', now)
  synth.triggerAttackRelease(['D5', 'F5', 'A5'], '8n', now + 0.15)
  synth.triggerAttackRelease(['E5', 'G5', 'B5'], '8n', now + 0.3)
  synth.triggerAttackRelease(['F5', 'A5', 'C6'], '8n', now + 0.45)
  synth.triggerAttackRelease(['G5', 'B5', 'D6'], '8n', now + 0.6)
  synth.triggerAttackRelease(['C6', 'E6', 'G6'], '4n', now + 0.75)

  setTimeout(() => synth.dispose(), 1500)
}

export function playPartyCountdown(): void {
  const engine = getAudioEngine()
  const output = engine.getMasterOutput()
  if (!output || !engine.isInitialized()) return

  const synth = new Tone.Synth({
    oscillator: { type: 'square' },
    envelope: { attack: 0.001, decay: 0.2, sustain: 0.1, release: 0.1 }
  }).connect(output)

  // NYE countdown beep (higher than regular countdown)
  synth.triggerAttackRelease('A5', '8n')

  setTimeout(() => synth.dispose(), 300)
}

export function playMidnightChime(): void {
  const engine = getAudioEngine()
  const output = engine.getMasterOutput()
  if (!output || !engine.isInitialized()) return

  const synth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'triangle' },
    envelope: { attack: 0.1, decay: 0.5, sustain: 0.3, release: 1 }
  }).connect(output)

  // Midnight chime - like Big Ben
  const now = Tone.now()
  synth.triggerAttackRelease(['E4', 'G4', 'C5'], '2n', now)
  synth.triggerAttackRelease(['D4', 'G4', 'B4'], '2n', now + 0.5)
  synth.triggerAttackRelease(['C4', 'E4', 'G4'], '2n', now + 1)
  synth.triggerAttackRelease(['G3', 'C4', 'E4'], '1n', now + 1.5)

  setTimeout(() => synth.dispose(), 4000)
}

// =============================================================================
// Party Theme Song - Award-Winning NYE Celebration
// =============================================================================

export function createPartySong() {
  // Lead melody synth - bright and celebratory
  const leadSynth = new Tone.Synth({
    oscillator: { type: 'square' },
    envelope: { attack: 0.01, decay: 0.15, sustain: 0.4, release: 0.15 }
  }).toDestination()
  leadSynth.volume.value = -10

  // Secondary melody for harmony
  const harmonySynth = new Tone.Synth({
    oscillator: { type: 'triangle' },
    envelope: { attack: 0.02, decay: 0.2, sustain: 0.3, release: 0.2 }
  }).toDestination()
  harmonySynth.volume.value = -14

  // Deep bass synth
  const bassSynth = new Tone.Synth({
    oscillator: { type: 'triangle' },
    envelope: { attack: 0.01, decay: 0.3, sustain: 0.5, release: 0.3 }
  }).toDestination()
  bassSynth.volume.value = -8

  // Sparkling arpeggio synth
  const arpSynth = new Tone.Synth({
    oscillator: { type: 'sine' },
    envelope: { attack: 0.005, decay: 0.1, sustain: 0.1, release: 0.1 }
  }).toDestination()
  arpSynth.volume.value = -16

  // Rich pad chords
  const padSynth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'sine' },
    envelope: { attack: 0.3, decay: 0.4, sustain: 0.6, release: 0.5 }
  }).toDestination()
  padSynth.volume.value = -20

  // Punchy chord stabs
  const stabSynth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'square' },
    envelope: { attack: 0.005, decay: 0.1, sustain: 0.05, release: 0.1 }
  }).toDestination()
  stabSynth.volume.value = -14

  // Kick drum
  const kick = new Tone.MembraneSynth({
    pitchDecay: 0.05,
    octaves: 4,
    envelope: { attack: 0.001, decay: 0.2, sustain: 0, release: 0.2 }
  }).toDestination()
  kick.volume.value = -6

  // Hi-hat
  const hihat = new Tone.NoiseSynth({
    noise: { type: 'white' },
    envelope: { attack: 0.001, decay: 0.05, sustain: 0, release: 0.02 }
  }).toDestination()
  hihat.volume.value = -18

  // Snare
  const snare = new Tone.NoiseSynth({
    noise: { type: 'pink' },
    envelope: { attack: 0.001, decay: 0.15, sustain: 0, release: 0.1 }
  }).toDestination()
  snare.volume.value = -12

  // Epic lead melody - triumphant NYE celebration
  const leadPart = new Tone.Sequence(
    (time: number, note: string | null) => {
      if (note) leadSynth.triggerAttackRelease(note, '8n', time)
    },
    [
      // Section A: Triumphant opener (16 notes)
      'C5', 'E5', 'G5', 'C6', 'B5', 'G5', 'A5', 'B5',
      'C6', 'D6', 'E6', 'D6', 'C6', 'B5', 'A5', 'G5',
      // Section A': Rising energy (16 notes)
      'A5', 'B5', 'C6', 'D6', 'E6', 'D6', 'C6', 'E6',
      'D6', 'C6', 'B5', 'C6', 'G5', 'A5', 'B5', 'C6',
      // Section B: Celebration hook (16 notes)
      'E6', 'E6', 'D6', 'C6', 'D6', 'D6', 'C6', 'B5',
      'C6', 'C6', 'B5', 'A5', 'B5', 'C6', 'D6', 'E6',
      // Section B': Peak and resolution (16 notes)
      'G6', 'F6', 'E6', 'D6', 'E6', 'D6', 'C6', 'B5',
      'C6', 'E5', 'G5', 'C6', null, 'G5', 'C6', null
    ],
    '8n'
  )

  // Harmony part - follows lead in thirds/sixths
  const harmonyPart = new Tone.Sequence(
    (time: number, note: string | null) => {
      if (note) harmonySynth.triggerAttackRelease(note, '8n', time)
    },
    [
      // Section A harmony
      'E4', 'G4', 'C5', 'E5', 'G4', 'E4', 'F4', 'G4',
      'A4', 'B4', 'C5', 'B4', 'A4', 'G4', 'F4', 'E4',
      // Section A' harmony
      'F4', 'G4', 'A4', 'B4', 'C5', 'B4', 'A4', 'C5',
      'B4', 'A4', 'G4', 'A4', 'E4', 'F4', 'G4', 'A4',
      // Section B harmony
      'C5', 'C5', 'B4', 'A4', 'B4', 'B4', 'A4', 'G4',
      'A4', 'A4', 'G4', 'F4', 'G4', 'A4', 'B4', 'C5',
      // Section B' harmony
      'E5', 'D5', 'C5', 'B4', 'C5', 'B4', 'A4', 'G4',
      'E4', 'C4', 'E4', 'G4', null, 'E4', 'G4', null
    ],
    '8n'
  )

  // Driving bass line
  const bassPart = new Tone.Sequence(
    (time: number, note: string | null) => {
      if (note) bassSynth.triggerAttackRelease(note, '8n', time)
    },
    [
      // Section A bass
      'C2', 'C3', 'C2', 'C3', 'G2', 'G3', 'G2', 'G3',
      'A2', 'A3', 'A2', 'A3', 'E2', 'E3', 'E2', 'G2',
      // Section A' bass
      'F2', 'F3', 'F2', 'F3', 'C2', 'C3', 'C2', 'C3',
      'G2', 'G3', 'G2', 'G3', 'G2', 'G3', 'G2', 'G3',
      // Section B bass - more movement
      'C2', 'C3', 'E2', 'E3', 'G2', 'G3', 'E2', 'E3',
      'A2', 'A3', 'E2', 'E3', 'F2', 'F3', 'G2', 'G3',
      // Section B' bass - building finale
      'C3', 'E3', 'G3', 'E3', 'F3', 'A3', 'G3', 'E3',
      'C2', 'C3', 'C2', 'G2', 'C2', 'E2', 'G2', 'C3'
    ],
    '8n'
  )

  // Sparkling arpeggios
  const arpPart = new Tone.Sequence(
    (time: number, note: string | null) => {
      if (note) arpSynth.triggerAttackRelease(note, '16n', time)
    },
    [
      // Fast ascending arpeggios
      'C6', 'E6', 'G6', 'C7', 'G6', 'E6', 'C6', 'E6',
      'G5', 'B5', 'D6', 'G6', 'D6', 'B5', 'G5', 'B5',
      'A5', 'C6', 'E6', 'A6', 'E6', 'C6', 'A5', 'C6',
      'E5', 'G5', 'B5', 'E6', 'B5', 'G5', 'E5', 'G5',
      // Section 2 - varied patterns
      'F5', 'A5', 'C6', 'F6', 'C6', 'A5', 'F5', 'A5',
      'C5', 'E5', 'G5', 'C6', 'G5', 'E5', 'C5', 'E5',
      'G5', 'B5', 'D6', 'G6', 'D6', 'B5', 'G5', 'B5',
      'C6', 'E6', 'G6', 'C7', 'G6', 'E6', 'C6', null
    ],
    '16n'
  )

  // Rich pad chords - slow changes
  const padPart = new Tone.Sequence(
    (time: number, chord: string[] | null) => {
      if (chord) padSynth.triggerAttackRelease(chord, '1n', time)
    },
    [
      ['C3', 'E3', 'G3', 'C4'], ['C3', 'E3', 'G3', 'C4'],
      ['G2', 'B2', 'D3', 'G3'], ['G2', 'B2', 'D3', 'G3'],
      ['A2', 'C3', 'E3', 'A3'], ['A2', 'C3', 'E3', 'A3'],
      ['F2', 'A2', 'C3', 'F3'], ['G2', 'B2', 'D3', 'G3'],
      ['C3', 'E3', 'G3', 'C4'], ['E2', 'G2', 'B2', 'E3'],
      ['A2', 'C3', 'E3', 'A3'], ['F2', 'A2', 'C3', 'F3'],
      ['G2', 'B2', 'D3', 'G3'], ['G2', 'B2', 'D3', 'G3'],
      ['C3', 'E3', 'G3', 'C4'], ['C3', 'E3', 'G3', 'C4']
    ],
    '1n'
  )

  // Punchy chord stabs on upbeats
  const stabPart = new Tone.Sequence(
    (time: number, chord: string[] | null) => {
      if (chord) stabSynth.triggerAttackRelease(chord, '16n', time)
    },
    [
      null, ['C5', 'E5', 'G5'], null, null, null, ['G4', 'B4', 'D5'], null, null,
      null, ['A4', 'C5', 'E5'], null, null, null, ['E4', 'G4', 'B4'], null, ['G4', 'B4', 'D5'],
      null, ['F4', 'A4', 'C5'], null, null, null, ['C5', 'E5', 'G5'], null, null,
      null, ['G4', 'B4', 'D5'], null, ['G4', 'B4', 'D5'], null, null, null, null,
      null, ['C5', 'E5', 'G5'], null, ['E4', 'G4', 'B4'], null, ['G4', 'B4', 'D5'], null, ['E4', 'G4', 'B4'],
      null, ['A4', 'C5', 'E5'], null, ['E4', 'G4', 'B4'], null, ['F4', 'A4', 'C5'], null, ['G4', 'B4', 'D5'],
      null, ['C5', 'E5', 'G5'], null, ['E5', 'G5', 'B5'], null, ['F4', 'A4', 'C5'], null, ['G4', 'B4', 'D5'],
      ['C5', 'E5', 'G5'], null, null, null, ['C5', 'E5', 'G5'], null, null, null
    ],
    '8n'
  )

  // Four-on-the-floor kick pattern
  const kickPart = new Tone.Sequence(
    (time: number, hit: number | null) => {
      if (hit) kick.triggerAttackRelease('C1', '8n', time)
    },
    [1, null, null, null, 1, null, null, null, 1, null, null, null, 1, null, null, null],
    '16n'
  )

  // Hi-hat pattern - offbeat energy
  const hihatPart = new Tone.Sequence(
    (time: number, hit: number | null) => {
      if (hit) hihat.triggerAttackRelease('16n', time)
    },
    [null, null, 1, null, null, null, 1, null, null, null, 1, null, null, null, 1, null],
    '16n'
  )

  // Snare on 2 and 4
  const snarePart = new Tone.Sequence(
    (time: number, hit: number | null) => {
      if (hit) snare.triggerAttackRelease('16n', time)
    },
    [null, null, null, null, 1, null, null, null, null, null, null, null, 1, null, null, null],
    '16n'
  )

  return {
    start() {
      Tone.Transport.bpm.value = 128
      leadPart.start(0)
      harmonyPart.start(0)
      bassPart.start(0)
      arpPart.start(0)
      padPart.start(0)
      stabPart.start(0)
      kickPart.start(0)
      hihatPart.start(0)
      snarePart.start(0)
      Tone.Transport.start()
    },
    stop() {
      leadPart.stop()
      harmonyPart.stop()
      bassPart.stop()
      arpPart.stop()
      padPart.stop()
      stabPart.stop()
      kickPart.stop()
      hihatPart.stop()
      snarePart.stop()
      Tone.Transport.stop()
    },
    dispose() {
      leadPart.dispose()
      harmonyPart.dispose()
      bassPart.dispose()
      arpPart.dispose()
      padPart.dispose()
      stabPart.dispose()
      kickPart.dispose()
      hihatPart.dispose()
      snarePart.dispose()
      leadSynth.dispose()
      harmonySynth.dispose()
      bassSynth.dispose()
      arpSynth.dispose()
      padSynth.dispose()
      stabSynth.dispose()
      kick.dispose()
      hihat.dispose()
      snare.dispose()
    }
  }
}

// =============================================================================
// Party SFX Registry
// =============================================================================

export const partySfxRegistry: Record<string, () => void> = {
  'party.join': playPartyJoin,
  'party.ready': playPartyReady,
  'party.start': playPartyStart,
  'party.correct': playPartyCorrect,
  'party.wrong': playPartyWrong,
  'party.buzz': playPartyBuzz,
  'party.tick': playPartyTick,
  'party.timer.warning': playPartyTimerWarning,
  'party.reveal': playPartyReveal,
  'party.celebration': playPartyCelebration,
  'party.countdown': playPartyCountdown,
  'party.midnight': playMidnightChime
}

// =============================================================================
// TRIVIA GAME THEME - Quiz Show Style (2024 Rewind)
// Think-y, tension-building, classic quiz show vibes
// =============================================================================

export function createTriviaSong() {
  const engine = getAudioEngine()
  const output = engine.getMasterOutput()
  if (!output) return { start: () => {}, stop: () => {}, dispose: () => {} }

  // Thinking melody - mysterious, contemplative
  const thinkSynth = new Tone.Synth({
    oscillator: { type: 'sine' },
    envelope: { attack: 0.05, decay: 0.2, sustain: 0.4, release: 0.3 }
  }).connect(output)
  thinkSynth.volume.value = -12

  // Tension synth - builds suspense
  const tensionSynth = new Tone.Synth({
    oscillator: { type: 'triangle' },
    envelope: { attack: 0.1, decay: 0.3, sustain: 0.5, release: 0.4 }
  }).connect(output)
  tensionSynth.volume.value = -14

  // Bass - steady pulse
  const bassSynth = new Tone.Synth({
    oscillator: { type: 'triangle' },
    envelope: { attack: 0.01, decay: 0.2, sustain: 0.4, release: 0.2 }
  }).connect(output)
  bassSynth.volume.value = -10

  // Tick-tock percussion
  const tickSynth = new Tone.Synth({
    oscillator: { type: 'square' },
    envelope: { attack: 0.001, decay: 0.05, sustain: 0, release: 0.02 }
  }).connect(output)
  tickSynth.volume.value = -16

  // Pad for atmosphere
  const padSynth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'sine' },
    envelope: { attack: 0.5, decay: 0.5, sustain: 0.6, release: 0.8 }
  }).connect(output)
  padSynth.volume.value = -20

  // Quiz show thinking melody
  const thinkPart = new Tone.Sequence(
    (time: number, note: string | null) => {
      if (note) thinkSynth.triggerAttackRelease(note, '4n', time)
    },
    [
      'E4', 'G4', 'A4', 'B4', 'A4', 'G4', 'E4', 'D4',
      'E4', 'G4', 'B4', 'D5', 'C5', 'B4', 'A4', 'G4',
      'F4', 'A4', 'C5', 'E5', 'D5', 'C5', 'B4', 'A4',
      'G4', 'B4', 'D5', 'E5', 'D5', 'B4', 'G4', 'E4'
    ],
    '8n'
  )

  // Counter melody for tension
  const tensionPart = new Tone.Sequence(
    (time: number, note: string | null) => {
      if (note) tensionSynth.triggerAttackRelease(note, '2n', time)
    },
    [
      'E3', null, 'G3', null, 'A3', null, 'B3', null,
      'C4', null, 'B3', null, 'A3', null, 'G3', null
    ],
    '4n'
  )

  // Steady bass pulse
  const bassPart = new Tone.Sequence(
    (time: number, note: string | null) => {
      if (note) bassSynth.triggerAttackRelease(note, '8n', time)
    },
    [
      'E2', null, 'E2', null, 'E2', null, 'E2', null,
      'A2', null, 'A2', null, 'A2', null, 'A2', null,
      'D2', null, 'D2', null, 'D2', null, 'D2', null,
      'G2', null, 'G2', null, 'B2', null, 'B2', null
    ],
    '8n'
  )

  // Tick-tock effect
  const tickPart = new Tone.Sequence(
    (time: number, hit: number | null) => {
      if (hit === 1) tickSynth.triggerAttackRelease('C6', '32n', time)
      else if (hit === 2) tickSynth.triggerAttackRelease('G5', '32n', time)
    },
    [1, null, 2, null, 1, null, 2, null],
    '8n'
  )

  // Atmospheric pad
  const padPart = new Tone.Sequence(
    (time: number, chord: string[] | null) => {
      if (chord) padSynth.triggerAttackRelease(chord, '1n', time)
    },
    [
      ['E3', 'G3', 'B3'], ['E3', 'G3', 'B3'],
      ['A3', 'C4', 'E4'], ['A3', 'C4', 'E4'],
      ['D3', 'F3', 'A3'], ['D3', 'F3', 'A3'],
      ['G3', 'B3', 'D4'], ['G3', 'B3', 'D4']
    ],
    '1n'
  )

  return {
    start() {
      Tone.getTransport().bpm.value = 110
      thinkPart.start(0)
      tensionPart.start(0)
      bassPart.start(0)
      tickPart.start(0)
      padPart.start(0)
      Tone.getTransport().start()
    },
    stop() {
      thinkPart.stop()
      tensionPart.stop()
      bassPart.stop()
      tickPart.stop()
      padPart.stop()
      Tone.getTransport().stop()
    },
    dispose() {
      thinkPart.dispose()
      tensionPart.dispose()
      bassPart.dispose()
      tickPart.dispose()
      padPart.dispose()
      thinkSynth.dispose()
      tensionSynth.dispose()
      bassSynth.dispose()
      tickSynth.dispose()
      padSynth.dispose()
    }
  }
}

// =============================================================================
// VOTING GAME THEME - Suspenseful Drama (Most Likely To)
// Mystery, anticipation, dramatic reveals
// =============================================================================

export function createVotingSong() {
  const engine = getAudioEngine()
  const output = engine.getMasterOutput()
  if (!output) return { start: () => {}, stop: () => {}, dispose: () => {} }

  // Mysterious lead
  const mysterySynth = new Tone.Synth({
    oscillator: { type: 'triangle' },
    envelope: { attack: 0.1, decay: 0.4, sustain: 0.3, release: 0.5 }
  }).connect(output)
  mysterySynth.volume.value = -12

  // Deep dramatic bass
  const dramaticBass = new Tone.Synth({
    oscillator: { type: 'sawtooth' },
    envelope: { attack: 0.05, decay: 0.3, sustain: 0.4, release: 0.3 }
  }).connect(output)
  dramaticBass.volume.value = -10

  // Suspense strings (pad)
  const suspensePad = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'sine' },
    envelope: { attack: 0.8, decay: 0.5, sustain: 0.7, release: 1 }
  }).connect(output)
  suspensePad.volume.value = -18

  // Plucky intrigue
  const pluckSynth = new Tone.Synth({
    oscillator: { type: 'triangle' },
    envelope: { attack: 0.001, decay: 0.15, sustain: 0.05, release: 0.1 }
  }).connect(output)
  pluckSynth.volume.value = -14

  // Heartbeat kick
  const heartbeat = new Tone.MembraneSynth({
    pitchDecay: 0.08,
    envelope: { attack: 0.001, decay: 0.3, sustain: 0, release: 0.3 }
  }).connect(output)
  heartbeat.volume.value = -8

  // Mysterious melody - minor key, questioning
  const mysteryPart = new Tone.Sequence(
    (time: number, note: string | null) => {
      if (note) mysterySynth.triggerAttackRelease(note, '4n', time)
    },
    [
      'A4', null, 'C5', null, 'E5', null, 'D5', null,
      'C5', null, 'B4', null, 'A4', null, 'G#4', null,
      'A4', null, 'E5', null, 'D5', null, 'C5', null,
      'B4', null, 'A4', null, 'G#4', null, 'A4', null
    ],
    '8n'
  )

  // Deep bass - ominous
  const bassPart = new Tone.Sequence(
    (time: number, note: string | null) => {
      if (note) dramaticBass.triggerAttackRelease(note, '4n', time)
    },
    [
      'A1', null, null, null, 'A1', null, 'E2', null,
      'A1', null, null, null, 'G1', null, 'F1', null,
      'A1', null, null, null, 'A1', null, 'E2', null,
      'D2', null, 'E2', null, 'A1', null, null, null
    ],
    '8n'
  )

  // Suspenseful pad chords
  const padPart = new Tone.Sequence(
    (time: number, chord: string[] | null) => {
      if (chord) suspensePad.triggerAttackRelease(chord, '2n', time)
    },
    [
      ['A3', 'C4', 'E4'], null, ['A3', 'C4', 'E4'], null,
      ['G3', 'B3', 'D4'], null, ['F3', 'A3', 'C4'], null,
      ['A3', 'C4', 'E4'], null, ['E3', 'G#3', 'B3'], null,
      ['D3', 'F3', 'A3'], null, ['E3', 'G#3', 'B3'], null
    ],
    '4n'
  )

  // Plucky accents
  const pluckPart = new Tone.Sequence(
    (time: number, note: string | null) => {
      if (note) pluckSynth.triggerAttackRelease(note, '16n', time)
    },
    [
      null, null, 'E5', null, null, null, 'A5', null,
      null, null, 'D5', null, null, null, 'G#4', null,
      null, null, 'C5', null, null, null, 'E5', null,
      null, null, 'B4', null, null, null, 'A4', null
    ],
    '8n'
  )

  // Heartbeat rhythm
  const heartbeatPart = new Tone.Sequence(
    (time: number, hit: number | null) => {
      if (hit) heartbeat.triggerAttackRelease('C1', '8n', time)
    },
    [1, null, 1, null, null, null, null, null],
    '8n'
  )

  return {
    start() {
      Tone.getTransport().bpm.value = 85
      mysteryPart.start(0)
      bassPart.start(0)
      padPart.start(0)
      pluckPart.start(0)
      heartbeatPart.start(0)
      Tone.getTransport().start()
    },
    stop() {
      mysteryPart.stop()
      bassPart.stop()
      padPart.stop()
      pluckPart.stop()
      heartbeatPart.stop()
      Tone.getTransport().stop()
    },
    dispose() {
      mysteryPart.dispose()
      bassPart.dispose()
      padPart.dispose()
      pluckPart.dispose()
      heartbeatPart.dispose()
      mysterySynth.dispose()
      dramaticBass.dispose()
      suspensePad.dispose()
      pluckSynth.dispose()
      heartbeat.dispose()
    }
  }
}

// =============================================================================
// DRAWING GAME THEME - Playful & Creative (Sketch NYE)
// Whimsical, bouncy, artistic vibes
// =============================================================================

export function createDrawingSong() {
  const engine = getAudioEngine()
  const output = engine.getMasterOutput()
  if (!output) return { start: () => {}, stop: () => {}, dispose: () => {} }

  // Playful lead - bouncy and fun
  const playfulSynth = new Tone.Synth({
    oscillator: { type: 'square' },
    envelope: { attack: 0.01, decay: 0.1, sustain: 0.2, release: 0.1 }
  }).connect(output)
  playfulSynth.volume.value = -12

  // Xylophone-like melody
  const xylophone = new Tone.Synth({
    oscillator: { type: 'sine' },
    envelope: { attack: 0.001, decay: 0.2, sustain: 0.05, release: 0.2 }
  }).connect(output)
  xylophone.volume.value = -10

  // Bouncy bass
  const bounceBass = new Tone.Synth({
    oscillator: { type: 'triangle' },
    envelope: { attack: 0.01, decay: 0.15, sustain: 0.2, release: 0.1 }
  }).connect(output)
  bounceBass.volume.value = -8

  // Sparkle arpeggios
  const sparkleSynth = new Tone.Synth({
    oscillator: { type: 'sine' },
    envelope: { attack: 0.001, decay: 0.1, sustain: 0.05, release: 0.1 }
  }).connect(output)
  sparkleSynth.volume.value = -16

  // Light percussion
  const woodblock = new Tone.MembraneSynth({
    pitchDecay: 0.01,
    octaves: 2,
    envelope: { attack: 0.001, decay: 0.1, sustain: 0, release: 0.05 }
  }).connect(output)
  woodblock.volume.value = -12

  // Shaker
  const shaker = new Tone.NoiseSynth({
    noise: { type: 'white' },
    envelope: { attack: 0.001, decay: 0.03, sustain: 0, release: 0.02 }
  }).connect(output)
  shaker.volume.value = -20

  // Playful melody - major key, skippy
  const playfulPart = new Tone.Sequence(
    (time: number, note: string | null) => {
      if (note) playfulSynth.triggerAttackRelease(note, '8n', time)
    },
    [
      'C5', 'E5', 'G5', 'E5', 'C5', 'D5', 'E5', 'G5',
      'A5', 'G5', 'E5', 'D5', 'C5', 'D5', 'E5', 'C5',
      'F5', 'A5', 'C6', 'A5', 'F5', 'G5', 'A5', 'C6',
      'G5', 'E5', 'D5', 'C5', 'D5', 'E5', 'G5', 'C6'
    ],
    '8n'
  )

  // Xylophone accents
  const xyloPart = new Tone.Sequence(
    (time: number, note: string | null) => {
      if (note) xylophone.triggerAttackRelease(note, '16n', time)
    },
    [
      'C6', null, 'G5', null, 'E6', null, 'C6', null,
      null, 'A5', null, 'F5', null, 'D6', null, 'G5',
      'F6', null, 'C6', null, 'A6', null, 'F6', null,
      null, 'E6', null, 'C6', null, 'G5', 'E6', 'C6'
    ],
    '8n'
  )

  // Bouncy bass line
  const bassPart = new Tone.Sequence(
    (time: number, note: string | null) => {
      if (note) bounceBass.triggerAttackRelease(note, '8n', time)
    },
    [
      'C3', null, 'C3', 'G3', 'C3', null, 'E3', 'G3',
      'A2', null, 'A2', 'E3', 'A2', null, 'C3', 'E3',
      'F2', null, 'F2', 'C3', 'F2', null, 'A2', 'C3',
      'G2', null, 'G2', 'D3', 'G2', null, 'B2', 'D3'
    ],
    '8n'
  )

  // Sparkle arpeggios
  const sparklePart = new Tone.Sequence(
    (time: number, note: string | null) => {
      if (note) sparkleSynth.triggerAttackRelease(note, '16n', time)
    },
    [
      'C7', 'E7', 'G7', 'E7', 'C7', null, null, null,
      null, null, 'A6', 'C7', 'E7', 'C7', 'A6', null,
      'F7', 'A7', 'C8', 'A7', 'F7', null, null, null,
      null, null, 'G6', 'B6', 'D7', 'B6', 'G6', null
    ],
    '16n'
  )

  // Woodblock rhythm
  const woodblockPart = new Tone.Sequence(
    (time: number, hit: number | null) => {
      if (hit === 1) woodblock.triggerAttackRelease('G4', '32n', time)
      else if (hit === 2) woodblock.triggerAttackRelease('C5', '32n', time)
    },
    [1, null, 2, null, 1, null, 2, 2],
    '8n'
  )

  // Shaker pattern
  const shakerPart = new Tone.Sequence(
    (time: number, hit: number | null) => {
      if (hit) shaker.triggerAttackRelease('16n', time)
    },
    [null, 1, null, 1, null, 1, null, 1],
    '8n'
  )

  return {
    start() {
      Tone.getTransport().bpm.value = 125
      playfulPart.start(0)
      xyloPart.start(0)
      bassPart.start(0)
      sparklePart.start(0)
      woodblockPart.start(0)
      shakerPart.start(0)
      Tone.getTransport().start()
    },
    stop() {
      playfulPart.stop()
      xyloPart.stop()
      bassPart.stop()
      sparklePart.stop()
      woodblockPart.stop()
      shakerPart.stop()
      Tone.getTransport().stop()
    },
    dispose() {
      playfulPart.dispose()
      xyloPart.dispose()
      bassPart.dispose()
      sparklePart.dispose()
      woodblockPart.dispose()
      shakerPart.dispose()
      playfulSynth.dispose()
      xylophone.dispose()
      bounceBass.dispose()
      sparkleSynth.dispose()
      woodblock.dispose()
      shaker.dispose()
    }
  }
}

// =============================================================================
// REACTION GAME THEME - Intense & Fast (Countdown Clash)
// High energy, adrenaline, racing against time
// =============================================================================

export function createReactionSong() {
  const engine = getAudioEngine()
  const output = engine.getMasterOutput()
  if (!output) return { start: () => {}, stop: () => {}, dispose: () => {} }

  // Intense lead - driving and urgent
  const intenseSynth = new Tone.Synth({
    oscillator: { type: 'sawtooth' },
    envelope: { attack: 0.01, decay: 0.1, sustain: 0.3, release: 0.1 }
  }).connect(output)
  intenseSynth.volume.value = -12

  // Pulsing synth
  const pulseSynth = new Tone.Synth({
    oscillator: { type: 'square' },
    envelope: { attack: 0.001, decay: 0.05, sustain: 0.2, release: 0.05 }
  }).connect(output)
  pulseSynth.volume.value = -14

  // Driving bass
  const driveBass = new Tone.Synth({
    oscillator: { type: 'sawtooth' },
    envelope: { attack: 0.01, decay: 0.1, sustain: 0.4, release: 0.1 }
  }).connect(output)
  driveBass.volume.value = -8

  // Alarm synth
  const alarmSynth = new Tone.Synth({
    oscillator: { type: 'square' },
    envelope: { attack: 0.001, decay: 0.1, sustain: 0.1, release: 0.1 }
  }).connect(output)
  alarmSynth.volume.value = -18

  // Heavy kick
  const heavyKick = new Tone.MembraneSynth({
    pitchDecay: 0.03,
    octaves: 6,
    envelope: { attack: 0.001, decay: 0.15, sustain: 0, release: 0.1 }
  }).connect(output)
  heavyKick.volume.value = -4

  // Snare
  const snare = new Tone.NoiseSynth({
    noise: { type: 'white' },
    envelope: { attack: 0.001, decay: 0.1, sustain: 0, release: 0.05 }
  }).connect(output)
  snare.volume.value = -10

  // Hi-hat - fast 16ths
  const hihat = new Tone.NoiseSynth({
    noise: { type: 'white' },
    envelope: { attack: 0.001, decay: 0.02, sustain: 0, release: 0.01 }
  }).connect(output)
  hihat.volume.value = -18

  // Intense melody - urgent, driving
  const intensePart = new Tone.Sequence(
    (time: number, note: string | null) => {
      if (note) intenseSynth.triggerAttackRelease(note, '16n', time)
    },
    [
      'E5', 'E5', 'G5', 'E5', 'A5', 'G5', 'E5', 'D5',
      'E5', 'E5', 'B5', 'A5', 'G5', 'E5', 'D5', 'E5',
      'E5', 'E5', 'G5', 'E5', 'A5', 'B5', 'C6', 'B5',
      'A5', 'G5', 'E5', 'G5', 'A5', 'G5', 'E5', 'D5'
    ],
    '16n'
  )

  // Pulsing rhythm
  const pulsePart = new Tone.Sequence(
    (time: number, note: string | null) => {
      if (note) pulseSynth.triggerAttackRelease(note, '16n', time)
    },
    [
      'E4', 'E4', 'E4', 'E4', 'E4', 'E4', 'E4', 'E4',
      'A4', 'A4', 'A4', 'A4', 'A4', 'A4', 'A4', 'A4',
      'D4', 'D4', 'D4', 'D4', 'D4', 'D4', 'D4', 'D4',
      'E4', 'E4', 'E4', 'E4', 'G4', 'G4', 'G4', 'G4'
    ],
    '16n'
  )

  // Driving bass - pumping
  const bassPart = new Tone.Sequence(
    (time: number, note: string | null) => {
      if (note) driveBass.triggerAttackRelease(note, '8n', time)
    },
    [
      'E2', 'E2', 'E3', 'E2', 'E2', 'E3', 'E2', 'E3',
      'A2', 'A2', 'A3', 'A2', 'A2', 'A3', 'A2', 'A3',
      'D2', 'D2', 'D3', 'D2', 'D2', 'D3', 'D2', 'D3',
      'E2', 'E2', 'E3', 'E2', 'G2', 'G3', 'G2', 'G3'
    ],
    '8n'
  )

  // Alarm accents
  const alarmPart = new Tone.Sequence(
    (time: number, note: string | null) => {
      if (note) alarmSynth.triggerAttackRelease(note, '32n', time)
    },
    [
      null, null, null, null, 'B6', null, null, null,
      null, null, null, null, null, null, 'E6', null,
      null, null, null, null, 'B6', null, null, null,
      null, null, 'A6', null, 'B6', null, null, null
    ],
    '16n'
  )

  // Heavy four-on-floor kick
  const kickPart = new Tone.Sequence(
    (time: number, hit: number | null) => {
      if (hit) heavyKick.triggerAttackRelease('C1', '16n', time)
    },
    [1, null, null, null, 1, null, null, null, 1, null, null, null, 1, null, null, null],
    '16n'
  )

  // Snare on 2 and 4
  const snarePart = new Tone.Sequence(
    (time: number, hit: number | null) => {
      if (hit) snare.triggerAttackRelease('8n', time)
    },
    [null, null, null, null, 1, null, null, null, null, null, null, null, 1, null, null, null],
    '16n'
  )

  // Fast hi-hats
  const hihatPart = new Tone.Sequence(
    (time: number, hit: number | null) => {
      if (hit) hihat.triggerAttackRelease('32n', time)
    },
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    '16n'
  )

  return {
    start() {
      Tone.getTransport().bpm.value = 150
      intensePart.start(0)
      pulsePart.start(0)
      bassPart.start(0)
      alarmPart.start(0)
      kickPart.start(0)
      snarePart.start(0)
      hihatPart.start(0)
      Tone.getTransport().start()
    },
    stop() {
      intensePart.stop()
      pulsePart.stop()
      bassPart.stop()
      alarmPart.stop()
      kickPart.stop()
      snarePart.stop()
      hihatPart.stop()
      Tone.getTransport().stop()
    },
    dispose() {
      intensePart.dispose()
      pulsePart.dispose()
      bassPart.dispose()
      alarmPart.dispose()
      kickPart.dispose()
      snarePart.dispose()
      hihatPart.dispose()
      intenseSynth.dispose()
      pulseSynth.dispose()
      driveBass.dispose()
      alarmSynth.dispose()
      heavyKick.dispose()
      snare.dispose()
      hihat.dispose()
    }
  }
}

// =============================================================================
// REVEAL THEME - Dramatic Tension & Resolution
// Building suspense then big reveal
// =============================================================================

export function createRevealSong() {
  const engine = getAudioEngine()
  const output = engine.getMasterOutput()
  if (!output) return { start: () => {}, stop: () => {}, dispose: () => {} }

  // Tension builder
  const tensionSynth = new Tone.Synth({
    oscillator: { type: 'sawtooth' },
    envelope: { attack: 0.5, decay: 0.3, sustain: 0.7, release: 0.5 }
  }).connect(output)
  tensionSynth.volume.value = -14

  // Dramatic stabs
  const stabSynth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'square' },
    envelope: { attack: 0.01, decay: 0.2, sustain: 0.1, release: 0.2 }
  }).connect(output)
  stabSynth.volume.value = -10

  // Resolution pad
  const resolvePad = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'sine' },
    envelope: { attack: 0.3, decay: 0.5, sustain: 0.6, release: 0.8 }
  }).connect(output)
  resolvePad.volume.value = -16

  // Timpani roll effect
  const timpani = new Tone.MembraneSynth({
    pitchDecay: 0.1,
    octaves: 3,
    envelope: { attack: 0.01, decay: 0.4, sustain: 0.2, release: 0.3 }
  }).connect(output)
  timpani.volume.value = -8

  // Building tension
  const tensionPart = new Tone.Sequence(
    (time: number, note: string | null) => {
      if (note) tensionSynth.triggerAttackRelease(note, '2n', time)
    },
    ['D3', 'D#3', 'E3', 'F3', 'F#3', 'G3', 'G#3', 'A3'],
    '4n'
  )

  // Dramatic stabs
  const stabPart = new Tone.Sequence(
    (time: number, chord: string[] | null) => {
      if (chord) stabSynth.triggerAttackRelease(chord, '8n', time)
    },
    [
      null, ['D4', 'F4', 'A4'], null, null,
      null, ['D#4', 'F#4', 'A#4'], null, null,
      null, ['E4', 'G4', 'B4'], null, null,
      ['G4', 'B4', 'D5'], null, ['G4', 'B4', 'D5'], ['A4', 'C5', 'E5']
    ],
    '8n'
  )

  // Timpani hits
  const timpaniPart = new Tone.Sequence(
    (time: number, hit: number | null) => {
      if (hit) timpani.triggerAttackRelease('D2', '4n', time)
    },
    [1, null, null, null, 1, null, 1, 1],
    '4n'
  )

  return {
    start() {
      Tone.getTransport().bpm.value = 100
      tensionPart.start(0)
      stabPart.start(0)
      timpaniPart.start(0)
      Tone.getTransport().start()
    },
    stop() {
      tensionPart.stop()
      stabPart.stop()
      timpaniPart.stop()
      Tone.getTransport().stop()
    },
    dispose() {
      tensionPart.dispose()
      stabPart.dispose()
      timpaniPart.dispose()
      tensionSynth.dispose()
      stabSynth.dispose()
      resolvePad.dispose()
      timpani.dispose()
    }
  }
}

// =============================================================================
// SCOREBOARD THEME - Victory Results
// Triumphant, celebratory ranking reveal
// =============================================================================

export function createScoreboardSong() {
  const engine = getAudioEngine()
  const output = engine.getMasterOutput()
  if (!output) return { start: () => {}, stop: () => {}, dispose: () => {} }

  // Victory fanfare synth
  const fanfareSynth = new Tone.Synth({
    oscillator: { type: 'square' },
    envelope: { attack: 0.01, decay: 0.15, sustain: 0.3, release: 0.15 }
  }).connect(output)
  fanfareSynth.volume.value = -10

  // Brass-like chords
  const brassChords = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'sawtooth' },
    envelope: { attack: 0.05, decay: 0.2, sustain: 0.4, release: 0.2 }
  }).connect(output)
  brassChords.volume.value = -12

  // Triumphant bass
  const triumphBass = new Tone.Synth({
    oscillator: { type: 'triangle' },
    envelope: { attack: 0.01, decay: 0.2, sustain: 0.4, release: 0.2 }
  }).connect(output)
  triumphBass.volume.value = -8

  // Snare roll
  const snareRoll = new Tone.NoiseSynth({
    noise: { type: 'white' },
    envelope: { attack: 0.001, decay: 0.08, sustain: 0, release: 0.05 }
  }).connect(output)
  snareRoll.volume.value = -14

  // Cymbal crash
  const cymbal = new Tone.NoiseSynth({
    noise: { type: 'white' },
    envelope: { attack: 0.001, decay: 0.8, sustain: 0.1, release: 0.5 }
  }).connect(output)
  cymbal.volume.value = -16

  // Victory fanfare melody
  const fanfarePart = new Tone.Sequence(
    (time: number, note: string | null) => {
      if (note) fanfareSynth.triggerAttackRelease(note, '8n', time)
    },
    [
      'G5', 'G5', 'G5', 'C6', null, 'G5', 'C6', null,
      'E6', null, 'D6', 'C6', 'D6', 'E6', 'C6', null,
      'G5', 'A5', 'B5', 'C6', 'D6', 'E6', 'D6', 'C6',
      'G6', null, 'E6', null, 'C6', null, null, null
    ],
    '8n'
  )

  // Brass chord stabs
  const brassPart = new Tone.Sequence(
    (time: number, chord: string[] | null) => {
      if (chord) brassChords.triggerAttackRelease(chord, '4n', time)
    },
    [
      ['C4', 'E4', 'G4'], null, null, ['C4', 'E4', 'G4'],
      null, ['F4', 'A4', 'C5'], null, null,
      ['G4', 'B4', 'D5'], null, ['G4', 'B4', 'D5'], null,
      ['C5', 'E5', 'G5'], null, null, null
    ],
    '4n'
  )

  // Bass line
  const bassPart = new Tone.Sequence(
    (time: number, note: string | null) => {
      if (note) triumphBass.triggerAttackRelease(note, '4n', time)
    },
    [
      'C2', null, 'C3', null, 'C2', null, 'G2', null,
      'F2', null, 'F3', null, 'G2', null, 'G3', null,
      'C2', null, 'E2', null, 'G2', null, 'C3', null,
      'C3', null, null, null, 'C2', null, null, null
    ],
    '8n'
  )

  // Snare roll pattern
  const snarePart = new Tone.Sequence(
    (time: number, hit: number | null) => {
      if (hit) snareRoll.triggerAttackRelease('16n', time)
    },
    [1, 1, 1, 1, null, null, null, null, 1, 1, 1, 1, null, null, 1, null],
    '16n'
  )

  return {
    start() {
      Tone.getTransport().bpm.value = 120
      fanfarePart.start(0)
      brassPart.start(0)
      bassPart.start(0)
      snarePart.start(0)
      Tone.getTransport().start()
    },
    stop() {
      fanfarePart.stop()
      brassPart.stop()
      bassPart.stop()
      snarePart.stop()
      Tone.getTransport().stop()
    },
    dispose() {
      fanfarePart.dispose()
      brassPart.dispose()
      bassPart.dispose()
      snarePart.dispose()
      fanfareSynth.dispose()
      brassChords.dispose()
      triumphBass.dispose()
      snareRoll.dispose()
      cymbal.dispose()
    }
  }
}

// =============================================================================
// FINAL RESULTS THEME - Grand Finale Celebration
// Epic winner announcement, confetti moment
// =============================================================================

export function createFinalResultsSong() {
  const engine = getAudioEngine()
  const output = engine.getMasterOutput()
  if (!output) return { start: () => {}, stop: () => {}, dispose: () => {} }

  // Epic lead
  const epicLead = new Tone.Synth({
    oscillator: { type: 'square' },
    envelope: { attack: 0.01, decay: 0.2, sustain: 0.4, release: 0.2 }
  }).connect(output)
  epicLead.volume.value = -10

  // Harmony
  const harmony = new Tone.Synth({
    oscillator: { type: 'triangle' },
    envelope: { attack: 0.02, decay: 0.2, sustain: 0.3, release: 0.2 }
  }).connect(output)
  harmony.volume.value = -14

  // Full orchestra chords
  const orchestraChords = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'sawtooth' },
    envelope: { attack: 0.1, decay: 0.3, sustain: 0.5, release: 0.3 }
  }).connect(output)
  orchestraChords.volume.value = -14

  // Deep powerful bass
  const powerBass = new Tone.Synth({
    oscillator: { type: 'sawtooth' },
    envelope: { attack: 0.01, decay: 0.3, sustain: 0.5, release: 0.2 }
  }).connect(output)
  powerBass.volume.value = -6

  // Celebration arpeggios
  const celebArp = new Tone.Synth({
    oscillator: { type: 'sine' },
    envelope: { attack: 0.001, decay: 0.1, sustain: 0.1, release: 0.1 }
  }).connect(output)
  celebArp.volume.value = -16

  // Epic drums
  const epicKick = new Tone.MembraneSynth({
    pitchDecay: 0.05,
    octaves: 5,
    envelope: { attack: 0.001, decay: 0.25, sustain: 0, release: 0.2 }
  }).connect(output)
  epicKick.volume.value = -4

  const epicSnare = new Tone.NoiseSynth({
    noise: { type: 'white' },
    envelope: { attack: 0.001, decay: 0.15, sustain: 0, release: 0.1 }
  }).connect(output)
  epicSnare.volume.value = -10

  const crashCymbal = new Tone.NoiseSynth({
    noise: { type: 'white' },
    envelope: { attack: 0.001, decay: 1.5, sustain: 0.1, release: 1 }
  }).connect(output)
  crashCymbal.volume.value = -14

  // Epic victory melody
  const epicPart = new Tone.Sequence(
    (time: number, note: string | null) => {
      if (note) epicLead.triggerAttackRelease(note, '8n', time)
    },
    [
      'C5', 'D5', 'E5', 'G5', 'C6', 'G5', 'E5', 'G5',
      'A5', 'G5', 'E5', 'D5', 'E5', 'G5', 'C6', 'D6',
      'E6', 'D6', 'C6', 'G5', 'A5', 'B5', 'C6', 'E6',
      'G6', null, 'E6', null, 'C6', null, 'G5', 'C6'
    ],
    '8n'
  )

  // Harmony line
  const harmonyPart = new Tone.Sequence(
    (time: number, note: string | null) => {
      if (note) harmony.triggerAttackRelease(note, '8n', time)
    },
    [
      'E4', 'F4', 'G4', 'B4', 'E5', 'B4', 'G4', 'B4',
      'C5', 'B4', 'G4', 'F4', 'G4', 'B4', 'E5', 'F5',
      'G5', 'F5', 'E5', 'B4', 'C5', 'D5', 'E5', 'G5',
      'B5', null, 'G5', null, 'E5', null, 'B4', 'E5'
    ],
    '8n'
  )

  // Orchestra chord progression
  const orchestraPart = new Tone.Sequence(
    (time: number, chord: string[] | null) => {
      if (chord) orchestraChords.triggerAttackRelease(chord, '2n', time)
    },
    [
      ['C4', 'E4', 'G4', 'C5'], ['C4', 'E4', 'G4', 'C5'],
      ['A3', 'C4', 'E4', 'A4'], ['A3', 'C4', 'E4', 'A4'],
      ['F3', 'A3', 'C4', 'F4'], ['G3', 'B3', 'D4', 'G4'],
      ['C4', 'E4', 'G4', 'C5'], ['C4', 'E4', 'G4', 'C5']
    ],
    '2n'
  )

  // Power bass
  const bassPart = new Tone.Sequence(
    (time: number, note: string | null) => {
      if (note) powerBass.triggerAttackRelease(note, '4n', time)
    },
    [
      'C2', 'C3', 'C2', 'G2', 'C2', 'C3', 'E2', 'G2',
      'A1', 'A2', 'A1', 'E2', 'A1', 'A2', 'C2', 'E2',
      'F1', 'F2', 'F1', 'C2', 'G1', 'G2', 'G1', 'D2',
      'C2', 'C3', 'E2', 'G2', 'C3', null, 'C2', 'C3'
    ],
    '8n'
  )

  // Celebration arpeggios
  const arpPart = new Tone.Sequence(
    (time: number, note: string | null) => {
      if (note) celebArp.triggerAttackRelease(note, '16n', time)
    },
    [
      'C6', 'E6', 'G6', 'C7', 'G6', 'E6', 'C6', 'G5',
      'A5', 'C6', 'E6', 'A6', 'E6', 'C6', 'A5', 'E5',
      'F5', 'A5', 'C6', 'F6', 'G5', 'B5', 'D6', 'G6',
      'C6', 'E6', 'G6', 'C7', 'E7', 'G6', 'C7', 'E7'
    ],
    '16n'
  )

  // Epic kick pattern
  const kickPart = new Tone.Sequence(
    (time: number, hit: number | null) => {
      if (hit) epicKick.triggerAttackRelease('C1', '8n', time)
    },
    [1, null, 1, null, 1, null, 1, 1],
    '4n'
  )

  // Snare pattern
  const snarePart = new Tone.Sequence(
    (time: number, hit: number | null) => {
      if (hit) epicSnare.triggerAttackRelease('8n', time)
    },
    [null, null, 1, null, null, null, 1, null],
    '4n'
  )

  return {
    start() {
      Tone.getTransport().bpm.value = 130
      epicPart.start(0)
      harmonyPart.start(0)
      orchestraPart.start(0)
      bassPart.start(0)
      arpPart.start(0)
      kickPart.start(0)
      snarePart.start(0)
      // Crash on start
      crashCymbal.triggerAttackRelease('4n')
      Tone.getTransport().start()
    },
    stop() {
      epicPart.stop()
      harmonyPart.stop()
      orchestraPart.stop()
      bassPart.stop()
      arpPart.stop()
      kickPart.stop()
      snarePart.stop()
      Tone.getTransport().stop()
    },
    dispose() {
      epicPart.dispose()
      harmonyPart.dispose()
      orchestraPart.dispose()
      bassPart.dispose()
      arpPart.dispose()
      kickPart.dispose()
      snarePart.dispose()
      epicLead.dispose()
      harmony.dispose()
      orchestraChords.dispose()
      powerBass.dispose()
      celebArp.dispose()
      epicKick.dispose()
      epicSnare.dispose()
      crashCymbal.dispose()
    }
  }
}
