// Sound effects, synthesised in the browser so the game makes noise before real
// recordings exist. Every cue is drawn onto any audio context, so the same code plays
// live and renders offline (the ?preview=sounds page uses that to let you hear them).
import { loadMuted, loadVolume, saveMuted, saveVolume } from './storage'

export type Cue =
  | 'card' | 'coin' | 'stamp' | 'fire' | 'hit' | 'win' | 'lose' | 'click' | 'ink'
  | 'whistle' | 'register' | 'straw' | 'prospect' | 'well' | 'sell' | 'ticker' | 'shuffle'

export const CUES: { cue: Cue; label: string }[] = [
  { cue: 'whistle', label: 'Steam whistle (start of a run)' },
  { cue: 'register', label: 'Cash register (round won)' },
  { cue: 'straw', label: 'Last of the drink (bankrupt)' },
  { cue: 'prospect', label: 'Prospect' },
  { cue: 'well', label: 'Well built' },
  { cue: 'sell', label: 'Oil sold' },
  { cue: 'ticker', label: 'Ticker tape (enemy turn)' },
  { cue: 'shuffle', label: 'Deck reshuffled' },
  { cue: 'card', label: 'Card played' },
  { cue: 'coin', label: 'Coin' },
  { cue: 'fire', label: 'Fire' },
  { cue: 'hit', label: 'Money lost' },
  { cue: 'stamp', label: 'Stamp' },
  { cue: 'win', label: 'Stage complete' },
  { cue: 'click', label: 'Click' },
]

let ctx: AudioContext | null = null
let master: GainNode | null = null // every sound goes through this, so one slider sets the volume
let muted = loadMuted()
let volume = loadVolume()

export const isMuted = () => muted
export function setMuted(m: boolean) { muted = m; saveMuted(m) }
export const getVolume = () => volume
export function setVolume(v: number) {
  volume = Math.min(1, Math.max(0, v)); saveVolume(volume)
  if (master) master.gain.value = volume
}

function live(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!ctx) {
    const C = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!C) return null
    ctx = new C()
    master = ctx.createGain(); master.gain.value = volume; master.connect(ctx.destination)
  }
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

// ------------------------------------------------------------- building blocks
type Ctx = BaseAudioContext
const rnd = (a: number, b: number) => a + Math.random() * (b - a)

/** A plain oscillator note with an exponential fade. */
function tone(a: Ctx, out: AudioNode, at: number, freq: number, dur: number, type: OscillatorType = 'sine', gain = 0.15, slide = 0) {
  const o = a.createOscillator(); const g = a.createGain()
  o.type = type; o.frequency.setValueAtTime(freq, at)
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), at + dur)
  g.gain.setValueAtTime(0.0001, at); g.gain.exponentialRampToValueAtTime(gain, at + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, at + dur)
  o.connect(g).connect(out); o.start(at); o.stop(at + dur + 0.02)
}

let noiseBuf: AudioBuffer | null = null
function noiseSource(a: Ctx): AudioBufferSourceNode {
  if (!noiseBuf || noiseBuf.sampleRate !== a.sampleRate) {
    noiseBuf = a.createBuffer(1, a.sampleRate * 2, a.sampleRate)
    const d = noiseBuf.getChannelData(0)
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
  }
  const s = a.createBufferSource(); s.buffer = noiseBuf; s.loop = true
  return s
}

/** Filtered noise with an attack and a fade. */
function noise(a: Ctx, out: AudioNode, at: number, dur: number, gain = 0.12, freq = 1200, q = 1, type: BiquadFilterType = 'bandpass', attack = 0.003) {
  const s = noiseSource(a); const f = a.createBiquadFilter(); const g = a.createGain()
  f.type = type; f.frequency.value = freq; f.Q.value = q
  g.gain.setValueAtTime(0.0001, at); g.gain.exponentialRampToValueAtTime(gain, at + attack); g.gain.exponentialRampToValueAtTime(0.0001, at + dur)
  s.connect(f).connect(g).connect(out); s.start(at, Math.random()); s.stop(at + dur + 0.02)
}

