"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Heart, MessageCircle, Share2, Image as ImageIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useUser } from "@clerk/nextjs"
import { supabase } from "@/lib/supabase/client"

interface Post {
  id: number
  content: string
  image_url?: string
  created_at: string
  user_id: string
  likes: number
  comments: number
  author: {
    name: string
    avatar_url: string
  }
}

interface Community {
  id: number
  name: string
  description: string
  color: string
  member_count: number
  post_count: number
}

interface PageProps {
  params: {
    id: string
  }
}

export default async function CommunityPage({ params }: PageProps) {
  const { id } = params

  const { user, isLoaded: isUserLoaded } = useUser()
  const [community, setCommunity] = useState<Community | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [newPost, setNewPost] = useState({ content: "", image: null as File | null })
  const [isLoading, setIsLoading] = useState(true)
  const [isMember, setIsMember] = useState(false)

  // Fetch community data and check membership
  useEffect(() => {
    async function initialize() {
      if (!isUserLoaded) return

      try {
        // Fetch community data
        const { data: communityData, error: communityError } = await supabase
          .from('communities')
          .select('*')
          .eq('id', id)
          .single()

        if (communityError) throw communityError
        setCommunity(communityData)

        // Check membership if user is logged in
        if (user) {
          const { data: memberData } = await supabase
            .from('community_members')
            .select('*')
            .eq('community_id', id)
            .eq('user_id', user.id)
            .single()

          setIsMember(!!memberData)
        }

        // Fetch posts
        const { data: postsData, error: postsError } = await supabase
          .from('posts')
          .select(`
            *,
            profiles:user_id (
              full_name,
              avatar_url
            )
          `)
          .eq('community_id', id)
          .order('created_at', { ascending: false })

        if (postsError) throw postsError
        setPosts(postsData)

      } catch (error) {
        console.error('Error initializing:', error)
      } finally {
        setIsLoading(false)
      }
    }

    initialize()
  }, [id, user, isUserLoaded])

  // Handle joining/leaving community
  const handleMembershipToggle = async () => {
    if (!user) return

    try {
      setIsLoading(true)

      if (isMember) {
        // Leave community
        const { error } = await supabase
          .from('community_members')
          .delete()
          .eq('community_id', id)
          .eq('user_id', user.id)

        if (error) throw error
        setIsMember(false)
      } else {
        // Join community
        const { error } = await supabase
          .from('community_members')
          .insert({
            community_id: id,
            user_id: user.id
          })

        if (error) throw error
        setIsMember(true)
      }

      // Refresh community data to get updated member count
      const { data: updatedCommunity } = await supabase
        .from('communities')
        .select('*')
        .eq('id', id)
        .single()

      if (updatedCommunity) {
        setCommunity(updatedCommunity)
      }
    } catch (error) {
      console.error('Error toggling membership:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Handle creating a new post
  const handleCreatePost = async () => {
    if (!user || !newPost.content.trim()) return

    try {
      setIsLoading(true)
      
      // First ensure user has a profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          full_name: user.fullName || 'Anonymous',
          avatar_url: user.imageUrl,
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (profileError) {
        console.error('Error creating profile:', profileError)
        return
      }

      // Create the post
      const { data: post, error: postError } = await supabase
        .from('posts')
        .insert({
          content: newPost.content,
          community_id: id,
          user_id: user.id
        })
        .select(`
          *,
          profiles:user_id (
            full_name,
            avatar_url
          )
        `)
        .single()

      if (postError) {
        console.error('Error creating post:', postError)
        return
      }

      // Update posts list
      setPosts(current => [post, ...current])
      
      // Clear form
      setNewPost({ content: "", image: null })

    } catch (error) {
      console.error('Error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Add this function to fetch posts
  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles:user_id (
            full_name,
            avatar_url
          )
        `)
        .eq('community_id', id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching posts:', error)
        return
      }

      setPosts(data || [])
    } catch (error) {
      console.error('Error:', error)
    }
  }

  // Add this to your useEffect
  useEffect(() => {
    fetchPosts()
  }, [id])

  if (isLoading || !isUserLoaded) return <div>Loading...</div>
  if (!community) return <div>Community not found</div>

  return (
    <div className="container mx-auto p-6">
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">{community.name}</CardTitle>
              <CardDescription>{community.description}</CardDescription>
            </div>
            <Badge className={`${community.color} text-white`}>
              {community.member_count} members
            </Badge>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          {/* Create Post */}
          {isMember && (
            <Card>
              <CardContent className="pt-6">
                <Textarea
                  placeholder="Share your thoughts..."
                  value={newPost.content}
                  onChange={(e) => setNewPost(prev => ({ ...prev, content: e.target.value }))}
                  className="mb-4"
                />
                <div className="flex justify-between items-center">
                  <Button 
                    variant="outline" 
                    onClick={() => document.getElementById('image-upload')?.click()}
                  >
                    <ImageIcon className="mr-2 h-4 w-4" />
                    Add Image
                  </Button>
                  <input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) setNewPost(prev => ({ ...prev, image: file }))
                    }}
                  />
                  <Button onClick={handleCreatePost} disabled={isLoading}>
                    Post
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Posts */}
          <ScrollArea className="h-[600px]">
            <div className="space-y-4">
              {posts.map((post) => (
                <Card key={post.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start space-x-4">
                      <Avatar>
                        <AvatarImage src={post.author.avatar_url} />
                        <AvatarFallback>{post.author.name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-semibold">{post.author.name}</p>
                        <p className="text-sm text-muted-foreground mt-1">{post.content}</p>
                        {post.image_url && (
                          <img 
                            src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/post-images/${post.image_url}`}
                            alt="Post image" 
                            className="mt-2 rounded-md max-h-96 object-cover"
                          />
                        )}
                        <div className="flex space-x-4 mt-4">
                          <Button variant="ghost" size="sm" onClick={() => handleLike(post.id)}>
                            <Heart className="mr-1 h-4 w-4" />
                            {post.likes}
                          </Button>
                          <Button variant="ghost" size="sm">
                            <MessageCircle className="mr-1 h-4 w-4" />
                            {post.comments}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>About Community</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{community.description}</p>
              <div className="mt-4">
                <Button 
                  className="w-full" 
                  variant={isMember ? "secondary" : "default"}
                  onClick={handleMembershipToggle}
                >
                  {isMember ? 'Leave Community' : 'Join Community'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}