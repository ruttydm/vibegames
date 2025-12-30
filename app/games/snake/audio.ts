import { Tone, getAudioEngine } from '~/audio/engine'

// =============================================================================
// Snake Sound Effects
// =============================================================================

export function playSnakeEat(): void {
  const engine = getAudioEngine()
  const output = engine.getMasterOutput()
  if (!output || !engine.isInitialized()) return

  // Rising arpeggio for eating food
  const synth = new Tone.Synth({
    oscillator: { type: 'square' },
    envelope: { attack: 0.001, decay: 0.08, sustain: 0.05, release: 0.02 }
  }).connect(output)

  const now = Tone.now()
  synth.triggerAttackRelease('C5', '32n', now)
  synth.triggerAttackRelease('E5', '32n', now + 0.05)
  synth.triggerAttackRelease('G5', '32n', now + 0.1)

  setTimeout(() => synth.dispose(), 300)
}

export function playSnakeDie(): void {
  const engine = getAudioEngine()
  const output = engine.getMasterOutput()
  if (!output || !engine.isInitialized()) return

  // Descending noise sweep for death
  const noise = new Tone.NoiseSynth({
    noise: { type: 'white' },
    envelope: { attack: 0.01, decay: 0.3, sustain: 0, release: 0.1 }
  }).connect(output)

  // Also add a descending tone
  const synth = new Tone.Synth({
    oscillator: { type: 'sawtooth' },
    envelope: { attack: 0.01, decay: 0.3, sustain: 0, release: 0.1 }
  }).connect(output)

  noise.triggerAttack()

  // Pitch bend down
  const now = Tone.now()
  synth.triggerAttackRelease('C4', '8n', now)
  synth.triggerAttackRelease('G3', '8n', now + 0.1)
  synth.triggerAttackRelease('C3', '8n', now + 0.2)

  setTimeout(() => {
    noise.dispose()
    synth.dispose()
  }, 500)
}

export function playSnakeTurn(): void {
  const engine = getAudioEngine()
  const output = engine.getMasterOutput()
  if (!output || !engine.isInitialized()) return

  const synth = new Tone.Synth({
    oscillator: { type: 'triangle' },
    envelope: { attack: 0.001, decay: 0.02, sustain: 0, release: 0.01 }
  }).connect(output)

  synth.triggerAttackRelease('G4', '64n')

  setTimeout(() => synth.dispose(), 50)
}

export function playSnakeSpeedup(): void {
  const engine = getAudioEngine()
  const output = engine.getMasterOutput()
  if (!output || !engine.isInitialized()) return

  // Rising pitch sweep
  const synth = new Tone.Synth({
    oscillator: { type: 'square' },
    envelope: { attack: 0.01, decay: 0.1, sustain: 0, release: 0.01 }
  }).connect(output)

  const now = Tone.now()
  synth.triggerAttackRelease('C4', '32n', now)
  synth.triggerAttackRelease('E4', '32n', now + 0.03)
  synth.triggerAttackRelease('G4', '32n', now + 0.06)
  synth.triggerAttackRelease('C5', '32n', now + 0.09)

  setTimeout(() => synth.dispose(), 200)
}

// =============================================================================
// Snake Theme Song
// =============================================================================

const BPM = 130

const melodyNotes = [
  // Bar 1
  { note: 'E5', time: '0:0:0', duration: '8n' },
  { note: 'G5', time: '0:0:2', duration: '8n' },
  { note: 'A5', time: '0:1:0', duration: '8n' },
  { note: 'G5', time: '0:1:2', duration: '8n' },
  { note: 'E5', time: '0:2:0', duration: '4n' },
  { note: 'D5', time: '0:3:0', duration: '8n' },
  { note: 'E5', time: '0:3:2', duration: '8n' },
  // Bar 2
  { note: 'G5', time: '1:0:0', duration: '8n' },
  { note: 'A5', time: '1:0:2', duration: '8n' },
  { note: 'B5', time: '1:1:0', duration: '8n' },
  { note: 'A5', time: '1:1:2', duration: '8n' },
  { note: 'G5', time: '1:2:0', duration: '4n' },
  { note: 'E5', time: '1:3:0', duration: '4n' },
  // Bar 3
  { note: 'A5', time: '2:0:0', duration: '8n' },
  { note: 'B5', time: '2:0:2', duration: '8n' },
  { note: 'C6', time: '2:1:0', duration: '8n' },
  { note: 'B5', time: '2:1:2', duration: '8n' },
  { note: 'A5', time: '2:2:0', duration: '8n' },
  { note: 'G5', time: '2:2:2', duration: '8n' },
  { note: 'E5', time: '2:3:0', duration: '8n' },
  { note: 'D5', time: '2:3:2', duration: '8n' },
  // Bar 4
  { note: 'E5', time: '3:0:0', duration: '4n' },
  { note: 'G5', time: '3:1:0', duration: '4n' },
  { note: 'A5', time: '3:2:0', duration: '4n' },
  { note: 'E5', time: '3:3:0', duration: '4n' }
]