/** A struck metal object: inharmonic partials that ring and fade (bells, coins, steel). */
function metal(a: Ctx, out: AudioNode, at: number, freq: number, ring: number, gain: number, ratios = [1, 2.76, 5.4, 8.93]) {
  ratios.forEach((r, i) => tone(a, out, at, freq * r, ring / (1 + i * 0.8), 'sine', gain / (1 + i * 1.3)))
}

/** A low, soft thud (a body hitting wood or earth). */
const thud = (a: Ctx, out: AudioNode, at: number, freq = 90, gain = 0.3, dur = 0.18) => tone(a, out, at, freq, dur, 'sine', gain, -freq * 0.45)

// ---------------------------------------------------------------- the cues
function steamWhistle(a: Ctx, out: AudioNode, t: number) {
  // A three-chime whistle: two blasts, a short toot then a long one. Steam builds,
  // so each blast slides up to pitch and swells; breathy hiss rides on top.
  const chord = [370, 466, 554]
  const blast = (start: number, dur: number) => {
    const bus = a.createGain(); bus.gain.value = 1
    const lp = a.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2600
    bus.connect(lp).connect(out)
    const vib = a.createOscillator(); const vibAmt = a.createGain()
    vib.frequency.value = 5.2; vibAmt.gain.value = 2.2; vib.connect(vibAmt)
    vib.start(start); vib.stop(start + dur + 0.6)
    chord.forEach((f, i) => {
      for (const [type, level] of [['sawtooth', 0.05], ['triangle', 0.08]] as const) {
        const o = a.createOscillator(); const g = a.createGain()
        o.type = type
        o.frequency.setValueAtTime(f * 0.93, start)
        o.frequency.exponentialRampToValueAtTime(f * (1 + i * 0.002), start + 0.16)
        o.frequency.setValueAtTime(f * (1 + i * 0.002), start + dur - 0.05)
        o.frequency.exponentialRampToValueAtTime(f * 0.96, start + dur + 0.35)
        vibAmt.connect(o.frequency)
        g.gain.setValueAtTime(0.0001, start)
        g.gain.exponentialRampToValueAtTime(level, start + 0.12)
        g.gain.setValueAtTime(level, start + dur)
        g.gain.exponentialRampToValueAtTime(0.0001, start + dur + 0.4)
        o.connect(g).connect(bus); o.start(start); o.stop(start + dur + 0.45)
      }
      // steam blowing across each pipe
      noise(a, bus, start, dur + 0.35, 0.035, f * 2, 12, 'bandpass', 0.1)
    })
    noise(a, out, start, dur + 0.4, 0.016, 4500, 0.7, 'highpass', 0.05) // hiss
  }
  noise(a, out, t, 0.12, 0.05, 3000, 0.5, 'highpass', 0.04) // valve opening
  blast(t + 0.05, 0.32)
  blast(t + 0.62, 1.35)
}

function cashRegister(a: Ctx, out: AudioNode, t: number) {
  // "che": keys, the drawer catch and the drawer sliding out with coins rattling
  noise(a, out, t, 0.02, 0.25, 3200, 3)
  noise(a, out, t + 0.06, 0.02, 0.25, 2800, 3)
  noise(a, out, t + 0.12, 0.06, 0.35, 1600, 2)
  thud(a, out, t + 0.12, 140, 0.25, 0.12)
  const slide = noiseSource(a); const f = a.createBiquadFilter(); const g = a.createGain()
  f.type = 'bandpass'; f.Q.value = 1.4
  f.frequency.setValueAtTime(700, t + 0.14); f.frequency.exponentialRampToValueAtTime(2200, t + 0.42)
  g.gain.setValueAtTime(0.0001, t + 0.14); g.gain.exponentialRampToValueAtTime(0.14, t + 0.2); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.45)
  slide.connect(f).connect(g).connect(out); slide.start(t + 0.14); slide.stop(t + 0.5)
  for (let i = 0; i < 6; i++) metal(a, out, t + rnd(0.18, 0.42), rnd(3800, 5200), 0.06, 0.03, [1, 1.6])
  thud(a, out, t + 0.44, 110, 0.35, 0.14) // drawer hits its stop
  // "ching": the bell
  metal(a, out, t + 0.2, 2093, 1.4, 0.24, [1, 2.0, 2.76, 4.07, 5.4])
  metal(a, out, t + 0.215, 2637, 1.1, 0.12, [1, 2.76])
}

