'use client'

import { useEffect, useRef } from 'react'
import { ChatbotConfig } from '../../types'
import { isLightColor } from './themeUtils'

interface ChatKitStyleEnforcerProps {
    chatbot: ChatbotConfig
    containerRef?: React.RefObject<HTMLDivElement>
}

/**
 * This component uses a MutationObserver to enforce styles on ChatKit elements
 * after they are rendered. This is necessary because ChatKit uses Shadow DOM
 * and inline styles that override our global CSS selectors.
 */
export function ChatKitStyleEnforcer({ chatbot }: ChatKitStyleEnforcerProps) {
    const observerRef = useRef<MutationObserver | null>(null)

    useEffect(() => {
        // Calculate default composer colors based on background contrast
        const defaultComposerBg = isLightColor((chatbot.messageBoxColor || '#ffffff'))
            ? '#f3f4f6' // Light theme: Gray-100 input
            : '#374151' // Dark theme: Gray-700 input

        const defaultComposerFg = isLightColor((chatbot.messageBoxColor || '#ffffff'))
            ? '#000000'
            : '#ffffff'

        const composerBg = (chatbot as any).composerBackgroundColor || (chatbot as any).footerInputBgColor || defaultComposerBg
        const composerFg = (chatbot as any).composerFontColor || (chatbot as any).footerInputFontColor || chatbot.fontColor || defaultComposerFg
        const fontFamily = chatbot.fontFamily || 'inherit'

        // Selectors to target ChatKit composer input elements
        const inputSelectors = [
            'input[type="text"]',
            'input:not([type])',
            'textarea',
            '[contenteditable="true"]',
            '[role="textbox"]',
            '[data-slate-editor]',
            '[data-lexical-editor]',
            '.ProseMirror',
        ]

        const applyStylesToElement = (element: HTMLElement) => {
            // Check if this is an input-like element
            const tagName = element.tagName.toLowerCase()
            const isInput = tagName === 'input' || tagName === 'textarea'
            const isContentEditable = element.getAttribute('contenteditable') === 'true'
            const isTextbox = element.getAttribute('role') === 'textbox'
            const isSlateEditor = element.hasAttribute('data-slate-editor')
            const isLexicalEditor = element.hasAttribute('data-lexical-editor')
            const isProseMirror = element.classList.contains('ProseMirror')

            if (isInput || isContentEditable || isTextbox || isSlateEditor || isLexicalEditor || isProseMirror) {
                // Apply background color
                element.style.setProperty('background-color', composerBg, 'important')
                element.style.setProperty('background', composerBg, 'important')
                element.style.setProperty('background-image', 'none', 'important')

                // Apply font color
                element.style.setProperty('color', composerFg, 'important')
                element.style.setProperty('-webkit-text-fill-color', composerFg, 'important')

                // Apply font family
                if (fontFamily !== 'inherit') {
                    element.style.setProperty('font-family', fontFamily, 'important')
                }

                // Remove any default box-shadow that might hide the background
                element.style.setProperty('box-shadow', 'none', 'important')
            }
        }

        // Recursively traverse DOM including Shadow DOM
        const traverseAndApply = (root: Document | ShadowRoot | Element) => {
            // Query all input-like elements in this root
            inputSelectors.forEach(selector => {
                try {
                    const elements = root.querySelectorAll(selector)
                    elements.forEach(element => {
                        applyStylesToElement(element as HTMLElement)
                    })
                } catch (e) {
                    // Ignore selector errors
                }
            })

            // Find all elements that might have shadow roots
            const allElements = root.querySelectorAll('*')
            allElements.forEach(element => {
                // Check if element has a shadow root
                if (element.shadowRoot) {
                    traverseAndApply(element.shadowRoot)
                }
            })
        }

        const applyStylesToDocument = () => {
            // Start traversal from document
            traverseAndApply(document)

            // Also specifically look for the openai-chatkit web component
            const chatkitElements = document.querySelectorAll('openai-chatkit')
            chatkitElements.forEach(el => {
                if (el.shadowRoot) {
                    traverseAndApply(el.shadowRoot)
                }
            })
        }

        // Apply styles immediately
        applyStylesToDocument()

        // Create MutationObserver to watch for new elements
        observerRef.current = new MutationObserver((mutations) => {
            let shouldApply = false
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    shouldApply = true
                }
                if (mutation.type === 'attributes') {
                    shouldApply = true
                }
            })
            if (shouldApply) {
                // Debounce the style application
                requestAnimationFrame(() => {
                    applyStylesToDocument()
                })
            }
        })

        // Start observing the document body for changes
        observerRef.current.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['class', 'style', 'contenteditable', 'role']
        })

        // Also apply styles with delays to catch late-rendered elements
        const timeoutId = setTimeout(applyStylesToDocument, 500)
        const timeoutId2 = setTimeout(applyStylesToDocument, 1500)
        const timeoutId3 = setTimeout(applyStylesToDocument, 3000)

        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect()
            }
            clearTimeout(timeoutId)
            clearTimeout(timeoutId2)
            clearTimeout(timeoutId3)
        }
    }, [chatbot])

    return null
}

