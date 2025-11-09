import { useState, useEffect, useRef } from 'react'
import { ChatbotConfig, Message } from '../types'
import toast from 'react-hot-toast'

interface UseChatVoiceOptions {
  chatbot: ChatbotConfig | null
  messages: Message[]
  isLoading: boolean
  onTranscript?: (transcript: string) => void
  onSendMessage?: (content: string) => void
}

export function useChatVoice({
  chatbot,
  messages,
  isLoading,
  onTranscript,
  onSendMessage,
}: UseChatVoiceOptions) {
  const [isRecording, setIsRecording] = useState(false)
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const recognitionRef = useRef<any>(null) // SpeechRecognition type varies by browser
  const synthRef = useRef<SpeechSynthesis | null>(null)

  // Initialize voice recognition when chatbot loads
  useEffect(() => {
    if (chatbot?.enableVoiceAgent) {
      setIsVoiceEnabled(true)
      // Initialize Speech Recognition (Web Speech API)
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
            if (onTranscript) {
              onTranscript(transcript)
            }
            // Auto-send the message
            if (onSendMessage) {
              onSendMessage(transcript)
            }
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

        // Initialize Speech Synthesis for text-to-speech
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
  }, [chatbot?.enableVoiceAgent, onTranscript, onSendMessage])

  // Speak assistant responses
  useEffect(() => {
    if (chatbot?.enableVoiceAgent && isVoiceEnabled && messages.length > 0) {
      const lastMessage = messages[messages.length - 1]
      if (lastMessage.role === 'assistant' && lastMessage.content && !isLoading) {
        // Cancel any ongoing speech
        if (synthRef.current) {
          synthRef.current.cancel()
        }

        // Speak the response
        const utterance = new SpeechSynthesisUtterance(lastMessage.content)
        utterance.rate = 1.0
        utterance.pitch = 1.0
        utterance.volume = 1.0

        utterance.onstart = () => setIsSpeaking(true)
        utterance.onend = () => setIsSpeaking(false)
        utterance.onerror = () => setIsSpeaking(false)

        if (synthRef.current) {
          synthRef.current.speak(utterance)
        }
      }
    }
  }, [messages, chatbot?.enableVoiceAgent, isVoiceEnabled, isLoading])

  const handleStartRecording = () => {
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

  const handleStopRecording = () => {
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop()
      setIsRecording(false)
    }
  }

  const toggleVoiceOutput = () => {
    if (synthRef.current) {
      if (isSpeaking) {
        synthRef.current.cancel()
        setIsSpeaking(false)
        toast.success('Voice output stopped')
      } else {
        // Resume speaking the last assistant message
        const lastAssistantMessage = [...messages].reverse().find((m) => m.role === 'assistant')
        if (lastAssistantMessage?.content) {
          const utterance = new SpeechSynthesisUtterance(lastAssistantMessage.content)
          utterance.onstart = () => setIsSpeaking(true)
          utterance.onend = () => setIsSpeaking(false)
          utterance.onerror = () => setIsSpeaking(false)
          synthRef.current.speak(utterance)
          toast.success('Voice output resumed')
        }
      }
    }
  }

  return {
    isRecording,
    isVoiceEnabled,
    isSpeaking,
    handleStartRecording,
    handleStopRecording,
    toggleVoiceOutput,
  }
}

