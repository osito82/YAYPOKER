import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useSoundStore = defineStore('sound', () => {
  const isMuted = ref(false)
  let audioContext = null

  const initAudio = () => {
    if (!audioContext) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext
      if (!AudioCtx) {
        console.warn('AudioContext is not supported in this environment.')
        return
      }
      audioContext = new AudioCtx()
    }
    if (audioContext && audioContext.state === 'suspended') {
      audioContext.resume()
    }
  }

  const toggleMute = () => {
    isMuted.value = !isMuted.value
    if (!isMuted.value) initAudio()
  }

  // Helper to play synthesized sounds
  const playTone = (
    frequency,
    type = 'sine',
    duration = 0.1,
    vol = 0.1,
    slideTo = null,
  ) => {
    if (isMuted.value) return
    initAudio()
    if (!audioContext) return

    const osc = audioContext.createOscillator()
    const gain = audioContext.createGain()

    osc.type = type
    osc.connect(gain)
    gain.connect(audioContext.destination)

    const now = audioContext.currentTime
    osc.frequency.setValueAtTime(frequency, now)
    if (slideTo) {
      osc.frequency.exponentialRampToValueAtTime(slideTo, now + duration)
    }

    gain.gain.setValueAtTime(vol, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration)

    osc.start(now)
    osc.stop(now + duration)
  }

  const playNoise = (duration = 0.1, vol = 0.1) => {
    if (isMuted.value) return
    initAudio()
    if (!audioContext) return

    const bufferSize = audioContext.sampleRate * duration
    const buffer = audioContext.createBuffer(
      1,
      bufferSize,
      audioContext.sampleRate,
    )
    const data = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1
    }

    const noise = audioContext.createBufferSource()
    noise.buffer = buffer

    const filter = audioContext.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 1000

    const gain = audioContext.createGain()
    gain.gain.setValueAtTime(vol, audioContext.currentTime)
    gain.gain.exponentialRampToValueAtTime(
      0.001,
      audioContext.currentTime + duration,
    )

    noise.connect(filter)
    filter.connect(gain)
    gain.connect(audioContext.destination)
    noise.start()
  }

  // --- Game specific sounds ---

  const playBet = () => {
    // High-pitched click/clink (like a chip)
    playTone(1200, 'sine', 0.05, 0.3)
    setTimeout(() => playTone(1500, 'sine', 0.08, 0.2), 30)
  }

  const playCheck = () => {
    // Two dull taps
    playTone(300, 'square', 0.05, 0.1)
    setTimeout(() => playTone(300, 'square', 0.05, 0.1), 100)
  }

  const playFold = () => {
    // Sliding card sound (low noise)
    playNoise(0.2, 0.3)
  }

  const playDeal = () => {
    // Quick snap
    playTone(800, 'triangle', 0.05, 0.1)
  }

  const playYourTurn = () => {
    // Notification chime
    playTone(600, 'sine', 0.1, 0.2)
    setTimeout(() => playTone(800, 'sine', 0.3, 0.2), 100)
  }

  const playWin = () => {
    // Triumphant arpeggio
    if (!audioContext || isMuted.value) return
    const notes = [440, 554.37, 659.25, 880] // A4, C#5, E5, A5
    notes.forEach((freq, i) => {
      setTimeout(() => playTone(freq, 'sine', 0.4, 0.2), i * 150)
    })
  }

  return {
    isMuted,
    initAudio,
    toggleMute,
    playBet,
    playCheck,
    playFold,
    playDeal,
    playYourTurn,
    playWin,
  }
})
