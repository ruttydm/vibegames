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
