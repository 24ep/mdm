'use client'

import { useState, useEffect, useRef } from 'react'

interface TypingTextProps {
  text: string
  speed?: number // Characters per second (default: 30)
  className?: string
  style?: React.CSSProperties
  onComplete?: () => void
}

export function TypingText({ 
  text, 
  speed = 30, 
  className = '', 
  style,
  onComplete 
}: TypingTextProps) {
  const [displayedText, setDisplayedText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const previousTextRef = useRef('')
  const currentIndexRef = useRef(0)

  useEffect(() => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }

    // If text was reset or completely changed, reset immediately
    if (text.length < previousTextRef.current.length || 
        !text.startsWith(previousTextRef.current)) {
      setDisplayedText('')
      currentIndexRef.current = 0
    }

    previousTextRef.current = text

    // Start or continue typing animation
    const delay = 1000 / speed // Milliseconds per character

    const typeNextChar = () => {
      const currentIndex = currentIndexRef.current

      if (currentIndex < text.length) {
        setDisplayedText(text.substring(0, currentIndex + 1))
        currentIndexRef.current = currentIndex + 1
        setIsTyping(true)
        timeoutRef.current = setTimeout(typeNextChar, delay)
      } else {
        setIsTyping(false)
        if (onComplete) {
          onComplete()
        }
      }
    }

    // Start typing if we're behind the target text
    if (currentIndexRef.current < text.length) {
      typeNextChar()
    } else {
      // If we're already at the end, just update displayed text in case it changed
      setDisplayedText(text)
      setIsTyping(false)
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }
  }, [text, speed, onComplete])

  return (
    <span className={className} style={style}>
      {displayedText}
      {isTyping && (
        <span 
          className="inline-block w-0.5 h-4 ml-0.5 animate-pulse"
          style={{ 
            backgroundColor: 'currentColor',
            verticalAlign: 'baseline',
            opacity: 0.8,
          }}
        />
      )}
    </span>
  )
}

