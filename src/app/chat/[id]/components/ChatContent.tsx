'use client'

import { ChatbotConfig, Message } from '../types'
import { ChatHeader } from './ChatHeader'
import { MessagesList } from './MessagesList'
import { ChatInput } from './ChatInput'
import { VoiceWaveUI } from './VoiceWaveUI'

interface ChatContentProps {
  chatbot: ChatbotConfig
  messages: Message[]
  input: string
  setInput: (value: string) => void
  attachments: Array<{ type: 'image' | 'video', url: string, name?: string }>
  setAttachments: React.Dispatch<React.SetStateAction<Array<{ type: 'image' | 'video', url: string, name?: string }>>>
  isLoading: boolean
  selectedFollowUp: string | null
  messageFeedback: Record<string, 'liked' | 'disliked' | null>
  setMessageFeedback: React.Dispatch<React.SetStateAction<Record<string, 'liked' | 'disliked' | null>>>
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>
  sendMessage: (content: string, attachments?: Array<{ type: 'image' | 'video', url: string, name?: string }>) => Promise<void>
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void
  onFollowUpClick: (question: string) => void
  removeAttachment: (index: number) => void
  handleSubmit: (e: React.FormEvent) => void
  isRecording: boolean
  isVoiceEnabled: boolean
  isSpeaking: boolean
  audioLevel?: number // Real-time audio level (0-100) for visualization
  onStartRecording: () => void
  onStopRecording: () => void
  onToggleVoiceOutput: () => void
  scrollAreaRef: React.RefObject<HTMLDivElement>
  messagesEndRef: React.RefObject<HTMLDivElement>
  currentTranscript?: string
  chatbotId?: string
  threadId?: string | null
}

export function ChatContent({
  chatbot,
  messages,
  input,
  setInput,
  attachments,
  setAttachments,
  isLoading,
  selectedFollowUp,
  messageFeedback,
  setMessageFeedback,
  setMessages,
  sendMessage,
  onFileSelect,
  onFollowUpClick,
  removeAttachment,
  handleSubmit,
  isRecording,
  isVoiceEnabled,
  isSpeaking,
  audioLevel = 0,
  onStartRecording,
  onStopRecording,
  onToggleVoiceOutput,
  scrollAreaRef,
  messagesEndRef,
  currentTranscript,
  chatbotId,
  threadId,
}: ChatContentProps) {
  // Check if wave UI should be shown
  const showWaveUI = chatbot.enableVoiceAgent && chatbot.voiceUIStyle === 'wave'

  if (showWaveUI) {
    return (
      <>
        <ChatHeader 
          chatbot={chatbot} 
          onClearSession={() => setMessages([])}
        />
        <div className="flex-1 relative flex flex-col" style={{ minHeight: '400px' }}>
          {/* Wave UI takes most of the space */}
          <div className="flex-1 relative">
            <VoiceWaveUI
              chatbot={chatbot}
              isRecording={isRecording}
              isVoiceEnabled={isVoiceEnabled}
              isSpeaking={isSpeaking}
              audioLevel={audioLevel}
              onStartRecording={onStartRecording}
              onStopRecording={onStopRecording}
              onToggleVoiceOutput={onToggleVoiceOutput}
              transcript={currentTranscript}
              messages={messages}
              showMessages={true}
            />
          </div>
          
          {/* Optional: Show compact input at bottom for text fallback */}
          <div className="border-t p-2" style={{
            borderColor: chatbot.borderColor,
            ...(() => {
              const bgValue = chatbot.messageBoxColor
              // Check if it's an image URL
              if (bgValue && (bgValue.startsWith('url(') || bgValue.startsWith('http://') || bgValue.startsWith('https://') || bgValue.startsWith('/'))) {
                const imageUrl = bgValue.startsWith('url(') ? bgValue : `url(${bgValue})`
                return {
                  backgroundImage: imageUrl,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat',
                  backgroundColor: '#ffffff', // Fallback color
                }
              }
              return { backgroundColor: bgValue }
            })(),
          }}>
            <div className="text-xs text-center text-muted-foreground mb-1">
              Voice mode active • Switch to text input below
            </div>
            <ChatInput
              chatbot={chatbot}
              input={input}
              setInput={setInput}
              attachments={attachments}
              setAttachments={setAttachments}
              isLoading={isLoading}
              onSubmit={handleSubmit}
              onFileSelect={onFileSelect}
              isRecording={isRecording}
              isVoiceEnabled={isVoiceEnabled}
              isSpeaking={isSpeaking}
              onStartRecording={onStartRecording}
              onStopRecording={onStopRecording}
              onToggleVoiceOutput={onToggleVoiceOutput}
              removeAttachment={removeAttachment}
            />
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <ChatHeader 
        chatbot={chatbot} 
        onClearSession={() => setMessages([])}
      />

      <MessagesList
        messages={messages}
        chatbot={chatbot}
        isLoading={isLoading}
        messageFeedback={messageFeedback}
        setMessageFeedback={setMessageFeedback}
        setMessages={setMessages}
        sendMessage={sendMessage}
        scrollAreaRef={scrollAreaRef}
        messagesEndRef={messagesEndRef}
        chatbotId={chatbotId}
        threadId={threadId}
      />

      {/* Follow-up Questions */}
      {chatbot.followUpQuestions && chatbot.followUpQuestions.length > 0 && !isLoading && (
        <div className="px-4 pb-2 space-y-2">
          {chatbot.followUpQuestions.map((question, index) => (
            <button
              key={index}
              onClick={() => onFollowUpClick(question)}
              disabled={isLoading || selectedFollowUp === question}
              className="w-full text-left p-2 rounded text-sm hover:opacity-80 transition-opacity"
              style={{
                borderColor: chatbot.borderColor,
                borderWidth: chatbot.borderWidth,
                ...(() => {
              const bgValue = chatbot.messageBoxColor
              // Check if it's an image URL
              if (bgValue && (bgValue.startsWith('url(') || bgValue.startsWith('http://') || bgValue.startsWith('https://') || bgValue.startsWith('/'))) {
                const imageUrl = bgValue.startsWith('url(') ? bgValue : `url(${bgValue})`
                return {
                  backgroundImage: imageUrl,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat',
                  backgroundColor: '#ffffff', // Fallback color
                }
              }
              return { backgroundColor: bgValue }
            })(),
                color: chatbot.fontColor,
              }}
            >
              {question}
            </button>
          ))}
        </div>
      )}

      <ChatInput
        chatbot={chatbot}
        input={input}
        setInput={setInput}
        attachments={attachments}
        setAttachments={setAttachments}
        isLoading={isLoading}
        onSubmit={handleSubmit}
        onFileSelect={onFileSelect}
        isRecording={isRecording}
        isVoiceEnabled={isVoiceEnabled}
        isSpeaking={isSpeaking}
        onStartRecording={onStartRecording}
        onStopRecording={onStopRecording}
        onToggleVoiceOutput={onToggleVoiceOutput}
        removeAttachment={removeAttachment}
      />
    </>
  )
}