const bassNotes = [
  // Bar 1
  { note: 'E2', time: '0:0:0', duration: '4n' },
  { note: 'E2', time: '0:1:0', duration: '4n' },
  { note: 'A2', time: '0:2:0', duration: '4n' },
  { note: 'B2', time: '0:3:0', duration: '4n' },
  // Bar 2
  { note: 'C3', time: '1:0:0', duration: '4n' },
  { note: 'C3', time: '1:1:0', duration: '4n' },
  { note: 'G2', time: '1:2:0', duration: '4n' },
  { note: 'E2', time: '1:3:0', duration: '4n' },
  // Bar 3
  { note: 'A2', time: '2:0:0', duration: '4n' },
  { note: 'A2', time: '2:1:0', duration: '4n' },
  { note: 'E2', time: '2:2:0', duration: '4n' },
  { note: 'G2', time: '2:3:0', duration: '4n' },
  // Bar 4
  { note: 'E2', time: '3:0:0', duration: '4n' },
  { note: 'G2', time: '3:1:0', duration: '4n' },
  { note: 'A2', time: '3:2:0', duration: '4n' },
  { note: 'B2', time: '3:3:0', duration: '4n' }
]

const drumPattern = [
  // Bar 1
  { type: 'kick', time: '0:0:0' },
  { type: 'snare', time: '0:1:0' },
  { type: 'kick', time: '0:2:0' },
  { type: 'snare', time: '0:3:0' },
  // Bar 2
  { type: 'kick', time: '1:0:0' },
  { type: 'snare', time: '1:1:0' },
  { type: 'kick', time: '1:2:0' },
  { type: 'snare', time: '1:3:0' },
  // Bar 3
  { type: 'kick', time: '2:0:0' },
  { type: 'snare', time: '2:1:0' },
  { type: 'kick', time: '2:2:0' },
  { type: 'snare', time: '2:3:0' },
  // Bar 4
  { type: 'kick', time: '3:0:0' },
  { type: 'snare', time: '3:1:0' },
  { type: 'kick', time: '3:2:0' },
  { type: 'snare', time: '3:3:0' }
]

export function createSnakeSong() {
  const engine = getAudioEngine()
  const output = engine.getMasterOutput()

  if (!output) {
    return {
      start: () => {},
      stop: () => {},
      dispose: () => {}
    }
  }

  // Create synths
  const melodySynth = new Tone.Synth({
    oscillator: { type: 'square' },
    envelope: { attack: 0.01, decay: 0.1, sustain: 0.3, release: 0.1 }
  }).connect(output)
  melodySynth.volume.value = -6

  const bassSynth = new Tone.Synth({
    oscillator: { type: 'triangle' },
    envelope: { attack: 0.01, decay: 0.1, sustain: 0.5, release: 0.1 }
  }).connect(output)
  bassSynth.volume.value = -8

  // Drum synths
  const kickSynth = new Tone.MembraneSynth({
    pitchDecay: 0.05,
    octaves: 4,
    envelope: { attack: 0.001, decay: 0.2, sustain: 0, release: 0.1 }
  }).connect(output)
  kickSynth.volume.value = -10

  const snareSynth = new Tone.NoiseSynth({
    noise: { type: 'white' },
    envelope: { attack: 0.001, decay: 0.1, sustain: 0, release: 0.05 }
  }).connect(output)
  snareSynth.volume.value = -14

  // Create sequences
  const melodyPart = new Tone.Part((time, event) => {
    melodySynth.triggerAttackRelease(event.note, event.duration, time)
  }, melodyNotes.map(n => [n.time, n]))
  melodyPart.loop = true
  melodyPart.loopEnd = '4:0:0'

  const bassPart = new Tone.Part((time, event) => {
    bassSynth.triggerAttackRelease(event.note, event.duration, time)
  }, bassNotes.map(n => [n.time, n]))
  bassPart.loop = true
  bassPart.loopEnd = '4:0:0'

  const drumPart = new Tone.Part((time, event) => {
    if (event.type === 'kick') {
      kickSynth.triggerAttackRelease('C1', '8n', time)
    } else {
      snareSynth.triggerAttackRelease('8n', time)
    }
  }, drumPattern.map(d => [d.time, d]))
  drumPart.loop = true
  drumPart.loopEnd = '4:0:0'

  let isPlaying = false

  return {
    start: () => {
      if (isPlaying) return
      isPlaying = true

      Tone.getTransport().bpm.value = BPM
      melodyPart.start(0)
      bassPart.start(0)
      drumPart.start(0)
      Tone.getTransport().start()
    },

    stop: () => {
      if (!isPlaying) return
      isPlaying = false

      Tone.getTransport().stop()
      Tone.getTransport().position = 0
      melodyPart.stop()
      bassPart.stop()
      drumPart.stop()
    },

    dispose: () => {
      melodyPart.dispose()
      bassPart.dispose()
      drumPart.dispose()
      melodySynth.dispose()
      bassSynth.dispose()
      kickSynth.dispose()
      snareSynth.dispose()
    }
  }
}
