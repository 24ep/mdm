"use client"

import React from "react"
import { AnimatedIcon } from "./animated-icon"

// Common UI state icons
export const LoadingSpinner = ({ size = 20, className = "" }: { size?: number; className?: string }) => (
  <AnimatedIcon 
    icon="Loader2" 
    size={size} 
    animation="spin" 
    trigger="always" 
    repeat={true}
    className={className}
  />
)

export const SuccessIcon = ({ size = 20, className = "" }: { size?: number; className?: string }) => (
  <AnimatedIcon 
    icon="CheckCircle" 
    size={size} 
    animation="scale" 
    trigger="mount"
    className={`text-green-500 ${className}`}
  />
)

export const ErrorIcon = ({ size = 20, className = "" }: { size?: number; className?: string }) => (
  <AnimatedIcon 
    icon="XCircle" 
    size={size} 
    animation="shake" 
    trigger="mount"
    className={`text-red-500 ${className}`}
  />
)

export const WarningIcon = ({ size = 20, className = "" }: { size?: number; className?: string }) => (
  <AnimatedIcon 
    icon="AlertTriangle" 
    size={size} 
    animation="wiggle" 
    trigger="mount"
    className={`text-yellow-500 ${className}`}
  />
)

// Interactive button icons
export const LikeButton = ({ liked = false, size = 20, className = "" }: { liked?: boolean; size?: number; className?: string }) => (
  <AnimatedIcon 
    icon={liked ? "Heart" : "Heart"} 
    size={size} 
    animation={liked ? "pulse" : "scale"} 
    trigger="click"
    className={`${liked ? "text-red-500" : "text-gray-400"} ${className}`}
  />
)

export const StarButton = ({ starred = false, size = 20, className = "" }: { starred?: boolean; size?: number; className?: string }) => (
  <AnimatedIcon 
    icon={starred ? "Star" : "Star"} 
    size={size} 
    animation={starred ? "bounce" : "scale"} 
    trigger="click"
    className={`${starred ? "text-yellow-500" : "text-gray-400"} ${className}`}
  />
)

export const BookmarkButton = ({ bookmarked = false, size = 20, className = "" }: { bookmarked?: boolean; size?: number; className?: string }) => (
  <AnimatedIcon 
    icon={bookmarked ? "Bookmark" : "Bookmark"} 
    size={size} 
    animation="rotate" 
    trigger="click"
    className={`${bookmarked ? "text-blue-500" : "text-gray-400"} ${className}`}
  />
)

// Navigation icons
export const BackIcon = ({ size = 20, className = "" }: { size?: number; className?: string }) => (
  <AnimatedIcon 
    icon="ArrowLeft" 
    size={size} 
    animation="scale" 
    trigger="hover"
    className={className}
  />
)

export const ForwardIcon = ({ size = 20, className = "" }: { size?: number; className?: string }) => (
  <AnimatedIcon 
    icon="ArrowRight" 
    size={size} 
    animation="scale" 
    trigger="hover"
    className={className}
  />
)

export const MenuIcon = ({ size = 20, className = "" }: { size?: number; className?: string }) => (
  <AnimatedIcon 
    icon="Menu" 
    size={size} 
    animation="scale" 
    trigger="hover"
    className={className}
  />
)

export const CloseIcon = ({ size = 20, className = "" }: { size?: number; className?: string }) => (
  <AnimatedIcon 
    icon="X" 
    size={size} 
    animation="rotate" 
    trigger="hover"
    className={className}
  />
)

// Action icons
export const DownloadIcon = ({ size = 20, className = "" }: { size?: number; className?: string }) => (
  <AnimatedIcon 
    icon="Download" 
    size={size} 
    animation="float" 
    trigger="hover"
    className={className}
  />
)

export const UploadIcon = ({ size = 20, className = "" }: { size?: number; className?: string }) => (
  <AnimatedIcon 
    icon="Upload" 
    size={size} 
    animation="float" 
    trigger="hover"
    className={className}
  />
)

export const CopyIcon = ({ size = 20, className = "" }: { size?: number; className?: string }) => (
  <AnimatedIcon 
    icon="Copy" 
    size={size} 
    animation="scale" 
    trigger="click"
    className={className}
  />
)

export const ShareIcon = ({ size = 20, className = "" }: { size?: number; className?: string }) => (
  <AnimatedIcon 
    icon="Share" 
    size={size} 
    animation="scale" 
    trigger="hover"
    className={className}
  />
)

