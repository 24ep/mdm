"use client"

import React, { useState } from 'react'
import { AnimatedIcon, LoadingIcon, HoverIcon, ClickIcon, BounceIcon, PulseIcon, FloatIcon, ShakeIcon, GlowIcon } from '@/components/ui/animated-icon'
import { IconPicker } from '@/components/ui/icon-picker'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const animationTypes = [
  { name: 'none', label: 'None', description: 'No animation' },
  { name: 'bounce', label: 'Bounce', description: 'Bouncing up and down' },
  { name: 'pulse', label: 'Pulse', description: 'Scaling in and out' },
  { name: 'spin', label: 'Spin', description: 'Continuous rotation' },
  { name: 'wiggle', label: 'Wiggle', description: 'Quick rotation shake' },
  { name: 'float', label: 'Float', description: 'Gentle up and down movement' },
  { name: 'scale', label: 'Scale', description: 'Scale on hover/click' },
  { name: 'rotate', label: 'Rotate', description: '180° rotation on hover' },
  { name: 'shake', label: 'Shake', description: 'Horizontal shake' },
  { name: 'glow', label: 'Glow', description: 'Glow effect on hover' }
]

const triggerTypes = [
  { name: 'hover', label: 'Hover', description: 'Animate on mouse hover' },
  { name: 'click', label: 'Click', description: 'Animate on click/tap' },
  { name: 'always', label: 'Always', description: 'Continuous animation' },
  { name: 'mount', label: 'Mount', description: 'Animate on component mount' }
]

