// Placeholder sound effects, synthesised in the browser so the game makes noise
// before real recordings exist. Swap each cue for a file later (e.g. Howler.js).
import { loadMuted, saveMuted } from './storage'

export type Cue = 'card' | 'coin' | 'stamp' | 'fire' | 'hit' | 'win' | 'lose' | 'click' | 'ink'

let ctx: AudioContext | null = null
let muted = loadMuted()

export const isMuted = () => muted
export function setMuted(m: boolean) { muted = m; saveMuted(m) }

function ac(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!ctx) {
    const C = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!C) return null
    ctx = new C()
  }
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

function tone(freq: number, dur: number, type: OscillatorType = 'sine', gain = 0.15, slide = 0, delay = 0) {
  const a = ac(); if (!a) return
  const t = a.currentTime + delay
  const o = a.createOscillator(); const g = a.createGain()
  o.type = type; o.frequency.setValueAtTime(freq, t)
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t + dur)
  g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  o.connect(g).connect(a.destination); o.start(t); o.stop(t + dur + 0.02)
}

function noise(dur: number, gain = 0.12, freq = 1200, delay = 0) {
  const a = ac(); if (!a) return
  const t = a.currentTime + delay
  const buf = a.createBuffer(1, Math.floor(a.sampleRate * dur), a.sampleRate)
  const d = buf.getChannelData(0)
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length)
  const src = a.createBufferSource(); src.buffer = buf
  const f = a.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq
  const g = a.createGain(); g.gain.value = gain
  src.connect(f).connect(g).connect(a.destination); src.start(t)
}

export function play(cue: Cue) {
  if (muted) return
  switch (cue) {
    case 'card': noise(0.08, 0.08, 2400); break
    case 'click': tone(660, 0.05, 'square', 0.04); break
    case 'ink': noise(0.12, 0.05, 3500); break
    case 'coin': tone(1320, 0.08, 'triangle', 0.12); tone(1760, 0.18, 'triangle', 0.1, 0, 0.06); break
    case 'stamp': noise(0.18, 0.35, 180); tone(70, 0.25, 'sine', 0.3, -30); break
    case 'fire': noise(0.5, 0.12, 700); noise(0.35, 0.08, 1800, 0.15); break
    case 'hit': tone(180, 0.15, 'sawtooth', 0.12, -90); noise(0.1, 0.15, 500); break
    case 'win': [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.35, 'triangle', 0.1, 0, i * 0.12)); break
    case 'lose': [392, 330, 262, 196].forEach((f, i) => tone(f, 0.45, 'sine', 0.12, 0, i * 0.18)); break
  }
}
