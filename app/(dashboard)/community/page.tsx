"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Heart, MessageCircle, Search } from "lucide-react"
import { useUser } from "@clerk/nextjs"
import { supabase } from "@/lib/supabase/client"
import { toast } from "sonner"
import type { Comment } from "@/types"
import { PostCreation } from "@/components/community/post-creation"
import { PostCard } from "@/components/community/post-card"

interface Community {
  id: number
  name: string
  description: string
  color: string
  member_count: number
  post_count: number
}

interface Post {
  id: number
  content: string
  community_id: number
  author_name: string
  likes: number
  comments: number
  created_at: string
}

export default function CommunityPage() {
  const { user } = useUser()
  const [communities, setCommunities] = useState<Community[]>([])
  const [posts, setPosts] = useState<Post[]>([])
  const [joinedCommunities, setJoinedCommunities] = useState<number[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState<{ [key: number]: boolean }>({})
  const [likedPosts, setLikedPosts] = useState<number[]>([])
  const [showComments, setShowComments] = useState<number | null>(null)
  const [comments, setComments] = useState<{ [key: number]: Comment[] }>({})

  // Fetch initial data
  const fetchPosts = async () => {
    try {
      console.log('Fetching posts...')
      const { data: postsData, error } = await supabase
        .from('posts')
        .select(`
          id,
          content,
          community_id,
          user_id,
          author_name,
          likes,
          comments,
          created_at,
          communities:community_id (
            id,
            name,
            color
          )
        `)
        .order('created_at', { ascending: false })

      console.log('Posts Data:', postsData)
      
      if (error) {
        console.error('Error fetching posts:', error)
        return
      }

      if (postsData) {
        setPosts(postsData)
        console.log('Posts State Updated:', postsData)
      }
    } catch (error) {
      console.error('Error fetching posts:', error)
    }
  }

  useEffect(() => {
    async function fetchData() {
      try {
        console.log('Fetching data...')
        
        // Fetch communities
        const { data: communitiesData, error: communitiesError } = await supabase
          .from('communities')
          .select('*')
          .order('member_count', { ascending: false })

        console.log('Communities Data:', communitiesData)
        console.log('Communities Error:', communitiesError)

        // Fetch posts
        await fetchPosts()

        if (communitiesData) {
          setCommunities(communitiesData)
        }

        // Log state after setting
        console.log('Communities State:', communities)
        console.log('Posts State:', posts)

        // Fetch joined communities if user is logged in
        if (user) {
          const { data: joinedData } = await supabase
            .from('community_members')
            .select('community_id')
            .eq('user_id', user.id)

          if (joinedData) {
            setJoinedCommunities(joinedData.map(d => d.community_id))
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setIsLoading({})  // Fixed: Initialize with empty object instead of false
      }
    }

    fetchData()
  }, [user])

  // Filter communities based on search
  const filteredCommunities = communities.filter(community =>
    community.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    community.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Handle joining/leaving community with loading state and notifications
  const handleJoinCommunity = async (communityId: number) => {
    if (!user) {
      toast.error("Please sign in to join communities")
      return
    }

    setIsLoading(prev => ({ ...prev, [communityId]: true }))

    try {
      if (joinedCommunities.includes(communityId)) {
        await supabase
          .from('community_members')
          .delete()
          .eq('community_id', communityId)
          .eq('user_id', user.id)

        setJoinedCommunities(prev => prev.filter(id => id !== communityId))
        toast.success("Successfully left the community")
      } else {
        await supabase
          .from('community_members')
          .insert({
            community_id: communityId,
            user_id: user.id
          })

        setJoinedCommunities(prev => [...prev, communityId])
        toast.success("Successfully joined the community")
      }

      // Refresh communities to get updated member count
      const { data } = await supabase
        .from('communities')
        .select('*')
        .order('member_count', { ascending: false })

      if (data) {
        setCommunities(data)
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error("Something went wrong. Please try again.")
    } finally {
      setIsLoading(prev => ({ ...prev, [communityId]: false }))
    }
  }

  // Handle post creation with notifications
  const handleCreatePost = async (content: string, communityId: number, imageUrl?: string) => {
    if (!user) {
      toast.error("Please sign in to create a post")
      return
    }

    try {
      const { data, error } = await supabase
        .from('posts')
        .insert({
          content,
          community_id: communityId,
          user_id: user.id,
          author_name: user.fullName || 'Anonymous',
          likes: 0,
          comments: 0,
          image_url: imageUrl
        })
        .select()
        .single()

      if (error) throw error

      setPosts(current => [data, ...current])
      toast.success('Post created successfully!')
      
      // Fetch posts again to ensure we have the latest data
      fetchPosts()
    } catch (error) {
      console.error('Error creating post:', error)
      toast.error('Failed to create post')
    }
  }

  // Fetch liked posts when component mounts
  useEffect(() => {
    async function fetchLikedPosts() {
      if (!user) return
      
      const { data } = await supabase
        .from('post_likes')
        .select('post_id')
        .eq('user_id', user.id)

      if (data) {
        setLikedPosts(data.map(like => like.post_id))
      }
    }

    if (user) {
      fetchLikedPosts()
    }
  }, [user])

  // Handle like functionality
  const handleLike = async (postId: number) => {
    if (!user) {
      toast.error("Please sign in to like posts")
      return
    }

    try {
      if (likedPosts.includes(postId)) {
        // Unlike
        await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id)

        setLikedPosts(prev => prev.filter(id => id !== postId))
      } else {
        // Like
        await supabase
          .from('post_likes')
          .insert({
            post_id: postId,
            user_id: user.id
          })

        setLikedPosts(prev => [...prev, postId])
      }

      // Refresh posts
      fetchPosts()
    } catch (error) {
      console.error('Error:', error)
      toast.error("Failed to update like")
    }
  }

  // Fetch comments for a post
  const fetchComments = async (postId: number) => {
    const { data } = await supabase
      .from('comments')
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: false })

    if (data) {
      setComments(prev => ({ ...prev, [postId]: data }))
    }
  }

  // Handle comment creation
  const handleAddComment = async (postId: number, content: string) => {
    if (!user || !content.trim()) return

    const { data: comment, error } = await supabase
      .from('comments')
      .insert({
        content,
        post_id: postId,
        user_id: user.id,
        author_name: user.fullName || 'Anonymous'
      })
      .select()
      .single()

    if (error) {
      console.error('Error adding comment:', error)
      return
    }

    // Update comments state
    setComments(prev => ({
      ...prev,
      [postId]: [comment, ...(prev[postId] || [])]
    }))

    // Update post comment count
    setPosts(prev =>
      prev.map(post =>
        post.id === postId
          ? { ...post, comments: post.comments + 1 }
          : post
      )
    )
  }

  // Handle showing comments
  const handleShowComments = async (postId: number) => {
    if (showComments === postId) {
      setShowComments(null)
    } else {
      setShowComments(postId)
      if (!comments[postId]) {
        await fetchComments(postId)
      }
    }
  }

  // Set up real-time subscriptions
  useEffect(() => {
    // Subscribe to new posts
    const postsChannel = supabase
      .channel('public:posts')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'posts'
      }, async (payload) => {
        console.log('Real-time update:', payload)
        // Fetch all posts again when there's a change
        await fetchPosts()
      })
      .subscribe()

    // Fetch initial posts
    fetchPosts()

    // Cleanup subscription
    return () => {
      supabase.removeChannel(postsChannel)
    }
  }, [])

  // Add this useEffect after your other useEffects
  useEffect(() => {
    const postsChannel = supabase
      .channel('custom-channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'posts',
        },
        (payload) => {
          console.log('Change received!', payload)
          fetchPosts() // Refresh posts when changes occur
        }
      )
      .subscribe()

    // Initial fetch
    fetchPosts()

    return () => {
      supabase.removeChannel(postsChannel)
    }
  }, []) // Empty dependency array

  return (
    <div className="container mx-auto p-6">
      <header className="mb-6">
        <h1 className="text-3xl font-bold">Community</h1>
        <p className="text-muted-foreground">Connect with others on similar journeys</p>
      </header>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Feed */}
        <div className="md:col-span-2">
          {/* Post Creation */}
          {joinedCommunities.length > 0 && (
            <div className="mb-6">
              <PostCreation
                communities={communities.filter(c => joinedCommunities.includes(c.id))}
                onCreatePost={handleCreatePost}
              />
            </div>
          )}

          {/* Posts Feed */}
          <Card>
            <CardHeader>
              <CardTitle>Community Feed</CardTitle>
              <CardDescription>Recent updates from all communities</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <div className="space-y-4">
                  {posts.map((post) => {
                    const community = communities.find(c => c.id === post.community_id)
                    if (!community) return null // Skip if community not found
                    
                    return (
                      <PostCard
                        key={post.id}
                        post={post}
                        community={community}
                        isLiked={likedPosts.includes(post.id)}
                        onLike={handleLike}
                      />
                    )
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Communities</CardTitle>
              <CardDescription>Find your community</CardDescription>
              <div className="relative mt-2">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search communities..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-4">
                  {filteredCommunities.map((community) => (
                    <Card key={community.id}>
                      <CardContent className="pt-6">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold">{community.name}</h3>
                            <Button
                              variant={joinedCommunities.includes(community.id) ? "secondary" : "outline"}
                              size="sm"
                              onClick={() => handleJoinCommunity(community.id)}
                              disabled={isLoading[community.id]}
                            >
                              {isLoading[community.id] ? (
                                "Loading..."
                              ) : (
                                joinedCommunities.includes(community.id) ? "Joined" : "Join"
                              )}
                            </Button>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {community.description}
                          </p>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">
                              {community.member_count} members
                            </Badge>
                            {community.post_count > 0 && (
                              <Badge variant="outline">
                                {community.post_count} posts
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 