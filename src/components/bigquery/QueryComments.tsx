'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MessageSquare, Plus, X, Edit, Trash2, User } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { formatTimeAgo } from '@/lib/date-formatters'
import { showSuccess, showError, ToastMessages } from '@/lib/toast-utils'

interface QueryComment {
  id: string
  content: string
  author: string
  authorId?: string
  createdAt: Date
  updatedAt?: Date
  lineNumber?: number
  resolved?: boolean
}

interface QueryCommentsProps {
  query: string
  queryId?: string
  isOpen: boolean
  onClose: () => void
  comments?: QueryComment[]
  onAddComment?: (comment: Omit<QueryComment, 'id' | 'createdAt'>) => void
  onUpdateComment?: (commentId: string, content: string) => void
  onDeleteComment?: (commentId: string) => void
  currentUser?: {
    id: string
    name: string
    email: string
  }
}

export function QueryComments({
  query,
  queryId,
  isOpen,
  onClose,
  comments = [],
  onAddComment,
  onUpdateComment,
  onDeleteComment,
  currentUser
}: QueryCommentsProps) {
  const [newComment, setNewComment] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [selectedLine, setSelectedLine] = useState<number | null>(null)

  // Get line numbers from query
  const lineCount = query.split('\n').length

  const handleAddComment = () => {
    if (!newComment.trim()) {
      showError('Validation error')
      return
    }

    const comment: Omit<QueryComment, 'id' | 'createdAt'> = {
      content: newComment,
      author: currentUser?.name || 'Anonymous',
      authorId: currentUser?.id,
      lineNumber: selectedLine || undefined,
      resolved: false
    }

    if (onAddComment) {
      onAddComment(comment)
    }

    setNewComment('')
    setSelectedLine(null)
    showSuccess('Comment added')
  }

  const handleUpdateComment = (commentId: string) => {
    if (!editContent.trim()) {
      showError('Validation error')
      return
    }

    if (onUpdateComment) {
      onUpdateComment(commentId, editContent)
    }

    setEditingId(null)
    setEditContent('')
    showSuccess(ToastMessages.UPDATED)
  }

  const handleDeleteComment = (commentId: string) => {
    if (confirm('Are you sure you want to delete this comment?')) {
      if (onDeleteComment) {
        onDeleteComment(commentId)
      }
      showSuccess(ToastMessages.DELETED)
    }
  }

  const startEdit = (comment: QueryComment) => {
    setEditingId(comment.id)
    setEditContent(comment.content)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditContent('')
  }

  const getCommentsByLine = () => {
    const grouped: { [line: number]: QueryComment[] } = {}
    comments.forEach(comment => {
      if (comment.lineNumber) {
        if (!grouped[comment.lineNumber]) {
          grouped[comment.lineNumber] = []
        }
        grouped[comment.lineNumber].push(comment)
      }
    })
    return grouped
  }

  const generalComments = comments.filter(c => !c.lineNumber)
  const lineComments = getCommentsByLine()

  return (
    <div className={`fixed right-0 top-0 h-full w-96 bg-background border-l border-border shadow-lg z-50 transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            <h3 className="font-semibold">Comments & Notes</h3>
            {comments.length > 0 && (
              <Badge variant="secondary">{comments.length}</Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Add Comment Section */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Add Comment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-xs">Line Number (Optional)</Label>
                <Input
                  type="number"
                  min="1"
                  max={lineCount}
                  placeholder="Leave empty for general comment"
                  value={selectedLine || ''}
                  onChange={(e) => setSelectedLine(e.target.value ? parseInt(e.target.value) : null)}
                  className="h-8 text-sm"
                />
              </div>
              <Textarea
                placeholder="Add a comment or note about this query..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={3}
                className="text-sm"
              />
              <Button
                size="sm"
                onClick={handleAddComment}
                disabled={!newComment.trim()}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Comment
              </Button>
            </CardContent>
          </Card>

          {/* General Comments */}
          {generalComments.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">General Comments</h4>
              {generalComments.map(comment => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  isEditing={editingId === comment.id}
                  editContent={editContent}
                  onEditContentChange={setEditContent}
                  onStartEdit={() => startEdit(comment)}
                  onSaveEdit={() => handleUpdateComment(comment.id)}
                  onCancelEdit={cancelEdit}
                  onDelete={() => handleDeleteComment(comment.id)}
                  canEdit={currentUser?.id === comment.authorId}
                />
              ))}
            </div>
          )}

          {/* Line-specific Comments */}
          {Object.keys(lineComments).length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">Line Comments</h4>
              {Object.entries(lineComments)
                .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
                .map(([line, comments]) => (
                  <div key={line} className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="text-xs">
                        Line {line}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {comments.length} {comments.length === 1 ? 'comment' : 'comments'}
                      </span>
                    </div>
                    {comments.map(comment => (
                      <CommentItem
                        key={comment.id}
                        comment={comment}
                        isEditing={editingId === comment.id}
                        editContent={editContent}
                        onEditContentChange={setEditContent}
                        onStartEdit={() => startEdit(comment)}
                        onSaveEdit={() => handleUpdateComment(comment.id)}
                        onCancelEdit={cancelEdit}
                        onDelete={() => handleDeleteComment(comment.id)}
                        canEdit={currentUser?.id === comment.authorId}
                      />
                    ))}
                  </div>
                ))}
            </div>
          )}

          {comments.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No comments yet</p>
              <p className="text-xs mt-1">Add the first comment above</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

interface CommentItemProps {
  comment: QueryComment
  isEditing: boolean
  editContent: string
  onEditContentChange: (content: string) => void
  onStartEdit: () => void
  onSaveEdit: () => void
  onCancelEdit: () => void
  onDelete: () => void
  canEdit: boolean
}

function CommentItem({
  comment,
  isEditing,
  editContent,
  onEditContentChange,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onDelete,
  canEdit
}: CommentItemProps) {
  return (
    <Card className="mb-2">
      <CardContent className="p-3">
        {isEditing ? (
          <div className="space-y-2">
            <Textarea
              value={editContent}
              onChange={(e) => onEditContentChange(e.target.value)}
              rows={3}
              className="text-sm"
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={onSaveEdit} className="flex-1">
                Save
              </Button>
              <Button size="sm" variant="outline" onClick={onCancelEdit} className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs font-medium">{comment.author}</span>
                <span className="text-xs text-muted-foreground">
                  {formatTimeAgo(new Date(comment.createdAt))}
                </span>
              </div>
              {canEdit && (
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={onStartEdit}
                    className="h-6 w-6 p-0"
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={onDelete}
                    className="h-6 w-6 p-0 text-red-600"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
            <p className="text-sm text-foreground whitespace-pre-wrap">{comment.content}</p>
          </>
        )}
      </CardContent>
    </Card>
  )
}

