export interface KnowledgeCollection {
  id: string
  name: string
  description?: string
  icon?: string
  color?: string
  isPrivate: boolean
  spaceId?: string
  createdBy: string
  creator?: {
    id: string
    name: string
    email: string
    avatar?: string
  }
  documentCount?: number
  memberCount?: number
  createdAt: Date
  updatedAt: Date
}

export interface KnowledgeCollectionMember {
  id: string
  role: 'viewer' | 'editor' | 'admin'
  user: {
    id: string
    name: string
    email: string
    avatar?: string
  }
  createdAt: Date
}

export interface KnowledgeDocument {
  id: string
  collectionId: string
  title: string
  content: string
  contentHtml?: string
  parentId?: string
  isTemplate: boolean
  isPublic: boolean
  isPinned: boolean
  publishedAt?: Date
  archivedAt?: Date
  order: number
  createdBy: string
  updatedBy?: string
  creator?: {
    id: string
    name: string
    email: string
    avatar?: string
  }
  updater?: {
    id: string
    name: string
    email: string
    avatar?: string
  }
  childCount?: number
  children?: KnowledgeDocument[]
  createdAt: Date
  updatedAt: Date
}

export interface KnowledgeComment {
  id: string
  documentId: string
  parentId?: string
  content: string
  contentHtml?: string
  resolvedAt?: Date
  resolvedBy?: string
  createdBy: string
  creator?: {
    id: string
    name: string
    email: string
    avatar?: string
  }
  resolver?: {
    id: string
    name: string
    email: string
    avatar?: string
  }
  replies?: KnowledgeComment[]
  createdAt: Date
  updatedAt: Date
}

export interface KnowledgeShare {
  id: string
  documentId?: string
  collectionId?: string
  userId?: string
  teamId?: string
  permission: 'read' | 'write' | 'admin'
  publicLink?: string
  expiresAt?: Date
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

export interface KnowledgeDocumentVersion {
  id: string
  documentId: string
  title: string
  content: string
  contentHtml?: string
  createdBy: string
  creator?: {
    id: string
    name: string
    email: string
    avatar?: string
  }
  createdAt: Date
}

export interface KnowledgePresence {
  id: string
  documentId: string
  userId: string
  user?: {
    id: string
    name: string
    email: string
    avatar?: string
  }
  cursor?: {
    line: number
    ch: number
  }
  selection?: {
    from: { line: number; ch: number }
    to: { line: number; ch: number }
  }
  lastSeen: Date
}

