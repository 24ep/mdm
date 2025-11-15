'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Star, ThumbsUp, MessageSquare, CheckCircle2, Loader } from 'lucide-react'
import { useSession } from 'next-auth/react'

interface Review {
  id: string
  rating: number
  title?: string
  comment?: string
  helpfulCount: number
  isVerifiedInstall: boolean
  user: {
    id: string
    name: string
    email: string
    avatar?: string
  }
  space?: {
    id: string
    name: string
  }
  userHasHelpful: boolean
  createdAt: string
  updatedAt: string
}

interface PluginReviewsProps {
  serviceId: string
  onReviewSubmit?: () => void
}

export function PluginReviews({ serviceId, onReviewSubmit }: PluginReviewsProps) {
  const { data: session } = useSession()
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(false)
  const [showReviewDialog, setShowReviewDialog] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [rating, setRating] = useState(5)
  const [title, setTitle] = useState('')
  const [comment, setComment] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [ratingDistribution, setRatingDistribution] = useState<
    Array<{ rating: number; count: number }>
  >([])

  useEffect(() => {
    loadReviews()
  }, [serviceId, page])

  const loadReviews = async () => {
    setLoading(true)
    try {
      const response = await fetch(
        `/api/marketplace/plugins/${serviceId}/reviews?page=${page}&limit=10&sortBy=created_at&sortOrder=desc`
      )
      if (response.ok) {
        const data = await response.json()
        setReviews(data.reviews || [])
        setTotalPages(data.pagination?.totalPages || 1)
        setRatingDistribution(data.ratingDistribution || [])
      }
    } catch (error) {
      console.error('Error loading reviews:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitReview = async () => {
    if (!session?.user) {
      alert('Please sign in to submit a review')
      return
    }

    if (rating < 1 || rating > 5) {
      alert('Please select a rating')
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch(`/api/marketplace/plugins/${serviceId}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, title, comment }),
      })

      if (response.ok) {
        setShowReviewDialog(false)
        setTitle('')
        setComment('')
        setRating(5)
        loadReviews()
        onReviewSubmit?.()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to submit review')
      }
    } catch (error) {
      console.error('Error submitting review:', error)
      alert('Failed to submit review')
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggleHelpful = async (reviewId: string) => {
    if (!session?.user) {
      alert('Please sign in to mark reviews as helpful')
      return
    }

    try {
      const response = await fetch(
        `/api/marketplace/plugins/${serviceId}/reviews/${reviewId}/helpful`,
        {
          method: 'POST',
        }
      )

      if (response.ok) {
        loadReviews()
      }
    } catch (error) {
      console.error('Error toggling helpful:', error)
    }
  }

  const renderStars = (rating: number, size: 'sm' | 'md' = 'md') => {
    const sizeClass = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${sizeClass} ${
              star <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Rating Distribution */}
      {ratingDistribution.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Rating Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((star) => {
                const dist = ratingDistribution.find((d) => d.rating === star)
                const count = dist?.count || 0
                const total = ratingDistribution.reduce((sum, d) => sum + d.count, 0)
                const percentage = total > 0 ? (count / total) * 100 : 0

                return (
                  <div key={star} className="flex items-center gap-2">
                    <div className="flex items-center gap-1 w-20">
                      <span className="text-sm">{star}</span>
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    </div>
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-yellow-400"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground w-12 text-right">
                      {count}
                    </span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Write Review Button */}
      {session?.user && (
        <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
          <DialogTrigger asChild>
            <Button>
              <MessageSquare className="h-4 w-4 mr-2" />
              Write a Review
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Write a Review</DialogTitle>
              <DialogDescription>
                Share your experience with this plugin
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Rating *</Label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="focus:outline-none"
                    >
                      <Star
                        className={`h-8 w-8 ${
                          star <= rating
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="ml-2 text-sm text-muted-foreground">
                    {rating} / 5
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="review-title">Title (optional)</Label>
                <Input
                  id="review-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Summarize your experience"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="review-comment">Comment (optional)</Label>
                <Textarea
                  id="review-comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share your detailed experience..."
                  rows={5}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowReviewDialog(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button onClick={handleSubmitReview} disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Review'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8">
            <Loader className="h-6 w-6 animate-spin mx-auto" />
          </div>
        ) : reviews.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No reviews yet. Be the first to review!
            </CardContent>
          </Card>
        ) : (
          reviews.map((review) => (
            <Card key={review.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="font-semibold">
                        {review.user.name || review.user.email}
                      </div>
                      {review.isVerifiedInstall && (
                        <Badge variant="outline" className="text-xs">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Verified Install
                        </Badge>
                      )}
                      {review.space && (
                        <Badge variant="secondary" className="text-xs">
                          {review.space.name}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {renderStars(review.rating, 'sm')}
                      {review.title && (
                        <span className="font-medium text-sm">{review.title}</span>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </CardHeader>
              {review.comment && (
                <CardContent>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {review.comment}
                  </p>
                  <div className="flex items-center gap-2 mt-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleHelpful(review.id)}
                      className={review.userHasHelpful ? 'text-blue-600' : ''}
                    >
                      <ThumbsUp className="h-4 w-4 mr-1" />
                      Helpful ({review.helpfulCount})
                    </Button>
                  </div>
                </CardContent>
              )}
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  )
}

