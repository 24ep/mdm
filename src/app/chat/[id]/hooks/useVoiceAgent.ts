import { useState, useEffect, useRef } from 'react'
import toast from 'react-hot-toast'
import { ChatbotConfig } from '../types'

export function useVoiceAgent(
  chatbot: ChatbotConfig | null,
  onTranscript: (transcript: string) => void
) {
  const [isRecording, setIsRecording] = useState(false)
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const recognitionRef = useRef<any>(null)
  const synthRef = useRef<SpeechSynthesis | null>(null)

  // Initialize voice recognition when chatbot loads
  useEffect(() => {
    if (chatbot?.enableVoiceAgent) {
      setIsVoiceEnabled(true)
      if (typeof window !== 'undefined') {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
        if (SpeechRecognition) {
          const recognition = new SpeechRecognition()
          recognition.continuous = false
          recognition.interimResults = false
          recognition.lang = 'en-US'
          
          recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript
            setIsRecording(false)
            onTranscript(transcript)
          }
          
          recognition.onerror = (event: any) => {
            console.error('Speech recognition error:', event.error)
            setIsRecording(false)
            if (event.error === 'no-speech') {
              toast.error('No speech detected. Please try again.')
            } else if (event.error === 'not-allowed') {
              toast.error('Microphone permission denied. Please enable microphone access.')
            } else {
              toast.error('Speech recognition error. Please try again.')
            }
          }
          
          recognition.onend = () => {
            setIsRecording(false)
          }
          
          recognitionRef.current = recognition
        } else {
          toast.error('Speech recognition is not supported in your browser.')
          setIsVoiceEnabled(false)
        }
        
        if ('speechSynthesis' in window) {
          synthRef.current = window.speechSynthesis
        }
      }
    } else {
      setIsVoiceEnabled(false)
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
      if (synthRef.current) {
        synthRef.current.cancel()
      }
    }
  }, [chatbot?.enableVoiceAgent, onTranscript])

  const speak = (text: string) => {
    if (synthRef.current && chatbot?.enableVoiceAgent) {
      synthRef.current.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 1.0
      utterance.pitch = 1.0
      utterance.volume = 1.0
      utterance.onstart = () => setIsSpeaking(true)
      utterance.onend = () => setIsSpeaking(false)
      utterance.onerror = () => setIsSpeaking(false)
      synthRef.current.speak(utterance)
    }
  }

  const stopSpeaking = () => {
    if (synthRef.current) {
      synthRef.current.cancel()
      setIsSpeaking(false)
    }
  }

  const startRecording = () => {
    if (recognitionRef.current && !isRecording) {
      try {
        recognitionRef.current.start()
        setIsRecording(true)
        toast.success('Listening...')
      } catch (error) {
        console.error('Error starting recognition:', error)
        toast.error('Failed to start voice recording')
      }
    }
  }

  const stopRecording = () => {
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop()
      setIsRecording(false)
    }
  }

  const toggleVoiceOutput = (lastMessage?: string) => {
    if (synthRef.current) {
      if (isSpeaking) {
        stopSpeaking()
        toast.success('Voice output stopped')
      } else if (lastMessage) {
        speak(lastMessage)
        toast.success('Voice output resumed')
      }
    }
  }

  return {
    isRecording,
    isVoiceEnabled,
    isSpeaking,
    startRecording,
    stopRecording,
    speak,
    stopSpeaking,
    toggleVoiceOutput,
  }
}

