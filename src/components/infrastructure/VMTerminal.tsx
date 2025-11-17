'use client'

import { useState, useEffect, useRef } from 'react'
import { InfrastructureInstance } from '@/features/infrastructure/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { Terminal, History, FileCode, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface VMTerminalProps {
  vm: InfrastructureInstance
  username: string
  password: string
  onClose?: () => void
}

interface CommandHistory {
  id: string
  command: string
  timestamp: Date
}

interface Snippet {
  id: string
  name: string
  command: string
  description?: string
}

export function VMTerminal({ vm, username, password, onClose }: VMTerminalProps) {
  const [commandHistory, setCommandHistory] = useState<CommandHistory[]>([])
  const [snippets, setSnippets] = useState<Snippet[]>([
    { id: '1', name: 'List Files', command: 'ls -la', description: 'List all files with details' },
    { id: '2', name: 'Check Disk', command: 'df -h', description: 'Check disk usage' },
    { id: '3', name: 'System Info', command: 'uname -a', description: 'Show system information' },
    { id: '4', name: 'Process List', command: 'ps aux', description: 'List all processes' },
  ])
  const [selectedSnippet, setSelectedSnippet] = useState<string | null>(null)
  const terminalRef = useRef<HTMLDivElement>(null)
  const [terminalOutput, setTerminalOutput] = useState<string[]>([])
  const [currentCommand, setCurrentCommand] = useState('')

  // Load command history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(`vm-terminal-history-${vm.id}`)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setCommandHistory(parsed.map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp)
        })))
      } catch (e) {
        console.error('Failed to load command history:', e)
      }
    }
  }, [vm.id])

  // Save command history to localStorage
  useEffect(() => {
    if (commandHistory.length > 0) {
      localStorage.setItem(`vm-terminal-history-${vm.id}`, JSON.stringify(commandHistory))
    }
  }, [commandHistory, vm.id])

  const executeCommand = (command: string) => {
    if (!command.trim()) return

    // Add to history
    const historyItem: CommandHistory = {
      id: Date.now().toString(),
      command,
      timestamp: new Date(),
    }
    setCommandHistory(prev => [historyItem, ...prev].slice(0, 100)) // Keep last 100

    // Simulate command execution (in real implementation, this would connect via SSH)
    setTerminalOutput(prev => [
      ...prev,
      `$ ${command}`,
      `[Executing command on ${vm.name}...]`,
      `[This is a placeholder. Real implementation would use SSH connection.]`
    ])

    setCurrentCommand('')
  }

  const useSnippet = (snippet: Snippet) => {
    setCurrentCommand(snippet.command)
    setSelectedSnippet(snippet.id)
  }

  const useHistoryItem = (item: CommandHistory) => {
    setCurrentCommand(item.command)
  }

  return (
    <div className="flex h-full">
      {/* Terminal Area */}
      <div className="flex-1 flex flex-col border-r border-border">
        {/* Terminal Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Terminal className="h-5 w-5" />
            <div>
              <h3 className="font-semibold">{vm.name}</h3>
              <p className="text-xs text-muted-foreground">{vm.host}:{vm.port || 22}</p>
            </div>
          </div>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Terminal Output */}
        <ScrollArea className="flex-1 p-4 bg-black text-green-400 font-mono text-sm">
          <div ref={terminalRef} className="space-y-1">
            {terminalOutput.length === 0 ? (
              <div className="text-muted-foreground">
                <p>Connected to {vm.name}</p>
                <p>Type a command and press Enter to execute.</p>
              </div>
            ) : (
              terminalOutput.map((line, idx) => (
                <div key={idx}>{line}</div>
              ))
            )}
          </div>
        </ScrollArea>

        {/* Command Input */}
        <div className="p-4 border-t border-border">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              executeCommand(currentCommand)
            }}
            className="flex gap-2"
          >
            <Input
              value={currentCommand}
              onChange={(e) => setCurrentCommand(e.target.value)}
              placeholder="Enter command..."
              className="font-mono"
            />
            <Button type="submit">Execute</Button>
          </form>
        </div>
      </div>

      {/* Sidebar - Snippets and History */}
      <div className="w-80 flex flex-col border-l border-border">
        {/* Snippets Section */}
        <div className="flex-1 border-b border-border">
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-2">
              <FileCode className="h-4 w-4" />
              <h4 className="font-semibold">Snippets</h4>
            </div>
          </div>
          <ScrollArea className="h-full">
            <div className="p-2 space-y-1">
              {snippets.map((snippet) => (
                <Button
                  key={snippet.id}
                  variant="ghost"
                  className={cn(
                    "w-full justify-start text-left h-auto p-3",
                    selectedSnippet === snippet.id && "bg-muted"
                  )}
                  onClick={() => useSnippet(snippet)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{snippet.name}</div>
                    <div className="text-xs text-muted-foreground font-mono truncate">
                      {snippet.command}
                    </div>
                    {snippet.description && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {snippet.description}
                      </div>
                    )}
                  </div>
                </Button>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* History Section */}
        <div className="flex-1">
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-2">
              <History className="h-4 w-4" />
              <h4 className="font-semibold">Command History</h4>
            </div>
          </div>
          <ScrollArea className="h-full">
            <div className="p-2 space-y-1">
              {commandHistory.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No command history yet
                </div>
              ) : (
                commandHistory.map((item) => (
                  <Button
                    key={item.id}
                    variant="ghost"
                    className="w-full justify-start text-left h-auto p-3"
                    onClick={() => useHistoryItem(item)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-mono text-sm truncate">{item.command}</div>
                      <div className="text-xs text-muted-foreground">
                        {item.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                  </Button>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  )
}

