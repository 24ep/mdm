export interface Component {
  id: string
  x: number
  y: number
  width: number
  height: number
}

export type AlignmentType = 
  | 'left' 
  | 'center' 
  | 'right' 
  | 'top' 
  | 'middle' 
  | 'bottom'

export type DistributionType = 
  | 'horizontal' 
  | 'vertical' 
  | 'both'

export function alignComponents(
  components: Component[], 
  alignment: AlignmentType,
  containerWidth: number = 1200,
  containerHeight: number = 800
): Component[] {
  if (components.length === 0) return components

  const selectedComponents = components.filter(comp => comp.id) // Assuming selected components have some property
  if (selectedComponents.length === 0) return components

  const bounds = getComponentBounds(selectedComponents)
  
  return components.map(component => {
    if (!selectedComponents.find(comp => comp.id === component.id)) {
      return component
    }

    let newX = component.x
    let newY = component.y

    switch (alignment) {
      case 'left':
        newX = bounds.minX
        break
      case 'right':
        newX = bounds.maxX - component.width
        break
      case 'center':
        newX = bounds.minX + (bounds.maxX - bounds.minX) / 2 - component.width / 2
        break
      case 'top':
        newY = bounds.minY
        break
      case 'bottom':
        newY = bounds.maxY - component.height
        break
      case 'middle':
        newY = bounds.minY + (bounds.maxY - bounds.minY) / 2 - component.height / 2
        break
    }

    return {
      ...component,
      x: Math.max(0, newX),
      y: Math.max(0, newY)
    }
  })
}

export function distributeComponents(
  components: Component[],
  distribution: DistributionType
): Component[] {
  if (components.length < 3) return components

  const selectedComponents = components.filter(comp => comp.id) // Assuming selected components
  if (selectedComponents.length < 3) return components

  const sortedComponents = [...selectedComponents].sort((a, b) => {
    if (distribution === 'horizontal' || distribution === 'both') {
      return a.x - b.x
    } else {
      return a.y - b.y
    }
  })

  const bounds = getComponentBounds(sortedComponents)
  
  return components.map(component => {
    const componentIndex = sortedComponents.findIndex(comp => comp.id === component.id)
    if (componentIndex === -1) return component

    let newX = component.x
    let newY = component.y

    if (distribution === 'horizontal' || distribution === 'both') {
      if (sortedComponents.length > 1) {
        const totalWidth = bounds.maxX - bounds.minX
        const spacing = totalWidth / (sortedComponents.length - 1)
        newX = bounds.minX + (spacing * componentIndex)
      }
    }

    if (distribution === 'vertical' || distribution === 'both') {
      if (sortedComponents.length > 1) {
        const totalHeight = bounds.maxY - bounds.minY
        const spacing = totalHeight / (sortedComponents.length - 1)
        newY = bounds.minY + (spacing * componentIndex)
      }
    }

    return {
      ...component,
      x: Math.max(0, newX),
      y: Math.max(0, newY)
    }
  })
}

export function getComponentBounds(components: Component[]) {
  if (components.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0 }
  }

  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity

  components.forEach(component => {
    minX = Math.min(minX, component.x)
    minY = Math.min(minY, component.y)
    maxX = Math.max(maxX, component.x + component.width)
    maxY = Math.max(maxY, component.y + component.height)
  })

  return { minX, minY, maxX, maxY }
}

export function snapToGrid(
  components: Component[],
  gridSize: number
): Component[] {
  return components.map(component => ({
    ...component,
    x: Math.round(component.x / gridSize) * gridSize,
    y: Math.round(component.y / gridSize) * gridSize,
    width: Math.round(component.width / gridSize) * gridSize,
    height: Math.round(component.height / gridSize) * gridSize
  }))
}

export function getAlignmentGuides(
  components: Component[],
  targetComponent: Component,
  gridSize: number = 20
): Array<{ type: 'vertical' | 'horizontal', position: number, label?: string }> {
  const guides: Array<{ type: 'vertical' | 'horizontal', position: number, label?: string }> = []
  
  // Add grid guides
  for (let i = 0; i <= 1200; i += gridSize) {
    guides.push({ type: 'vertical', position: i })
  }
  for (let i = 0; i <= 800; i += gridSize) {
    guides.push({ type: 'horizontal', position: i })
  }

  // Add component alignment guides
  components.forEach(component => {
    if (component.id === targetComponent.id) return

    // Vertical guides
    guides.push({ type: 'vertical', position: component.x, label: 'Left' })
    guides.push({ type: 'vertical', position: component.x + component.width, label: 'Right' })
    guides.push({ type: 'vertical', position: component.x + component.width / 2, label: 'Center' })

    // Horizontal guides
    guides.push({ type: 'horizontal', position: component.y, label: 'Top' })
    guides.push({ type: 'horizontal', position: component.y + component.height, label: 'Bottom' })
    guides.push({ type: 'horizontal', position: component.y + component.height / 2, label: 'Middle' })
  })

  return guides
}