function strawSlurp(a: Ctx, out: AudioNode, t: number) {
  // The bottom of the glass: wet, gurgling slurps that thin out, then the dry
  // rattle of air through an empty straw.
  let at = t
  for (let i = 0; i < 14; i++) {
    const dur = rnd(0.03, 0.06) + (i < 7 ? 0.02 : 0)
    const f = rnd(500, 900) + i * 60
    const s = noiseSource(a); const bp = a.createBiquadFilter(); const g = a.createGain()
    bp.type = 'bandpass'; bp.Q.value = 7
    bp.frequency.setValueAtTime(f, at); bp.frequency.exponentialRampToValueAtTime(f * rnd(1.6, 2.4), at + dur)
    g.gain.setValueAtTime(0.0001, at); g.gain.exponentialRampToValueAtTime(rnd(0.7, 1.1) * (1 - i / 20), at + 0.006); g.gain.exponentialRampToValueAtTime(0.0001, at + dur)
    s.connect(bp).connect(g).connect(out); s.start(at, Math.random()); s.stop(at + dur + 0.02)
    tone(a, out, at, rnd(180, 320), dur * 0.8, 'sine', 0.16, rnd(60, 160)) // bubble pop
    at += dur + rnd(0.01, 0.035) + i * 0.004
  }
  // the empty straw: rough, fluttering air
  const end = at + 0.05
  const air = noiseSource(a); const bp = a.createBiquadFilter(); const g = a.createGain(); const flutter = a.createOscillator(); const depth = a.createGain()
  bp.type = 'bandpass'; bp.Q.value = 2.5; bp.frequency.setValueAtTime(1500, end); bp.frequency.linearRampToValueAtTime(1100, end + 0.7)
  flutter.frequency.value = 34; depth.gain.value = 0.18; flutter.connect(depth).connect(g.gain)
  g.gain.setValueAtTime(0.0001, end); g.gain.exponentialRampToValueAtTime(0.28, end + 0.08); g.gain.setValueAtTime(0.28, end + 0.45); g.gain.exponentialRampToValueAtTime(0.0001, end + 0.75)
  air.connect(bp).connect(g).connect(out); air.start(end); air.stop(end + 0.8); flutter.start(end); flutter.stop(end + 0.8)
  for (let i = 0; i < 3; i++) noise(a, out, end + 0.55 + i * 0.09, 0.04, 0.25, 900, 6) // last sputters
}

function prospect(a: Ctx, out: AudioNode, t: number) {
  // two shovel bites into gravel, then a claim stake knocked in
  for (const at of [t, t + 0.28]) {
    metal(a, out, at, 1650, 0.12, 0.08, [1, 2.3])
    noise(a, out, at, 0.22, 0.3, 700, 0.8, 'lowpass')
    for (let i = 0; i < 5; i++) noise(a, out, at + rnd(0.04, 0.2), 0.03, 0.08, rnd(1800, 3200), 4)
    thud(a, out, at, 80, 0.25)
  }
  for (const [k, at] of [[0, t + 0.62], [1, t + 0.78]] as const) {
    tone(a, out, at, k ? 260 : 230, 0.12, 'triangle', 0.22, -70)
    noise(a, out, at, 0.05, 0.18, 1100, 3)
  }
}

function wellBuilt(a: Ctx, out: AudioNode, t: number) {
  // the derrick goes up with a clank, the engine chugs, then oil glugs up the pipe
  metal(a, out, t, 620, 0.5, 0.12, [1, 2.35, 3.9])
  noise(a, out, t, 0.06, 0.2, 2400, 2)
  let at = t + 0.18
  for (let i = 0; i < 5; i++) {
    thud(a, out, at, 70, 0.32, 0.12)
    noise(a, out, at, 0.1, 0.14, 420, 1.5)
    noise(a, out, at + 0.04, 0.08, 0.05, 5000, 0.7, 'highpass') // steam
    at += 0.17 - i * 0.02
  }
  for (let i = 0; i < 3; i++) {
    const g0 = at + 0.05 + i * 0.11
    tone(a, out, g0, 340 - i * 40, 0.1, 'sine', 0.2, -170)
    noise(a, out, g0, 0.08, 0.06, 500, 5)
  }
}