export const EditIcon = ({ size = 20, className = "" }: { size?: number; className?: string }) => (
  <AnimatedIcon 
    icon="Edit" 
    size={size} 
    animation="scale" 
    trigger="hover"
    className={className}
  />
)

export const DeleteIcon = ({ size = 20, className = "" }: { size?: number; className?: string }) => (
  <AnimatedIcon 
    icon="Trash2" 
    size={size} 
    animation="shake" 
    trigger="hover"
    className={`text-red-500 ${className}`}
  />
)

// Communication icons
export const MessageIcon = ({ hasNotification = false, size = 20, className = "" }: { hasNotification?: boolean; size?: number; className?: string }) => (
  <AnimatedIcon 
    icon="MessageCircle" 
    size={size} 
    animation={hasNotification ? "pulse" : "scale"} 
    trigger="hover"
    className={`${hasNotification ? "text-blue-500" : ""} ${className}`}
  />
)

export const BellIcon = ({ hasNotification = false, size = 20, className = "" }: { hasNotification?: boolean; size?: number; className?: string }) => (
  <AnimatedIcon 
    icon="Bell" 
    size={size} 
    animation={hasNotification ? "shake" : "scale"} 
    trigger="hover"
    className={`${hasNotification ? "text-red-500" : ""} ${className}`}
  />
)

export const MailIcon = ({ hasUnread = false, size = 20, className = "" }: { hasUnread?: boolean; size?: number; className?: string }) => (
  <AnimatedIcon 
    icon="Mail" 
    size={size} 
    animation={hasUnread ? "bounce" : "scale"} 
    trigger="hover"
    className={`${hasUnread ? "text-blue-500" : ""} ${className}`}
  />
)

// Media icons
export const PlayIcon = ({ size = 20, className = "" }: { size?: number; className?: string }) => (
  <AnimatedIcon 
    icon="Play" 
    size={size} 
    animation="scale" 
    trigger="hover"
    className={className}
  />
)

export const PauseIcon = ({ size = 20, className = "" }: { size?: number; className?: string }) => (
  <AnimatedIcon 
    icon="Pause" 
    size={size} 
    animation="scale" 
    trigger="hover"
    className={className}
  />
)

export const VolumeIcon = ({ muted = false, size = 20, className = "" }: { muted?: boolean; size?: number; className?: string }) => (
  <AnimatedIcon 
    icon={muted ? "VolumeX" : "Volume2"} 
    size={size} 
    animation="scale" 
    trigger="hover"
    className={className}
  />
)

// Status indicators
export const OnlineIcon = ({ size = 20, className = "" }: { size?: number; className?: string }) => (
  <AnimatedIcon 
    icon="Circle" 
    size={size} 
    animation="pulse" 
    trigger="always" 
    repeat={true}
    className={`text-green-500 ${className}`}
  />
)

export const OfflineIcon = ({ size = 20, className = "" }: { size?: number; className?: string }) => (
  <AnimatedIcon 
    icon="Circle" 
    size={size} 
    animation="none" 
    trigger="always"
    className={`text-gray-400 ${className}`}
  />
)

export const BusyIcon = ({ size = 20, className = "" }: { size?: number; className?: string }) => (
  <AnimatedIcon 
    icon="Circle" 
    size={size} 
    animation="pulse" 
    trigger="always" 
    repeat={true}
    className={`text-red-500 ${className}`}
  />
)

// Special effects
export const MagicIcon = ({ size = 20, className = "" }: { size?: number; className?: string }) => (
  <AnimatedIcon 
    icon="Sparkles" 
    size={size} 
    animation="glow" 
    trigger="hover"
    className={`text-purple-500 ${className}`}
  />
)

export const FireIcon = ({ size = 20, className = "" }: { size?: number; className?: string }) => (
  <AnimatedIcon 
    icon="Flame" 
    size={size} 
    animation="float" 
    trigger="always" 
    repeat={true}
    className={`text-orange-500 ${className}`}
  />
)

export const LightningIcon = ({ size = 20, className = "" }: { size?: number; className?: string }) => (
  <AnimatedIcon 
    icon="Zap" 
    size={size} 
    animation="glow" 
    trigger="hover"
    className={`text-yellow-400 ${className}`}
  />
)
