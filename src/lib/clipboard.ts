/**
 * Clipboard utility with fallback for non-HTTPS environments
 * The Clipboard API requires a secure context (HTTPS or localhost)
 */

/**
 * Copy text to clipboard with fallback for HTTP contexts
 * @param text The text to copy to clipboard
 * @returns Promise that resolves when copy is complete
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  // Try the modern Clipboard API first (requires HTTPS)
  if (navigator?.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch (error) {
      console.warn('Clipboard API failed, trying fallback:', error)
    }
  }

  // Fallback for HTTP contexts using execCommand (deprecated but widely supported)
  try {
    const textArea = document.createElement('textarea')
    textArea.value = text
    
    // Make the textarea invisible
    textArea.style.position = 'fixed'
    textArea.style.left = '-999999px'
    textArea.style.top = '-999999px'
    textArea.style.opacity = '0'
    
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()
    
    const successful = document.execCommand('copy')
    document.body.removeChild(textArea)
    
    if (successful) {
      return true
    }
  } catch (error) {
    console.error('Fallback clipboard copy failed:', error)
  }

  return false
}

/**
 * Read text from clipboard with fallback
 * @returns Promise that resolves with clipboard text or null
 */
export async function readFromClipboard(): Promise<string | null> {
  // Try the modern Clipboard API first
  if (navigator?.clipboard?.readText) {
    try {
      return await navigator.clipboard.readText()
    } catch (error) {
      console.warn('Clipboard read failed:', error)
    }
  }
  
  return null
}

/**
 * Alias for readFromClipboard
 */
export const pasteFromClipboard = readFromClipboard