function sellOil(a: Ctx, out: AudioNode, t: number) {
  // coins poured onto the counter, settling at the end
  for (let i = 0; i < 12; i++) {
    const at = t + Math.pow(i / 12, 1.4) * 0.55 + rnd(0, 0.025)
    metal(a, out, at, rnd(3600, 5600), rnd(0.08, 0.18), 0.2 * (1 - i / 18), [1, 1.48, 2.1])
  }
  metal(a, out, t + 0.62, 4200, 0.35, 0.18, [1, 1.48])
  thud(a, out, t + 0.58, 180, 0.25, 0.08)
}

function ticker(a: Ctx, out: AudioNode, t: number) {
  // a stock ticker printing: quick uneven clacks of the type wheel
  for (let i = 0; i < 7; i++) {
    const at = t + i * 0.045 + rnd(0, 0.012)
    noise(a, out, at, 0.018, 0.16, rnd(2600, 3600), 6)
    tone(a, out, at, rnd(1700, 2100), 0.012, 'square', 0.025)
  }
}

function riffle(a: Ctx, out: AudioNode, t: number) {
  // two half-decks riffled together, then squared up with a tap
  for (let i = 0; i < 22; i++) {
    const at = t + 0.05 + i * 0.026 + rnd(0, 0.006)
    noise(a, out, at, 0.022, 0.12 + 0.05 * Math.sin(i / 3), rnd(3800, 5200), 3)
  }
  noise(a, out, t + 0.68, 0.06, 0.22, 900, 1.2)
  thud(a, out, t + 0.7, 160, 0.16, 0.08)
}

/** Draws a cue onto any audio context, starting at time `t`. */
export function renderCue(cue: Cue, a: Ctx, out: AudioNode, t: number) {
  switch (cue) {
    case 'card': noise(a, out, t, 0.08, 0.08, 2400); break
    case 'click': tone(a, out, t, 660, 0.05, 'square', 0.04); break
    case 'ink': noise(a, out, t, 0.12, 0.05, 3500); break
    case 'coin': tone(a, out, t, 1320, 0.08, 'triangle', 0.12); tone(a, out, t + 0.06, 1760, 0.18, 'triangle', 0.1); break
    case 'stamp': noise(a, out, t, 0.18, 0.35, 180); tone(a, out, t, 70, 0.25, 'sine', 0.3, -30); break
    case 'fire': noise(a, out, t, 0.5, 0.12, 700); noise(a, out, t + 0.15, 0.35, 0.08, 1800); break
    case 'hit': tone(a, out, t, 180, 0.15, 'sawtooth', 0.12, -90); noise(a, out, t, 0.1, 0.15, 500); break
    case 'win': [523, 659, 784, 1047].forEach((f, i) => tone(a, out, t + i * 0.12, f, 0.35, 'triangle', 0.1)); break
    case 'lose': case 'straw': strawSlurp(a, out, t); break
    case 'whistle': steamWhistle(a, out, t); break
    case 'register': cashRegister(a, out, t); break
    case 'prospect': prospect(a, out, t); break
    case 'well': wellBuilt(a, out, t); break
    case 'sell': sellOil(a, out, t); break
    case 'ticker': ticker(a, out, t); break
    case 'shuffle': riffle(a, out, t); break
  }
}

export function play(cue: Cue) {
  if (muted || volume === 0) return
  const a = live(); if (!a || !master) return
  renderCue(cue, a, master, a.currentTime + 0.01)
}

/** Renders a cue to a buffer without playing it (for previews and checks). */
export async function renderOffline(cue: Cue, seconds = 3): Promise<AudioBuffer> {
  const a = new OfflineAudioContext(1, 44100 * seconds, 44100)
  renderCue(cue, a, a.destination, 0)
  return a.startRendering()
}
