import { ref } from 'vue'

export function useVoice(sendMessage) {
  const isRecording = ref(false)
  const mediaRecorder = ref(null)
  const audioChunks = ref([])
  const voiceQueue = ref([])
  const isPlaying = ref(false)

  const startRecording = async () => {
    console.log('Attempting to start recording...')
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      const errorMsg =
        'Microphone access is only available in secure contexts (HTTPS or localhost).'
      console.error(errorMsg)
      alert(errorMsg)
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      console.log('Microphone stream acquired.')
      const options = { mimeType: 'audio/webm;codecs=opus' }
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options.mimeType = 'audio/webm'
      }

      mediaRecorder.value = new MediaRecorder(stream, options)
      audioChunks.value = []

      mediaRecorder.value.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunks.value.push(event.data)
      }

      mediaRecorder.value.onstop = async () => {
        const audioBlob = new Blob(audioChunks.value, {
          type: options.mimeType,
        })
        const reader = new FileReader()
        reader.readAsDataURL(audioBlob)
        reader.onloadend = () => {
          if (sendMessage) {
            sendMessage({
              action: 'voiceMessage',
              audioData: reader.result,
            })
          }
        }
        stream.getTracks().forEach((track) => track.stop())
      }

      mediaRecorder.value.start()
      isRecording.value = true

      setTimeout(() => {
        if (isRecording.value) stopRecording()
      }, 15000)
    } catch (err) {
      console.error('Error accessing microphone:', err)
    }
  }

  const stopRecording = () => {
    if (mediaRecorder.value && isRecording.value) {
      mediaRecorder.value.stop()
      isRecording.value = false
    }
  }

  const playNextInQueue = async () => {
    if (voiceQueue.value.length === 0 || isPlaying.value) return
    isPlaying.value = true
    const audioData = voiceQueue.value.shift()
    try {
      const audio = new Audio(audioData)
      audio.onended = () => {
        isPlaying.value = false
        playNextInQueue()
      }
      await audio.play()
    } catch (err) {
      console.error('Error playing audio:', err)
      isPlaying.value = false
      playNextInQueue()
    }
  }

  const addToQueue = (audioData) => {
    voiceQueue.value.push(audioData)
    playNextInQueue()
  }

  return {
    isRecording,
    startRecording,
    stopRecording,
    addToQueue,
  }
}
