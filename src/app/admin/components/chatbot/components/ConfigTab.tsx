'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Combobox } from '@/components/ui/combobox'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Check, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { X } from 'lucide-react'
import * as Icons from 'lucide-react'
import { Chatbot } from '../types'
import { extractNumericValue, ensurePx } from '../style/styleUtils'
import {
  ThreadItemActionsSection,
  DisclaimerSection,
  ModelPickerSection,
  PersonaPickerSection,
  StartScreenSection
} from '../style/sections'

interface ConfigTabProps {
  formData: Partial<Chatbot>
  setFormData: React.Dispatch<React.SetStateAction<Partial<Chatbot>>>
}

// Icon Select Combobox Component with search and icons
function IconSelectCombobox({ value, onValueChange }: { value: string; onValueChange: (value: string) => void }) {
  const [open, setOpen] = useState(false)
  
  // Comprehensive list of Lucide icons
  const iconList = [
    'None', 'Lightbulb', 'Star', 'Search', 'Zap', 'Sparkles', 'BookOpen', 'Compass', 'Globe', 'Mail', 
    'Phone', 'User', 'Users', 'Settings', 'Info', 'CheckCircle2', 'Calendar', 'MapPin', 'Plus', 'Edit', 
    'Trash2', 'Heart', 'Smile', 'MessageSquare', 'Brain', 'Rocket', 'Target', 'TrendingUp', 'HelpCircle',
    'AlertCircle', 'AlertTriangle', 'Check', 'X', 'XCircle', 'Minus', 'PlusCircle', 'MinusCircle',
    'ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown', 'ChevronRight', 'ChevronLeft', 'ChevronUp', 'ChevronDown',
    'Home', 'Folder', 'File', 'FileText', 'Image', 'Video', 'Music', 'Download', 'Upload', 'Share',
    'Copy', 'Scissors', 'Save', 'Lock', 'Unlock', 'Key', 'Shield', 'Eye', 'EyeOff', 'Bell', 'BellOff',
    'Tag', 'Tags', 'Filter', 'Sliders', 'Grid', 'List', 'Layout', 'Columns', 'Rows', 'Maximize', 'Minimize',
    'RefreshCw', 'RotateCw', 'RotateCcw', 'Repeat', 'Shuffle', 'Play', 'Pause', 'Stop', 'SkipForward', 'SkipBack',
    'Volume', 'Volume1', 'Volume2', 'VolumeX', 'Mic', 'MicOff', 'Headphones', 'Radio', 'Tv', 'Monitor',
    'Laptop', 'Smartphone', 'Tablet', 'Watch', 'Camera', 'CameraOff', 'Film', 'Aperture', 'Focus',
    'Sun', 'Moon', 'Cloud', 'CloudRain', 'CloudSnow', 'Wind', 'Droplet', 'Flame', 'Battery',
    'Wifi', 'WifiOff', 'Bluetooth', 'Signal', 'Activity', 'Pulse', 'Heartbeat', 'Thermometer',
    'Gift', 'Package', 'ShoppingCart', 'ShoppingBag', 'CreditCard', 'DollarSign', 'Coins', 'Receipt',
    'BarChart', 'BarChart2', 'LineChart', 'PieChart', 'TrendingDown', 'ArrowUpRight', 'ArrowDownRight',
    'Database', 'Server', 'HardDrive', 'Cpu', 'MemoryStick', 'Network', 'CloudUpload', 'CloudDownload',
    'Code', 'Code2', 'Terminal', 'Command', 'GitBranch', 'GitCommit', 'GitMerge', 'GitPullRequest',
    'Bug', 'Wrench', 'Tool', 'Hammer', 'Screwdriver', 'Paintbrush', 'Palette',
    'Pen', 'PenTool', 'Highlighter', 'Eraser', 'Ruler', 'Navigation', 'Map',
    'Flag', 'Award', 'Trophy', 'Medal', 'Crown', 'Gem', 'Diamond', 'Banknote',
    'Coffee', 'Utensils', 'Apple', 'Carrot', 'Cookie', 'IceCream', 'Pizza', 'Beer', 'Wine',
    'Gamepad', 'Gamepad2', 'Dice1', 'Dice2', 'Dice3', 'Dice4', 'Dice5', 'Dice6', 'Puzzle',
    'Book', 'Bookmark', 'Library', 'GraduationCap', 'School', 'University', 'Briefcase',
    'Building', 'Building2', 'Hotel', 'Store', 'Archive', 'Box',
    'Truck', 'Car', 'Bike', 'Plane', 'Ship', 'Train', 'Bus', 'Taxi',
    'Music2', 'Mic2', 'VideoOff', 'Images', 'PictureInPicture',
    'Brush', 'Crop', 'Layers', 'Frame',
    'MessageCircle', 'Inbox', 'Send', 'Reply', 'Forward',
    'UserPlus', 'UserMinus', 'UserCheck', 'UserX', 'UserCircle', 'UserSquare',
    'HeartOff', 'ThumbsUp', 'ThumbsDown', 'Frown', 'Meh', 'Laugh',
    'FlagOff', 'BookmarkCheck', 'StarOff',
    'ShieldOff', 'SearchX',
    'Cog', 'Hospital', 'Church', 'Factory',
    'Earth', 'World', 'Location',
    'Clock', 'Timer', 'Stopwatch', 'AlarmClock', 'Hourglass', 'History',
    'FolderOpen', 'FileImage', 'FileVideo', 'FileAudio', 'FileCode',
    'Link', 'Link2', 'ExternalLink',
    'SaveAll', 'FolderPlus', 'FilePlus', 'Trash',
    'Edit2', 'Edit3', 'Type', 'AlignLeft', 'AlignCenter',
    'ChevronsRight', 'ChevronsLeft',
    'MoreHorizontal', 'MoreVertical', 'Menu', 'MenuSquare',
    'Maximize2', 'Minimize2', 'Expand', 'Shrink', 'Move',
    'Square', 'Circle', 'Triangle', 'Hexagon', 'Octagon',
    'CloudLightning', 'BatteryCharging', 'BatteryLow', 'BatteryFull', 'Power',
    'SignalLow', 'SignalMedium', 'SignalHigh',
    'Gauge'
  ]

  const iconOptions = iconList.map(iconName => {
    if (iconName === 'None') {
      return { value: 'none', label: 'None', icon: null }
    }
    const IconComponent = (Icons as any)[iconName]
    const displayName = iconName
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim()
    return {
      value: iconName,
      label: displayName,
      icon: IconComponent
    }
  })

  const selectedOption = iconOptions.find(opt => opt.value === (value || 'none'))
  const SelectedIcon = selectedOption?.icon

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          <div className="flex items-center gap-2">
            {SelectedIcon && <SelectedIcon className="h-4 w-4" />}
            <span>{selectedOption?.label || 'Select icon...'}</span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search icons..." />
          <CommandList>
            <CommandEmpty>No icon found.</CommandEmpty>
            <CommandGroup>
              {iconOptions.map((option) => {
                const IconComponent = option.icon
                const isSelected = (value || 'none') === option.value
                return (
                  <CommandItem
                    key={option.value}
                    value={option.label}
                    keywords={[option.value.toLowerCase(), option.label.toLowerCase()]}
                    onSelect={() => {
                      onValueChange(option.value === 'none' ? '' : option.value)
                      setOpen(false)
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        isSelected ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {IconComponent ? (
                      <IconComponent className="mr-2 h-4 w-4" />
                    ) : null}
                    {option.label}
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export function ConfigTab({ formData, setFormData }: ConfigTabProps) {
  const [newFollowUpQuestion, setNewFollowUpQuestion] = useState('')
  const [accordionValue, setAccordionValue] = useState<string>('startScreen')
  const chatkitOptions = (formData as any).chatkitOptions || {}
  const engineType = (formData as any).engineType || 'custom'
  const isChatKitEngine = engineType === 'chatkit' // Only show ChatKit config for chatkit engine, not for agent-sdk
  const isAgentSDK = engineType === 'openai-agent-sdk'

  const addFollowUpQuestion = () => {
    if (newFollowUpQuestion.trim()) {
      setFormData({
        ...formData,
        followUpQuestions: [...(formData.followUpQuestions || []), newFollowUpQuestion.trim()]
      })
      setNewFollowUpQuestion('')
    }
  }

  const removeFollowUpQuestion = (index: number) => {
    const updated = [...(formData.followUpQuestions || [])]
    updated.splice(index, 1)
    setFormData({
      ...formData,
      followUpQuestions: updated
    })
  }

  return (
    <div className="space-y-4 pt-4">
      {/* Start Conversation / Opener Message (NOT for ChatKit - uses ChatKit configuration) */}
      {!isChatKitEngine && (
        <div className="space-y-4 border-b pb-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Show Start Conversation Message</Label>
              <p className="text-xs text-muted-foreground">Display an initial greeting message when the chat opens</p>
            </div>
            <Switch
              checked={(formData as any).showStartConversation !== false}
              onCheckedChange={(checked) => setFormData({ ...formData, showStartConversation: checked } as any)}
            />
          </div>
          
          {(formData as any).showStartConversation !== false && (
            <div className="space-y-2 pl-4 border-l-2 border-muted">
              <Label>Start Conversation Message</Label>
              <Textarea
                value={formData.conversationOpener || (formData as any).openaiAgentSdkGreeting || ''}
                onChange={(e) => {
                  const value = e.target.value
                  setFormData({ 
                    ...formData, 
                    conversationOpener: value,
                    // Also update Agent SDK greeting if it's an Agent SDK chatbot
                    ...(isAgentSDK && { openaiAgentSdkGreeting: value })
                  } as any)
                }}
                placeholder="Hello! How can I help you today?"
                rows={3}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                Initial message shown when the chat opens. For Agent SDK workflows, this may be overridden by the workflow configuration.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Start Screen Prompts (for Agent SDK and other engines, NOT for ChatKit) */}
      {!isChatKitEngine && (
      <div className="space-y-4 border-b pb-4">
        <div className="space-y-2">
          <Label>Start Screen Prompts</Label>
          <p className="text-xs text-muted-foreground">
            Add quick prompt buttons that appear when the chat starts (for Agent SDK and other engines)
          </p>
          
          <div className="space-y-2 mt-4">
            {((formData as any).startScreenPrompts || []).map((prompt: { label?: string; prompt: string; icon?: string }, index: number) => (
              <div key={index} className="border rounded-lg p-3 space-y-2">
                <div className="flex gap-2 items-start">
                  <div className="space-y-1 w-32">
                    <Label className="text-xs">Icon (optional)</Label>
                    <IconSelectCombobox
                      value={prompt.icon || 'none'}
                      onValueChange={(value) => {
                        const prompts = [...((formData as any).startScreenPrompts || [])]
                        prompts[index] = { ...prompts[index], icon: value === 'none' ? undefined : value }
                        setFormData({ ...formData, startScreenPrompts: prompts } as any)
                      }}
                    />
                  </div>
                  <div className="flex-1 grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Button Label</Label>
                      <Input
                        value={prompt.label || ''}
                        onChange={(e) => {
                          const prompts = [...((formData as any).startScreenPrompts || [])]
                          prompts[index] = { ...prompts[index], label: e.target.value }
                          setFormData({ ...formData, startScreenPrompts: prompts } as any)
                        }}
                        placeholder="Button Label"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Prompt Text (required)</Label>
                      <Input
                        value={prompt.prompt || ''}
                        onChange={(e) => {
                          const prompts = [...((formData as any).startScreenPrompts || [])]
                          prompts[index] = { ...prompts[index], prompt: e.target.value }
                          setFormData({ ...formData, startScreenPrompts: prompts } as any)
                        }}
                        placeholder="Prompt Text"
                      />
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const prompts = [...((formData as any).startScreenPrompts || [])]
                      prompts.splice(index, 1)
                      setFormData({ ...formData, startScreenPrompts: prompts } as any)
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const prompts = [...((formData as any).startScreenPrompts || []), { prompt: '', label: '' }]
                setFormData({ ...formData, startScreenPrompts: prompts } as any)
              }}
            >
              + Add Prompt
            </Button>
          </div>
        </div>
      </div>
      )}

      <div className="space-y-2">
        <Label>Follow-up Questions</Label>
        <div className="flex gap-2">
          <Input
            value={newFollowUpQuestion}
            onChange={(e) => setNewFollowUpQuestion(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addFollowUpQuestion()}
            placeholder="Enter a follow-up question"
          />
          <Button onClick={addFollowUpQuestion}>Add</Button>
        </div>
        <div className="space-y-2 mt-2">
          {(formData.followUpQuestions || []).map((question, index) => (
            <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded">
              <span className="flex-1">{question}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeFollowUpQuestion(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Enable File Upload</Label>
          <Switch
            checked={formData.enableFileUpload}
            onCheckedChange={(checked) => setFormData({ ...formData, enableFileUpload: checked })}
          />
        </div>
        {!isChatKitEngine && !isAgentSDK && (
          <div className="flex items-center justify-between">
            <Label>Show Citations and Attributions</Label>
            <Switch
              checked={formData.showCitations}
              onCheckedChange={(checked) => setFormData({ ...formData, showCitations: checked })}
            />
          </div>
        )}
        {!isChatKitEngine && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Enable Voice Agent</Label>
                <p className="text-xs text-muted-foreground">Allow users to interact via voice input and hear responses</p>
              </div>
              <Switch
                checked={formData.enableVoiceAgent || false}
                onCheckedChange={(checked) => setFormData({ ...formData, enableVoiceAgent: checked })}
              />
            </div>
            
            {formData.enableVoiceAgent && (
              <div className="space-y-4 pl-4 border-l-2 border-muted">
                <div className="space-y-2">
                  <Label>Voice Provider</Label>
                  <Select
                    value={formData.voiceProvider || 'browser'}
                    onValueChange={(value: string) => setFormData({ ...formData, voiceProvider: value as 'browser' | 'openai-realtime' | 'agentbuilder' })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="browser">Browser Web Speech API</SelectItem>
                      <SelectItem value="openai-realtime">OpenAI Realtime API</SelectItem>
                      <SelectItem value="agentbuilder">Agent Builder Voice</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {formData.voiceProvider === 'openai-realtime' 
                      ? 'Uses OpenAI Realtime API for high-quality voice interactions (requires OpenAI API key)'
                      : formData.voiceProvider === 'agentbuilder'
                        ? 'Uses Agent Builder voice capabilities (requires Agent Builder engine)'
                        : 'Uses browser built-in speech recognition and synthesis'}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label>Voice UI Style</Label>
                  <Select
                    value={formData.voiceUIStyle || 'chat'}
                    onValueChange={(value: string) => setFormData({ ...formData, voiceUIStyle: value as 'chat' | 'wave' })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="chat">Chat-like (Current)</SelectItem>
                      <SelectItem value="wave">Wave Animation Background</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {formData.voiceUIStyle === 'wave' 
                      ? 'Shows wave animation in background with turn on/off voice button and subtitle'
                      : 'Uses the current chat interface for voice interactions'}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {isChatKitEngine && (
        <div className="space-y-4 border-t pt-4">
          <h3 className="text-lg font-semibold mb-2">ChatKit Configuration</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Configure ChatKit-specific features and options.
          </p>

          <div className="space-y-0">
          <Accordion type="single" collapsible value={accordionValue} onValueChange={(value) => setAccordionValue(typeof value === 'string' ? value : value[0] || '')}>
            <StartScreenSection formData={formData} setFormData={setFormData} chatkitOptions={chatkitOptions} />
            <ThreadItemActionsSection formData={formData} setFormData={setFormData} chatkitOptions={chatkitOptions} />
            <DisclaimerSection formData={formData} setFormData={setFormData} chatkitOptions={chatkitOptions} />
            <ModelPickerSection formData={formData} setFormData={setFormData} chatkitOptions={chatkitOptions} />
            <PersonaPickerSection formData={formData} setFormData={setFormData} chatkitOptions={chatkitOptions} />
          </Accordion>
        </div>
        </div>
      )}

    </div>
  )
}

