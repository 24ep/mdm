export interface Component {
  id: string
  type: string
  x: number
  y: number
  width: number
  height: number
  config: any
  style: any
}

export interface ClipboardData {
  components: Component[]
  timestamp: number
  action: 'copy' | 'cut'
}

class ComponentClipboard {
  private clipboard: ClipboardData | null = null
  private listeners: Array<(data: ClipboardData | null) => void> = []

  copy(components: Component[]): void {
    const copiedComponents = components.map(component => ({
      ...component,
      id: `copy-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }))

    this.clipboard = {
      components: copiedComponents,
      timestamp: Date.now(),
      action: 'copy'
    }

    this.notifyListeners()
  }

  cut(components: Component[]): void {
    const cutComponents = components.map(component => ({
      ...component,
      id: `cut-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }))

    this.clipboard = {
      components: cutComponents,
      timestamp: Date.now(),
      action: 'cut'
    }

    this.notifyListeners()
  }

  paste(offsetX: number = 20, offsetY: number = 20): Component[] {
    if (!this.clipboard) return []

    const pastedComponents = this.clipboard.components.map((component, index) => ({
      ...component,
      id: `paste-${Date.now()}-${index}`,
      x: component.x + offsetX,
      y: component.y + offsetY
    }))

    return pastedComponents
  }

  canPaste(): boolean {
    return this.clipboard !== null
  }

  getClipboardData(): ClipboardData | null {
    return this.clipboard
  }

  clear(): void {
    this.clipboard = null
    this.notifyListeners()
  }

  subscribe(listener: (data: ClipboardData | null) => void): () => void {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener)
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.clipboard))
  }
}

export const componentClipboard = new ComponentClipboard()

export function duplicateComponents(
  components: Component[],
  selectedIds: string[],
  offsetX: number = 20,
  offsetY: number = 20
): Component[] {
  const selectedComponents = components.filter(comp => selectedIds.includes(comp.id))
  
  return selectedComponents.map((component, index) => ({
    ...component,
    id: `duplicate-${Date.now()}-${index}`,
    x: component.x + offsetX,
    y: component.y + offsetY
  }))
}

export function generateUniqueId(prefix: string = 'component'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}
