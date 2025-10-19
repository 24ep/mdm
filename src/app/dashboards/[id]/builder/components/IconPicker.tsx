import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Star as StarIcon,
  Heart,
  Home,
  User,
  Settings as SettingsIcon,
  Bell,
  CheckCircle,
  AlertTriangle,
  Camera,
  Cloud,
  Folder,
  Mail,
  Phone,
  Play as PlayIcon,
  Pause as PauseIcon,
  Search as SearchIcon,
  Plus as PlusIcon,
  Minus as MinusIcon,
  X as XIcon,
  Check as CheckIcon
} from 'lucide-react'

const ICON_REGISTRY: { name: string; Comp: any; tags?: string[]; category: 'system' | 'media' | 'arrows' | 'status' | 'files' }[] = [
  { name: 'Star', Comp: StarIcon, tags: ['favorite', 'rating'], category: 'status' },
  { name: 'Heart', Comp: Heart, tags: ['like', 'love'], category: 'status' },
  { name: 'Home', Comp: Home, category: 'system' },
  { name: 'User', Comp: User, category: 'system' },
  { name: 'Settings', Comp: SettingsIcon, tags: ['gear'], category: 'system' },
  { name: 'Bell', Comp: Bell, tags: ['notification'], category: 'status' },
  { name: 'CheckCircle', Comp: CheckCircle, tags: ['success'], category: 'status' },
  { name: 'AlertTriangle', Comp: AlertTriangle, tags: ['warning'], category: 'status' },
  { name: 'Camera', Comp: Camera, category: 'media' },
  { name: 'Cloud', Comp: Cloud, category: 'system' },
  { name: 'Folder', Comp: Folder, category: 'files' },
  { name: 'Mail', Comp: Mail, category: 'system' },
  { name: 'Phone', Comp: Phone, category: 'system' },
  { name: 'Play', Comp: PlayIcon, category: 'media' },
  { name: 'Pause', Comp: PauseIcon, category: 'media' },
  { name: 'Search', Comp: SearchIcon, category: 'system' },
  { name: 'Plus', Comp: PlusIcon, category: 'arrows' },
  { name: 'Minus', Comp: MinusIcon, category: 'arrows' },
  { name: 'X', Comp: XIcon, category: 'arrows' },
  { name: 'Check', Comp: CheckIcon, category: 'status' }
]

interface IconPickerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  value?: string
  color?: string
  onSelect: (iconName: string) => void
}

export function IconPicker({ open, onOpenChange, value, color = '#1f2937', onSelect }: IconPickerProps) {
  const [query, setQuery] = React.useState('')
  const [pack, setPack] = React.useState<'lucide'>('lucide')
  const [category, setCategory] = React.useState<'all' | 'system' | 'media' | 'arrows' | 'status' | 'files'>('all')
  const normalized = query.trim().toLowerCase()
  const filtered = React.useMemo(() => {
    let base = ICON_REGISTRY
    if (category !== 'all') {
      base = base.filter(i => i.category === category)
    }
    if (!normalized) return base
    return base.filter(({ name, tags }) =>
      name.toLowerCase().includes(normalized) || (tags || []).some(t => t.toLowerCase().includes(normalized))
    )
  }, [normalized, category])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Select Icon</DialogTitle>
          <DialogDescription>
            Choose an icon for your dashboard element from the available options.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Input placeholder="Search icons..." value={query} onChange={(e) => setQuery(e.target.value)} />
            <Select value={pack} onValueChange={() => { /* future packs */ }}>
              <SelectTrigger className="w-32"><SelectValue placeholder="Pack" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="lucide">Lucide</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Tabs value={category} onValueChange={(v) => setCategory(v as any)}>
            <TabsList className="grid grid-cols-6">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="system">System</TabsTrigger>
              <TabsTrigger value="media">Media</TabsTrigger>
              <TabsTrigger value="arrows">Arrows</TabsTrigger>
              <TabsTrigger value="status">Status</TabsTrigger>
              <TabsTrigger value="files">Files</TabsTrigger>
            </TabsList>
            <TabsContent value={category} className="mt-3">
              <div className="grid grid-cols-8 gap-3 max-h-96 overflow-auto p-1">
                {filtered.map(({ name, Comp }) => (
                  <button
                    key={name}
                    className={`border rounded-md p-2 flex flex-col items-center justify-center hover:bg-muted ${value === name ? 'border-blue-500 bg-blue-50' : 'border-border'}`}
                    onClick={() => { onSelect(name); onOpenChange(false) }}
                    title={name}
                  >
                    <Comp width={24} height={24} color={color} />
                    <span className="text-[10px] mt-1 text-muted-foreground">{name}</span>
                  </button>
                ))}
              </div>
            </TabsContent>
          </Tabs>
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}


