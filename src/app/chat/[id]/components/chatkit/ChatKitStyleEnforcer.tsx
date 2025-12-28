'use client'

import { useEffect, useRef, useCallback } from 'react'
import { ChatbotConfig } from '../../types'
import { isLightColor } from './themeUtils'
import { loadGoogleFont } from './fontLoader'

interface ChatKitStyleEnforcerProps {
    chatbot: ChatbotConfig
    chatkitOptions?: any
    containerRef?: React.RefObject<HTMLDivElement | null>
    isOpen?: boolean
}

export function ChatKitStyleEnforcer({ chatbot, chatkitOptions, containerRef, isOpen }: ChatKitStyleEnforcerProps) {
    const observerRef = useRef<MutationObserver | null>(null)
    const prevIsOpenRef = useRef(isOpen)
    const applyStylesRef = useRef<() => void>(() => { })

    // Resolve Font Family from new options or legacy prop
    const fontFamily = chatkitOptions?.theme?.typography?.fontFamily || chatbot.fontFamily || 'inherit'

    // Calculate default/configured colors
    const defaultComposerBg = isLightColor((chatbot.messageBoxColor || '#ffffff')) ? '#f3f4f6' : '#374151'
    const defaultComposerFg = isLightColor((chatbot.messageBoxColor || '#ffffff')) ? '#000000' : '#ffffff'
    const composerBg = (chatbot as any).composerBackgroundColor || (chatbot as any).footerInputBgColor || defaultComposerBg
    const composerFg = (chatbot as any).composerFontColor || (chatbot as any).footerInputFontColor || chatbot.fontColor || defaultComposerFg

    const applyStylesToDocument = useCallback(() => {
        const isInputLike = (element: HTMLElement) => {
            const tagName = element.tagName.toLowerCase()
            return (
                tagName === 'input' ||
                tagName === 'textarea' ||
                element.getAttribute('contenteditable') === 'true' ||
                element.getAttribute('role') === 'textbox' ||
                element.hasAttribute('data-slate-editor') ||
                element.hasAttribute('data-lexical-editor') ||
                element.classList.contains('ProseMirror')
            )
        }

        const applyStylesToElement = (element: HTMLElement) => {
            // Apply font family to almost everything if configured
            // This ensures it penetrates Shadow DOM where global CSS might fail
            if (fontFamily !== 'inherit') {
                // Skip known icon elements to prevent breaking them
                if (!element.classList.contains('lucide') && !element.classList.contains('material-icons')) {
                    element.style.setProperty('font-family', fontFamily, 'important')
                }
            }

            // FORCE GRADIENT OVERRIDES
            // ChatKit theme engine only supports hex colors, so we must manually inject gradients

            // 1. Header Background Override
            // Check for common ChatKit header class names or attributes
            // Note: Class names might change, so we try multiple strategies
            if (
                (chatbot as any).headerBgColor &&
                ((chatbot as any).headerBgColor.includes('gradient') || (chatbot as any).headerBgColor.startsWith('url'))
            ) {
                if (
                    element.classList.contains('ck-header') ||
                    element.getAttribute('data-id') === 'ck-header' ||
                    // Fallback: check if it looks like a header (class contains 'Header' and is a div/header)
                    (element.className && typeof element.className === 'string' && element.className.toLowerCase().includes('header') && !element.className.toLowerCase().includes('message'))
                ) {
                    const targetBg = (chatbot as any).headerBgColor
                    const alreadyApplied = element.getAttribute('data-ck-gradient-applied') === targetBg

                    if (!alreadyApplied) {
                        element.style.setProperty('background', targetBg, 'important')
                        element.style.setProperty('background-image', targetBg, 'important') // Force image/gradient
                        element.setAttribute('data-ck-gradient-applied', targetBg)
                    }
                }
            }

            // 2. Widget Button Override (if rendered by ChatKit and not manual wrapper)
            if (
                (chatbot as any).widgetBackgroundColor &&
                ((chatbot as any).widgetBackgroundColor.includes('gradient') || (chatbot as any).widgetBackgroundColor.startsWith('url'))
            ) {
                if (
                    element.classList.contains('ck-widget-button') ||
                    element.getAttribute('data-id') === 'ck-widget-button' ||
                    element.getAttribute('aria-label') === 'Open chat' // Heuristic
                ) {
                    const targetBg = (chatbot as any).widgetBackgroundColor
                    const alreadyApplied = element.getAttribute('data-ck-gradient-applied') === targetBg

                    if (!alreadyApplied) {
                        element.style.setProperty('background', targetBg, 'important')
                        element.setAttribute('data-ck-gradient-applied', targetBg)
                    }
                }
            }


            // Apply special styles for inputs
            if (isInputLike(element)) {
                element.style.setProperty('background-color', composerBg, 'important')
                element.style.setProperty('background', composerBg, 'important')
                element.style.setProperty('background-image', 'none', 'important')
                element.style.setProperty('color', composerFg, 'important')
                element.style.setProperty('-webkit-text-fill-color', composerFg, 'important')
                element.style.setProperty('box-shadow', 'none', 'important')
            }
        }

        const traverseAndApply = (root: Document | ShadowRoot | Element) => {
            try {
                // Query all elements to ensure comprehensive application
                const allElements = root.querySelectorAll('*')
                allElements.forEach(element => {
                    applyStylesToElement(element as HTMLElement)

                    // Recurse into Shadow DOM if present
                    if (element.shadowRoot) {
                        traverseAndApply(element.shadowRoot)
                    }

                    // Recurse into IFrame if present and accessible (same-origin)
                    if (element.tagName.toLowerCase() === 'iframe') {
                        try {
                            const iframe = element as HTMLIFrameElement
                            const iframeDoc = iframe.contentDocument
                            if (iframeDoc) {
                                if (fontFamily !== 'inherit') {
                                    loadGoogleFont(fontFamily, iframeDoc)
                                    iframeDoc.body.style.setProperty('font-family', fontFamily, 'important')
                                }
                                traverseAndApply(iframeDoc)
                            }
                        } catch (e) {
                            // Cross-origin iframe or other access error - ignore
                        }
                    }
                })
            } catch (e) {
                // Ignore selector errors
            }
        }

        const root = containerRef?.current || document
        traverseAndApply(root)

    }, [composerBg, composerFg, fontFamily, containerRef])
    useEffect(() => {
        applyStylesRef.current = applyStylesToDocument
    }, [applyStylesToDocument])

    // Main observation effect
    useEffect(() => {
        applyStylesToDocument()

        observerRef.current = new MutationObserver((mutations) => {
            let shouldApply = false
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) shouldApply = true
                if (mutation.type === 'attributes') shouldApply = true
            })
            if (shouldApply) {
                requestAnimationFrame(() => applyStylesToDocument())
            }
        })

        const targetNode = containerRef?.current || document.body
        if (targetNode) {
            observerRef.current.observe(targetNode, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['class', 'style', 'contenteditable', 'role']
            })
        }

        const t1 = setTimeout(applyStylesToDocument, 500)
        const t2 = setTimeout(applyStylesToDocument, 1500)
        const t3 = setTimeout(applyStylesToDocument, 3000)

        return () => {
            observerRef.current?.disconnect()
            clearTimeout(t1)
            clearTimeout(t2)
            clearTimeout(t3)
        }
    }, [applyStylesToDocument, containerRef])

    // Re-apply on Open (Popover)
    useEffect(() => {
        if (isOpen && !prevIsOpenRef.current) {
            applyStylesRef.current()
            const times = [100, 300, 600, 1000, 2000]
            const timeouts = times.map(t => setTimeout(() => applyStylesRef.current(), t))
            return () => timeouts.forEach(clearTimeout)
        }
        prevIsOpenRef.current = isOpen
    }, [isOpen])

    return null
}
