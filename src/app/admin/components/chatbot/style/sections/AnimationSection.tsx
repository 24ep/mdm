import { ChatbotConfig } from '@/app/chat/[id]/types'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'

interface AnimationSectionProps {
    config: ChatbotConfig
    handleChange: (field: keyof ChatbotConfig, value: any) => void
}

export function AnimationSection({ config, handleChange }: AnimationSectionProps) {
    return (
        <div className="space-y-6">
            <div className="space-y-4">
                <h3 className="text-lg font-medium">Entry Animation</h3>
                <div className="grid gap-3">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Type</Label>
                            <Select
                                value={config.widgetAnimationEntry || 'slide-up'}
                                onValueChange={(value) => handleChange('widgetAnimationEntry', value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select entry animation" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="slide-up">Slide Up</SelectItem>
                                    <SelectItem value="slide-side">Slide Side</SelectItem>
                                    <SelectItem value="scale">Scale (Pop)</SelectItem>
                                    <SelectItem value="fade">Fade</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Physics</Label>
                            <Select
                                value={config.widgetAnimationType || 'spring'}
                                onValueChange={(value) => handleChange('widgetAnimationType', value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select physics" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="spring">Spring (Bouncy)</SelectItem>
                                    <SelectItem value="tween">Tween (Linear)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <h3 className="text-lg font-medium">Exit Animation</h3>
                <div className="grid gap-3">
                    <div className="space-y-2">
                        <Label>Type</Label>
                        <Select
                            value={config.widgetAnimationExit || 'slide-down'}
                            onValueChange={(value) => handleChange('widgetAnimationExit', value)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select exit animation" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="slide-down">Slide Down</SelectItem>
                                <SelectItem value="slide-side">Slide Side</SelectItem>
                                <SelectItem value="scale">Scale (Pop)</SelectItem>
                                <SelectItem value="fade">Fade</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <Label>Duration ({config.widgetAnimationDuration || 0.3}s)</Label>
                </div>
                <Slider
                    min={0.1}
                    max={2.0}
                    step={0.1}
                    value={[config.widgetAnimationDuration || 0.3]}
                    onValueChange={(value) => handleChange('widgetAnimationDuration', value[0])}
                />
                <p className="text-xs text-muted-foreground">Controls speed of the animation.</p>
            </div>
        </div>
    )
}
