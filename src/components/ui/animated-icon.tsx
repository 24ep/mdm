"use client"

import React from "react"
import { motion, MotionProps, Variants } from "framer-motion"
import * as LucideIcons from "lucide-react"

type IconComponent = React.ComponentType<{ className?: string }>

export interface AnimatedIconProps {
  icon: string | IconComponent
  className?: string
  size?: number
  animation?: 'none' | 'bounce' | 'pulse' | 'spin' | 'wiggle' | 'float' | 'scale' | 'rotate' | 'shake' | 'glow'
  trigger?: 'hover' | 'click' | 'always' | 'mount'
  duration?: number
  delay?: number
  repeat?: boolean | number
  onClick?: () => void
  style?: React.CSSProperties
}

// Animation variants inspired by animate-ui
const animationVariants: Record<string, Variants> = {
  bounce: {
    animate: {
      y: [0, -10, 0],
      transition: {
        duration: 0.6,
        ease: "easeInOut",
        repeat: Infinity,
        repeatType: "reverse" as const
      }
    }
  },
  pulse: {
    animate: {
      scale: [1, 1.1, 1],
      transition: {
        duration: 1,
        ease: "easeInOut",
        repeat: Infinity,
        repeatType: "reverse" as const
      }
    }
  },
  spin: {
    animate: {
      rotate: 360,
      transition: {
        duration: 1,
        ease: "linear",
        repeat: Infinity
      }
    }
  },
  wiggle: {
    animate: {
      rotate: [-10, 10, -10, 10, 0],
      transition: {
        duration: 0.5,
        ease: "easeInOut"
      }
    }
  },
  float: {
    animate: {
      y: [0, -8, 0],
      transition: {
        duration: 2,
        ease: "easeInOut",
        repeat: Infinity,
        repeatType: "reverse" as const
      }
    }
  },
  scale: {
    hover: {
      scale: 1.2,
      transition: {
        duration: 0.2,
        ease: "easeOut"
      }
    },
    tap: {
      scale: 0.9,
      transition: {
        duration: 0.1,
        ease: "easeOut"
      }
    }
  },
  rotate: {
    hover: {
      rotate: 180,
      transition: {
        duration: 0.3,
        ease: "easeInOut"
      }
    }
  },
  shake: {
    animate: {
      x: [-2, 2, -2, 2, 0],
      transition: {
        duration: 0.4,
        ease: "easeInOut"
      }
    }
  },
  glow: {
    hover: {
      filter: "drop-shadow(0 0 8px currentColor)",
      transition: {
        duration: 0.3,
        ease: "easeOut"
      }
    }
  }
}

export function AnimatedIcon({
  icon,
  className = "",
  size = 24,
  animation = 'none',
  trigger = 'hover',
  duration = 0.3,
  delay = 0,
  repeat = false,
  onClick,
  style,
  ...props
}: AnimatedIconProps & Omit<MotionProps, 'children'>) {
  // Get the icon component
  const IconComponent = React.useMemo(() => {
    if (typeof icon === 'string') {
      const Icon = (LucideIcons as any)[icon]
      return Icon || null
    }
    return icon
  }, [icon])

  if (!IconComponent) {
    console.warn(`Icon "${icon}" not found`)
    return null
  }

  // Get animation variants
  const variants = animation !== 'none' ? animationVariants[animation] : {}

  // Configure animation based on trigger
  const motionProps: MotionProps = {
    ...props,
    variants,
    style: {
      width: size,
      height: size,
      ...style
    },
    className: `inline-block ${className}`,
    onClick,
  }

  // Set up animation triggers
  switch (trigger) {
    case 'hover':
      motionProps.whileHover = 'animate'
      break
    case 'click':
      motionProps.whileTap = 'animate'
      break
    case 'always':
      motionProps.animate = 'animate'
      break
    case 'mount':
      motionProps.initial = { opacity: 0, scale: 0 }
      motionProps.animate = { opacity: 1, scale: 1 }
      motionProps.transition = { duration, delay }
      break
  }

  // Handle repeat for always animations
  if (trigger === 'always' && repeat && animation !== 'none') {
    motionProps.transition = {
      duration,
      delay,
      repeat: typeof repeat === 'number' ? repeat : Infinity,
      repeatType: "loop" as const
    }
  }

  return (
    <motion.div {...motionProps}>
      <IconComponent className="w-full h-full" />
    </motion.div>
  )
}

// Preset components for common use cases
export const LoadingIcon = ({ icon, ...props }: Omit<AnimatedIconProps, 'animation' | 'trigger'>) => (
  <AnimatedIcon icon={icon} animation="spin" trigger="always" repeat={true} {...props} />
)

export const HoverIcon = ({ icon, ...props }: Omit<AnimatedIconProps, 'animation' | 'trigger'>) => (
  <AnimatedIcon icon={icon} animation="scale" trigger="hover" {...props} />
)

export const ClickIcon = ({ icon, ...props }: Omit<AnimatedIconProps, 'animation' | 'trigger'>) => (
  <AnimatedIcon icon={icon} animation="scale" trigger="click" {...props} />
)

export const BounceIcon = ({ icon, ...props }: Omit<AnimatedIconProps, 'animation' | 'trigger'>) => (
  <AnimatedIcon icon={icon} animation="bounce" trigger="always" repeat={true} {...props} />
)

export const PulseIcon = ({ icon, ...props }: Omit<AnimatedIconProps, 'animation' | 'trigger'>) => (
  <AnimatedIcon icon={icon} animation="pulse" trigger="always" repeat={true} {...props} />
)

export const FloatIcon = ({ icon, ...props }: Omit<AnimatedIconProps, 'animation' | 'trigger'>) => (
  <AnimatedIcon icon={icon} animation="float" trigger="always" repeat={true} {...props} />
)

export const ShakeIcon = ({ icon, ...props }: Omit<AnimatedIconProps, 'animation' | 'trigger'>) => (
  <AnimatedIcon icon={icon} animation="shake" trigger="always" {...props} />
)

export const GlowIcon = ({ icon, ...props }: Omit<AnimatedIconProps, 'animation' | 'trigger'>) => (
  <AnimatedIcon icon={icon} animation="glow" trigger="hover" {...props} />
)

export default AnimatedIcon
