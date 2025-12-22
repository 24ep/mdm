'use client'

import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { X, Plus, MessageSquare, Trash2 } from 'lucide-react'
import { ChatbotConfig, Message } from '../types'

interface ChatHistoryItem {
  id: string
  title: string
  messages: Message[]
  createdAt: Date
}

interface ChatSidebarProps {
  sidebarOpen: boolean
  onClose: () => void
  chatHistory: ChatHistoryItem[]
  currentChatId: string | null
  onSelectChat: (chatId: string) => void
  onNewChat: () => void
  onDeleteChat: (chatId: string, e: React.MouseEvent) => void
  chatbot: ChatbotConfig
}

export function ChatSidebar({
  sidebarOpen,
  onClose,
  chatHistory,
  currentChatId,
  onSelectChat,
  onNewChat,
  onDeleteChat,
  chatbot,
}: ChatSidebarProps) {
  return (
    <div className={`${sidebarOpen ? 'w-64' : 'w-0'} transition-all duration-300 border-r bg-background/95 backdrop-blur-sm flex flex-col overflow-hidden`}>
      {sidebarOpen && (
        <>
          <div className="p-4 border-b flex items-center justify-between">
            <h2 className="font-semibold text-lg">Chat History</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="p-4 border-b">
            <Button onClick={onNewChat} className="w-full" size="sm"
              style={{
                backgroundColor: chatbot.primaryColor,
                color: chatbot.fontColor
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Chat
            </Button>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {chatHistory.map((chat) => (
                <div
                  key={chat.id}
                  onClick={() => onSelectChat(chat.id)}
                  className={`p-3 rounded-lg cursor-pointer hover:bg-muted transition-colors group`}
                  style={currentChatId === chat.id ? {
                    backgroundColor: `${chatbot.primaryColor}15`, // 15 = ~8% opacity
                    border: `1px solid ${chatbot.primaryColor}40` // 40 = ~25% opacity
                  } : {}}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <MessageSquare className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <p className="text-sm font-medium truncate">{chat.title}</p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {chat.messages.length} messages
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {chat.createdAt.toLocaleDateString()}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => onDeleteChat(chat.id, e)}
                    >
                      <Trash2 className="h-3 w-3 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
              {chatHistory.length === 0 && (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No chat history</p>
                  <p className="text-xs mt-1">Start a new chat to begin</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </>
      )}
    </div>
  )
}

