"use client"

import * as React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus } from "lucide-react"
import { toast } from "sonner"

interface PostCreationProps {
  communities: Array<{ id: number; name: string }>
  onCreatePost: (content: string, communityId: number) => Promise<void>
}

export function PostCreation({ communities, onCreatePost }: PostCreationProps) {
  const [content, setContent] = useState("")
  const [communityId, setCommunityId] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!content.trim() || !communityId) return
    
    setIsSubmitting(true)
    try {
      await onCreatePost(content, parseInt(communityId))
      setContent("")
      setCommunityId("")
      toast.success('Post created successfully!')
    } catch (error) {
      console.error('Error in post creation:', error)
      toast.error('Failed to create post')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <Textarea
          placeholder="Share your thoughts with your community..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="mb-4 min-h-[100px]"
          disabled={isSubmitting}
        />
        
        <div className="flex justify-between items-center gap-4">
          <Select 
            value={communityId} 
            onValueChange={setCommunityId}
            disabled={isSubmitting}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select community" />
            </SelectTrigger>
            <SelectContent>
              {communities.map((community) => (
                <SelectItem key={community.id} value={community.id.toString()}>
                  {community.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button 
            onClick={handleSubmit}
            disabled={!content.trim() || !communityId || isSubmitting}
          >
            {isSubmitting ? (
              "Posting..."
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Create Post
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
} 