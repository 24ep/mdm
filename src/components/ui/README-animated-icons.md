# Animated Icons System

A comprehensive animated icon system built with Framer Motion and Lucide React icons, inspired by [animate-ui.com](https://animate-ui.com/docs/icons).

## Features

- 🎨 **10+ Animation Types**: Bounce, pulse, spin, wiggle, float, scale, rotate, shake, glow, and more
- 🎯 **4 Trigger Types**: Hover, click, always, and mount animations
- 🚀 **Preset Components**: Ready-to-use components for common UI patterns
- 🔧 **Customizable**: Full control over duration, delay, and repeat settings
- 📱 **Responsive**: Works seamlessly across all device sizes
- ♿ **Accessible**: Respects user motion preferences

## Quick Start

### Basic Usage

```tsx
import { AnimatedIcon } from '@/components/ui/animated-icon'

<AnimatedIcon 
  icon="Heart" 
  size={24} 
  animation="bounce" 
  trigger="hover" 
/>
```

### Preset Components

```tsx
import { LoadingIcon, HoverIcon, BounceIcon } from '@/components/ui/animated-icon'

<LoadingIcon icon="Loader2" size={20} />
<HoverIcon icon="Heart" size={24} />
<BounceIcon icon="Bell" size={20} />
```

## Animation Types

| Animation | Description | Best For |
|-----------|-------------|----------|
| `bounce` | Bouncing up and down | Attention-grabbing elements |
| `pulse` | Scaling in and out | Loading states, notifications |
| `spin` | Continuous rotation | Loading spinners |
| `wiggle` | Quick rotation shake | Errors, warnings |
| `float` | Gentle up and down movement | Subtle animations |
| `scale` | Scale on hover/click | Interactive buttons |
| `rotate` | 180° rotation on hover | Toggle states |
| `shake` | Horizontal shake | Errors, invalid actions |
| `glow` | Glow effect on hover | Special effects |

## Trigger Types

| Trigger | Description | Use Case |
|---------|-------------|----------|
| `hover` | Animate on mouse hover | Interactive elements |
| `click` | Animate on click/tap | Button feedback |
| `always` | Continuous animation | Loading states, status indicators |
| `mount` | Animate on component mount | Page transitions, notifications |

## API Reference

### AnimatedIcon Props

```tsx
interface AnimatedIconProps {
  icon: string | IconComponent        // Icon name or component
  className?: string                 // CSS classes
  size?: number                     // Icon size (default: 24)
  animation?: AnimationType         // Animation type
  trigger?: TriggerType             // Animation trigger
  duration?: number                 // Animation duration (default: 0.3)
  delay?: number                    // Animation delay (default: 0)
  repeat?: boolean | number         // Repeat animation
  onClick?: () => void              // Click handler
  style?: React.CSSProperties       // Inline styles
}
```

### Animation Types

```tsx
type AnimationType = 
  | 'none' | 'bounce' | 'pulse' | 'spin' | 'wiggle' 
  | 'float' | 'scale' | 'rotate' | 'shake' | 'glow'
```

### Trigger Types

```tsx
type TriggerType = 'hover' | 'click' | 'always' | 'mount'
```

## Preset Components

### UI State Icons

```tsx
import { 
  LoadingSpinner, 
  SuccessIcon, 
  ErrorIcon, 
  WarningIcon 
} from '@/components/ui/animated-icon-presets'

<LoadingSpinner size={20} />
<SuccessIcon size={20} />
<ErrorIcon size={20} />
<WarningIcon size={20} />
```

### Interactive Buttons

```tsx
import { 
  LikeButton, 
  StarButton, 
  BookmarkButton 
} from '@/components/ui/animated-icon-presets'

<LikeButton liked={true} size={20} />
<StarButton starred={false} size={20} />
<BookmarkButton bookmarked={true} size={20} />
```

### Navigation Icons

```tsx
import { 
  BackIcon, 
  ForwardIcon, 
  MenuIcon, 
  CloseIcon 
} from '@/components/ui/animated-icon-presets'

<BackIcon size={20} />
<ForwardIcon size={20} />
<MenuIcon size={20} />
<CloseIcon size={20} />
```

### Action Icons

```tsx
import { 
  DownloadIcon, 
  UploadIcon, 
  CopyIcon, 
  ShareIcon, 
  EditIcon, 
  DeleteIcon 
} from '@/components/ui/animated-icon-presets'

<DownloadIcon size={20} />
<UploadIcon size={20} />
<CopyIcon size={20} />
<ShareIcon size={20} />
<EditIcon size={20} />
<DeleteIcon size={20} />
```

### Communication Icons

```tsx
import { 
  MessageIcon, 
  BellIcon, 
  MailIcon 
} from '@/components/ui/animated-icon-presets'

<MessageIcon hasNotification={true} size={20} />
<BellIcon hasNotification={false} size={20} />
<MailIcon hasUnread={true} size={20} />
```

### Status Indicators

```tsx
import { 
  OnlineIcon, 
  OfflineIcon, 
  BusyIcon 
} from '@/components/ui/animated-icon-presets'

<OnlineIcon size={20} />
<OfflineIcon size={20} />
<BusyIcon size={20} />
```

## Examples

### Custom Animation with Parameters

```tsx
<AnimatedIcon 
  icon="Star" 
  size={32} 
  animation="rotate" 
  trigger="click"
  duration={0.5}
  delay={0.1}
  repeat={3}
  className="text-yellow-500"
/>
```

### Loading State

```tsx
<AnimatedIcon 
  icon="Loader2" 
  size={20} 
  animation="spin" 
  trigger="always" 
  repeat={true}
  className="text-blue-500"
/>
```

### Hover Effect

```tsx
<AnimatedIcon 
  icon="Heart" 
  size={24} 
  animation="scale" 
  trigger="hover"
  className="text-red-500"
/>
```

### Mount Animation

```tsx
<AnimatedIcon 
  icon="CheckCircle" 
  size={20} 
  animation="scale" 
  trigger="mount"
  duration={0.5}
  className="text-green-500"
/>
```

## Integration with IconPicker

The IconPicker component now supports animated icons:

```tsx
import { IconPicker } from '@/components/ui/icon-picker'

<IconPicker
  value={selectedIcon}
  onChange={setSelectedIcon}
  animated={true}
  animation="scale"
  placeholder="Search icons..."
/>
```

## Demo Page

Visit `/animated-icons` to see all animations in action with interactive controls.

## Performance Tips

1. **Use `trigger="hover"` or `trigger="click"`** for better performance than `trigger="always"`
2. **Limit the number of always-animating icons** on a single page
3. **Use `repeat={false}`** for one-time animations
4. **Consider using CSS transitions** for simple hover effects

## Accessibility

The animated icons respect user motion preferences through Framer Motion's built-in accessibility features. Users with `prefers-reduced-motion` will see static icons instead of animations.

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## Dependencies

- `framer-motion`: ^10.16.16
- `lucide-react`: ^0.303.0
- `react`: ^18
- `react-dom`: ^18
