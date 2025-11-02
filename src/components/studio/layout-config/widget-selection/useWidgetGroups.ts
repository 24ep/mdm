import { useState, useEffect } from 'react'
import { WidgetGroup, WIDGET_GROUPS_STORAGE_KEY } from './types'

export function useWidgetGroups(isOpen: boolean) {
  const [groups, setGroups] = useState<WidgetGroup[]>([])
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())
  
  // Load groups from localStorage
  useEffect(() => {
    if (!isOpen) return
    
    try {
      const stored = localStorage.getItem(WIDGET_GROUPS_STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        setGroups(parsed.groups || [])
        setCollapsedGroups(new Set(parsed.collapsedGroups || []))
      }
    } catch (error) {
      console.error('Failed to load widget groups:', error)
    }
  }, [isOpen])
  
  // Save groups to localStorage
  useEffect(() => {
    if (!isOpen || groups.length === 0) return
    
    try {
      localStorage.setItem(WIDGET_GROUPS_STORAGE_KEY, JSON.stringify({
        groups,
        collapsedGroups: Array.from(collapsedGroups),
      }))
    } catch (error) {
      console.error('Failed to save widget groups:', error)
    }
  }, [groups, collapsedGroups, isOpen])
  
  const toggleGroup = (groupId: string) => {
    setCollapsedGroups(prev => {
      const newSet = new Set(prev)
      if (newSet.has(groupId)) {
        newSet.delete(groupId)
      } else {
        newSet.add(groupId)
      }
      return newSet
    })
  }
  
  const createGroup = (name: string) => {
    const groupId = `group_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
    const newGroup: WidgetGroup = {
      id: groupId,
      name: name.trim(),
      widgetTypes: [],
      collapsed: false,
    }
    
    setGroups(prev => [...prev, newGroup])
    setCollapsedGroups(prev => {
      const newSet = new Set(prev)
      newSet.delete(groupId) // Ensure it's expanded
      return newSet
    })
    
    return groupId
  }
  
  const deleteGroup = (groupId: string) => {
    setGroups(prev => prev.filter(g => g.id !== groupId))
  }
  
  const updateGroupName = (groupId: string, newName: string) => {
    setGroups(prev =>
      prev.map(g =>
        g.id === groupId ? { ...g, name: newName.trim() } : g
      )
    )
  }
  
  const addWidgetToGroup = (widgetType: string, groupId: string) => {
    setGroups(prev =>
      prev.map(g =>
        g.id === groupId
          ? { ...g, widgetTypes: [...g.widgetTypes, widgetType] }
          : g
      )
    )
  }
  
  const removeWidgetFromGroup = (widgetType: string, groupId: string) => {
    setGroups(prev =>
      prev.map(g =>
        g.id === groupId
          ? { ...g, widgetTypes: g.widgetTypes.filter(t => t !== widgetType) }
          : g
      )
    )
  }
  
  return {
    groups,
    collapsedGroups,
    toggleGroup,
    createGroup,
    deleteGroup,
    updateGroupName,
    addWidgetToGroup,
    removeWidgetFromGroup,
    setGroups,
    setCollapsedGroups,
  }
}

