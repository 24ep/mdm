'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  MessageSquare,
  Send,
  Check,
  X,
  Reply,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'
import { KnowledgeComment, KnowledgeDocument } from '../types'
import { useDebounce } from '@/shared/hooks/useDebounce'

interface OutlineCommentsPanelProps {
  document: KnowledgeDocument
  onClose: () => void
}

export function OutlineCommentsPanel({ document, onClose }: OutlineCommentsPanelProps) {
  const { data: session } = useSession()
  const [comments, setComments] = useState<KnowledgeComment[]>([])
  const [loading, setLoading] = useState(true)
  const [newComment, setNewComment] = useState('')
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState('')

  useEffect(() => {
    fetchComments()
  }, [document.id])

  const fetchComments = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/knowledge/documents/${document.id}/comments`)
      if (response.ok) {
        const data = await response.json()
        setComments(data.comments || [])
      }
    } catch (error) {
      console.error('Error fetching comments:', error)
      toast.error('Failed to load comments')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateComment = async (parentId?: string) => {
    const content = parentId ? replyContent : newComment
    if (!content.trim()) return

    try {
      const response = await fetch(`/api/knowledge/documents/${document.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: content.trim(),
          parentId: parentId || undefined,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create comment')
      }

      toast.success(parentId ? 'Reply added' : 'Comment added')
      if (parentId) {
        setReplyContent('')
        setReplyingTo(null)
      } else {
        setNewComment('')
      }
      await fetchComments()
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const handleResolveComment = async (commentId: string) => {
    try {
      const response = await fetch(
        `/api/knowledge/documents/${document.id}/comments/${commentId}/resolve`,
        { method: 'POST' }
      )
      if (response.ok) {
        toast.success('Comment resolved')
        await fetchComments()
      } else {
        throw new Error('Failed to resolve comment')
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to resolve comment')
    }
  }

  return (
    <div className="w-80 border-l border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex flex-col h-full">
      <div className="border-b border-gray-200 dark:border-gray-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          <h3 className="font-semibold text-gray-900 dark:text-white">Comments</h3>
          <Badge variant="secondary" className="ml-2">
            {comments.length}
          </Badge>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {loading ? (
            <div className="text-center text-gray-500 dark:text-gray-400 py-8">
              Loading comments...
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center text-gray-500 dark:text-gray-400 py-8">
              No comments yet
            </div>
          ) : (
            comments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                onReply={() => setReplyingTo(comment.id)}
                onResolve={() => handleResolveComment(comment.id)}
                replyingTo={replyingTo === comment.id}
                replyContent={replyContent}
                onReplyContentChange={setReplyContent}
                onSubmitReply={() => handleCreateComment(comment.id)}
                onCancelReply={() => {
                  setReplyingTo(null)
                  setReplyContent('')
                }}
              />
            ))
          )}
        </div>
      </ScrollArea>

      <div className="border-t border-gray-200 dark:border-gray-800 p-4">
        <div className="flex gap-2">
          <Input
            placeholder="Add a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.ctrlKey) {
                handleCreateComment()
              }
            }}
            className="flex-1"
          />
          <Button
            size="sm"
            onClick={() => handleCreateComment()}
            disabled={!newComment.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          Press Ctrl+Enter to send
        </p>
      </div>
    </div>
  )
}

interface CommentItemProps {
  comment: KnowledgeComment
  onReply: () => void
  onResolve: () => void
  replyingTo: boolean
  replyContent: string
  onReplyContentChange: (content: string) => void
  onSubmitReply: () => void
  onCancelReply: () => void
}

function CommentItem({
  comment,
  onReply,
  onResolve,
  replyingTo,
  replyContent,
  onReplyContentChange,
  onSubmitReply,
  onCancelReply,
}: CommentItemProps) {
  return (
    <div className={cn(
      'border border-gray-200 dark:border-gray-800 rounded-lg p-3',
      comment.resolvedAt && 'opacity-60'
    )}>
      <div className="flex items-start gap-3">
        <Avatar className="h-8 w-8">
          <AvatarImage src={comment.creator?.avatar} />
          <AvatarFallback>
            {comment.creator?.name?.charAt(0) || 'U'}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {comment.creator?.name || 'Unknown'}
            </span>
            {comment.resolvedAt && (
              <Badge variant="outline" className="text-xs">
                <Check className="h-3 w-3 mr-1" />
                Resolved
              </Badge>
            )}
          </div>
          <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
            {comment.content}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs"
              onClick={onReply}
            >
              <Reply className="h-3 w-3 mr-1" />
              Reply
            </Button>
            {!comment.resolvedAt && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs"
                onClick={onResolve}
              >
                <Check className="h-3 w-3 mr-1" />
                Resolve
              </Button>
            )}
          </div>
          {replyingTo && (
            <div className="mt-2 space-y-2">
              <Input
                placeholder="Write a reply..."
                value={replyContent}
                onChange={(e) => onReplyContentChange(e.target.value)}
                className="text-sm"
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onSubmitReply}
                  disabled={!replyContent.trim()}
                >
                  Reply
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onCancelReply}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-3 ml-4 space-y-2 border-l-2 border-gray-200 dark:border-gray-800 pl-3">
              {comment.replies.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  onReply={() => {}}
                  onResolve={() => {}}
                  replyingTo={false}
                  replyContent=""
                  onReplyContentChange={() => {}}
                  onSubmitReply={() => {}}
                  onCancelReply={() => {}}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

