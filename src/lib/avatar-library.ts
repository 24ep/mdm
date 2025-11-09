// Avatar library with default avatars
// Using UI Avatars service for generating avatar images

export interface AvatarOption {
  id: string
  name: string
  url: string
  category: 'people' | 'animals' | 'abstract' | 'characters'
}

// Generate avatar URLs using UI Avatars service
// Format: https://ui-avatars.com/api/?name=Name&background=color&color=fff&size=128

const generateAvatarUrl = (name: string, bgColor: string, textColor: string = 'fff'): string => {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${bgColor}&color=${textColor}&size=128&bold=true`
}

export const AVATAR_LIBRARY: AvatarOption[] = [
  // People avatars with different colors
  { id: 'person-1', name: 'Person 1', url: generateAvatarUrl('Person 1', '3b82f6', 'fff'), category: 'people' },
  { id: 'person-2', name: 'Person 2', url: generateAvatarUrl('Person 2', '10b981', 'fff'), category: 'people' },
  { id: 'person-3', name: 'Person 3', url: generateAvatarUrl('Person 3', 'f59e0b', 'fff'), category: 'people' },
  { id: 'person-4', name: 'Person 4', url: generateAvatarUrl('Person 4', 'ef4444', 'fff'), category: 'people' },
  { id: 'person-5', name: 'Person 5', url: generateAvatarUrl('Person 5', '8b5cf6', 'fff'), category: 'people' },
  { id: 'person-6', name: 'Person 6', url: generateAvatarUrl('Person 6', 'ec4899', 'fff'), category: 'people' },
  { id: 'person-7', name: 'Person 7', url: generateAvatarUrl('Person 7', '06b6d4', 'fff'), category: 'people' },
  { id: 'person-8', name: 'Person 8', url: generateAvatarUrl('Person 8', '14b8a6', 'fff'), category: 'people' },
  { id: 'person-9', name: 'Person 9', url: generateAvatarUrl('Person 9', 'f97316', 'fff'), category: 'people' },
  { id: 'person-10', name: 'Person 10', url: generateAvatarUrl('Person 10', '6366f1', 'fff'), category: 'people' },
  { id: 'person-11', name: 'Person 11', url: generateAvatarUrl('Person 11', '84cc16', 'fff'), category: 'people' },
  { id: 'person-12', name: 'Person 12', url: generateAvatarUrl('Person 12', 'eab308', 'fff'), category: 'people' },
  
  // Abstract/Pattern avatars
  { id: 'abstract-1', name: 'Abstract 1', url: generateAvatarUrl('A', '1e293b', 'fff'), category: 'abstract' },
  { id: 'abstract-2', name: 'Abstract 2', url: generateAvatarUrl('B', '334155', 'fff'), category: 'abstract' },
  { id: 'abstract-3', name: 'Abstract 3', url: generateAvatarUrl('C', '475569', 'fff'), category: 'abstract' },
  { id: 'abstract-4', name: 'Abstract 4', url: generateAvatarUrl('D', '64748b', 'fff'), category: 'abstract' },
  
  // Character-style avatars
  { id: 'char-1', name: 'Character 1', url: generateAvatarUrl('User', '3b82f6', 'fff'), category: 'characters' },
  { id: 'char-2', name: 'Character 2', url: generateAvatarUrl('Admin', '10b981', 'fff'), category: 'characters' },
  { id: 'char-3', name: 'Character 3', url: generateAvatarUrl('Team', 'f59e0b', 'fff'), category: 'characters' },
  { id: 'char-4', name: 'Character 4', url: generateAvatarUrl('Member', 'ef4444', 'fff'), category: 'characters' },
]

export const getAvatarByCategory = (category: AvatarOption['category']): AvatarOption[] => {
  return AVATAR_LIBRARY.filter(avatar => avatar.category === category)
}

export const getAvatarById = (id: string): AvatarOption | undefined => {
  return AVATAR_LIBRARY.find(avatar => avatar.id === id)
}

