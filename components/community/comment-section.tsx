"use client"

import * as React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"

interface Comment {
  id: number
  content: string
  author_name: string
  created_at: string
}

interface CommentSectionProps {
  postId: number
  comments: Comment[]
  onAddComment: (content: string) => Promise<void>
}

export function CommentSection({ postId, comments, onAddComment }: CommentSectionProps) {
  const [newComment, setNewComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!newComment.trim()) return
    
    setIsSubmitting(true)
    try {
      await onAddComment(newComment)
      setNewComment("")
    } catch (error) {
      console.error('Error adding comment:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Textarea
          placeholder="Add a comment..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="flex-1"
          disabled={isSubmitting}
        />
        <Button 
          onClick={handleSubmit}
          disabled={!newComment.trim() || isSubmitting}
        >
          {isSubmitting ? "Posting..." : "Comment"}
        </Button>
      </div>
      <ScrollArea className="h-[200px]">
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback>{comment.author_name[0]}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">{comment.author_name}</p>
                <p className="text-sm text-muted-foreground">{comment.content}</p>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
} 