export default function AnimatedIconsDemo() {
  const [selectedIcon, setSelectedIcon] = useState('Heart')
  const [selectedAnimation, setSelectedAnimation] = useState('scale')
  const [selectedTrigger, setSelectedTrigger] = useState('hover')
  const [showIconPicker, setShowIconPicker] = useState(false)

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Animated Icons Demo</h1>
        <p className="text-lg text-muted-foreground">
          Explore the power of animated Lucide icons with Framer Motion
        </p>
      </div>

      {/* Interactive Controls */}
      <Card className="p-6">
        <h2 className="text-2xl font-semibold mb-4">Interactive Controls</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2">Select Icon</label>
            <Button 
              onClick={() => setShowIconPicker(!showIconPicker)}
              variant="outline"
              className="w-full justify-start"
            >
              {selectedIcon}
            </Button>
            {showIconPicker && (
              <div className="mt-2">
                <IconPicker
                  value={selectedIcon}
                  onChange={setSelectedIcon}
                  animated={true}
                  animation="scale"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Animation Type</label>
            <select
              value={selectedAnimation}
              onChange={(e) => setSelectedAnimation(e.target.value)}
              className="w-full p-2 border rounded-md"
            >
              {animationTypes.map(type => (
                <option key={type.name} value={type.name}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Trigger</label>
            <select
              value={selectedTrigger}
              onChange={(e) => setSelectedTrigger(e.target.value)}
              className="w-full p-2 border rounded-md"
            >
              {triggerTypes.map(type => (
                <option key={type.name} value={type.name}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Live Preview */}
      <Card className="p-6">
        <h2 className="text-2xl font-semibold mb-4">Live Preview</h2>
        <div className="flex items-center justify-center p-8 bg-gray-50 rounded-lg">
          <AnimatedIcon
            icon={selectedIcon}
            size={64}
            animation={selectedAnimation as any}
            trigger={selectedTrigger as any}
            className="text-blue-600"
          />
        </div>
        <div className="mt-4 text-center text-sm text-muted-foreground">
          {selectedTrigger === 'hover' && 'Hover over the icon to see the animation'}
          {selectedTrigger === 'click' && 'Click the icon to see the animation'}
          {selectedTrigger === 'always' && 'Animation plays continuously'}
          {selectedTrigger === 'mount' && 'Animation plays when component mounts'}
        </div>
      </Card>

      {/* Animation Showcase */}
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold">Animation Showcase</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {animationTypes.map(animation => (
            <Card key={animation.name} className="p-4">
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <AnimatedIcon
                    icon="Star"
                    size={48}
                    animation={animation.name as any}
                    trigger="hover"
                    className="text-yellow-500"
                  />
                </div>
                <div>
                  <h3 className="font-semibold">{animation.label}</h3>
                  <p className="text-sm text-muted-foreground">{animation.description}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Preset Components */}
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold">Preset Components</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4 text-center">
            <LoadingIcon icon="Loader2" size={32} className="text-blue-500 mb-2" />
            <h3 className="font-semibold">LoadingIcon</h3>
            <p className="text-sm text-muted-foreground">Spinning animation</p>
          </Card>

          <Card className="p-4 text-center">
            <HoverIcon icon="Heart" size={32} className="text-red-500 mb-2" />
            <h3 className="font-semibold">HoverIcon</h3>
            <p className="text-sm text-muted-foreground">Scale on hover</p>
          </Card>

          <Card className="p-4 text-center">
            <ClickIcon icon="ThumbsUp" size={32} className="text-green-500 mb-2" />
            <h3 className="font-semibold">ClickIcon</h3>
            <p className="text-sm text-muted-foreground">Scale on click</p>
          </Card>

          <Card className="p-4 text-center">
            <BounceIcon icon="Bell" size={32} className="text-purple-500 mb-2" />
            <h3 className="font-semibold">BounceIcon</h3>
            <p className="text-sm text-muted-foreground">Bouncing animation</p>
          </Card>

          <Card className="p-4 text-center">
            <PulseIcon icon="Activity" size={32} className="text-orange-500 mb-2" />
            <h3 className="font-semibold">PulseIcon</h3>
            <p className="text-sm text-muted-foreground">Pulsing animation</p>
          </Card>

          <Card className="p-4 text-center">
            <FloatIcon icon="Cloud" size={32} className="text-cyan-500 mb-2" />
            <h3 className="font-semibold">FloatIcon</h3>
            <p className="text-sm text-muted-foreground">Floating animation</p>
          </Card>

          <Card className="p-4 text-center">
            <ShakeIcon icon="AlertTriangle" size={32} className="text-yellow-500 mb-2" />
            <h3 className="font-semibold">ShakeIcon</h3>
            <p className="text-sm text-muted-foreground">Shaking animation</p>
          </Card>

          <Card className="p-4 text-center">
            <GlowIcon icon="Zap" size={32} className="text-yellow-400 mb-2" />
            <h3 className="font-semibold">GlowIcon</h3>
            <p className="text-sm text-muted-foreground">Glow on hover</p>
          </Card>
        </div>
      </div>

      {/* Usage Examples */}
      <Card className="p-6">
        <h2 className="text-2xl font-semibold mb-4">Usage Examples</h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Basic Usage</h3>
            <pre className="bg-gray-100 p-4 rounded-md text-sm overflow-x-auto">
{`import { AnimatedIcon } from '@/components/ui/animated-icon'

<AnimatedIcon 
  icon="Heart" 
  size={24} 
  animation="bounce" 
  trigger="hover" 
/>`}
            </pre>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Preset Components</h3>
            <pre className="bg-gray-100 p-4 rounded-md text-sm overflow-x-auto">
{`import { LoadingIcon, HoverIcon, BounceIcon } from '@/components/ui/animated-icon'

<LoadingIcon icon="Loader2" size={20} />
<HoverIcon icon="Heart" size={24} />
<BounceIcon icon="Bell" size={20} />`}
            </pre>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Custom Animation</h3>
            <pre className="bg-gray-100 p-4 rounded-md text-sm overflow-x-auto">
{`<AnimatedIcon 
  icon="Star" 
  size={32} 
  animation="rotate" 
  trigger="click"
  duration={0.5}
  delay={0.1}
  repeat={3}
/>`}
            </pre>
          </div>
        </div>
      </Card>
    </div>
  )
}
