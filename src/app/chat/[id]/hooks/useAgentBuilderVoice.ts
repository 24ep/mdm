import { useState, useEffect, useRef } from 'react'
import toast from 'react-hot-toast'
import { ChatbotConfig } from '../types'

interface UseAgentBuilderVoiceProps {
  chatbot: ChatbotConfig | null
  onTranscript: (transcript: string) => void
  onAudioChunk?: (audioData: ArrayBuffer) => void
}

export function useAgentBuilderVoice({
  chatbot,
  onTranscript,
  onAudioChunk,
}: UseAgentBuilderVoiceProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)

  useEffect(() => {
    if (chatbot?.enableVoiceAgent && chatbot?.engineType === 'openai-agent-sdk') {
      setIsVoiceEnabled(true)
    } else {
      setIsVoiceEnabled(false)
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop()
        mediaRecorderRef.current = null
      }
    }

    return () => {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop()
        mediaRecorderRef.current = null
      }
      if (audioContextRef.current) {
        audioContextRef.current.close()
        audioContextRef.current = null
      }
    }
  }, [chatbot?.enableVoiceAgent, chatbot?.voiceProvider, chatbot?.engineType])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      })
      
      const chunks: Blob[] = []
      
      mediaRecorder.ondataavailable = async (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data)
          
          // Send audio to Agent Builder API
          try {
            const formData = new FormData()
            formData.append('audio', event.data, 'audio.webm')
            formData.append('engineId', (chatbot as any)?.selectedEngineId || '')
            
            const response = await fetch('/api/agentbuilder/voice', {
              method: 'POST',
              body: formData,
            })
            
            if (response.ok) {
              const result = await response.json()
              if (result.transcript) {
                onTranscript(result.transcript)
              }
              if (result.audio && onAudioChunk) {
                // Convert base64 audio to ArrayBuffer
                const audioData = Uint8Array.from(atob(result.audio), c => c.charCodeAt(0))
                onAudioChunk(audioData.buffer)
                setIsSpeaking(true)
              }
            }
          } catch (error) {
            console.error('Error sending audio to Agent Builder:', error)
            toast.error('Failed to process voice input')
          }
        }
      }
      
      mediaRecorder.onstop = () => {
        setIsRecording(false)
      }
      
      mediaRecorder.start(1000) // Send chunks every second
      mediaRecorderRef.current = mediaRecorder
      setIsRecording(true)
      toast.success('Recording started')
    } catch (error) {
      console.error('Error starting recording:', error)
      toast.error('Failed to start recording')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop())
    }
    setIsRecording(false)
  }

  const playAudioChunk = async (audioData: ArrayBuffer) => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      }
      
      const audioBuffer = await audioContextRef.current.decodeAudioData(audioData)
      const source = audioContextRef.current.createBufferSource()
      source.buffer = audioBuffer
      source.connect(audioContextRef.current.destination)
      source.onended = () => setIsSpeaking(false)
      source.start()
      
      setIsSpeaking(true)
    } catch (error) {
      console.error('Error playing audio:', error)
      setIsSpeaking(false)
    }
  }

  return {
    isRecording,
    isVoiceEnabled,
    isSpeaking,
    startRecording,
    stopRecording,
    playAudioChunk,
  }
}

