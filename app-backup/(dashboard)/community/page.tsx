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
import { CommentSection } from "@/components/community/comment-section"

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
  const [newPost, setNewPost] = useState({ content: "", communityId: null as number | null })
  const [isLoading, setIsLoading] = useState<{ [key: number]: boolean }>({})
  const [likedPosts, setLikedPosts] = useState<number[]>([])
  const [showComments, setShowComments] = useState<number | null>(null)
  const [comments, setComments] = useState<{ [key: number]: Comment[] }>({})
  const [initialLoading, setInitialLoading] = useState(true)

  // Fetch communities and posts
  useEffect(() => {
    async function fetchData() {
      try {
        const { data: communitiesData } = await supabase
          .from('communities')
          .select('*')
          .order('member_count', { ascending: false })

        if (communitiesData) {
          setCommunities(communitiesData)
        }

        const { data: postsData } = await supabase
          .from('posts')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(20)

        if (postsData) {
          setPosts(postsData)
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setInitialLoading(false)
      }
    }

    fetchData()
  }, [])

  // Filter communities based on search
  const filteredCommunities = communities.filter(community =>
    community.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    community.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Fetch joined communities when component mounts
  useEffect(() => {
    async function fetchJoinedCommunities() {
      if (!user) return
      
      const { data } = await supabase
        .from('community_members')
        .select('community_id')
        .eq('user_id', user.id)

      if (data) {
        setJoinedCommunities(data.map(member => member.community_id))
      }
    }

    fetchJoinedCommunities()
  }, [user])

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
  const handleCreatePost = async (content: string, communityId: number) => {
    if (!user) {
      toast.error("Please sign in to create a post")
      return
    }

    try {
      // Log the attempt
      console.log('Attempting to create post:', {
        content,
        communityId,
        userId: user.id,
        authorName: user.fullName
      })

      // Create the post
      const { data, error } = await supabase
        .from('posts')
        .insert({
          content,
          community_id: communityId,
          user_id: user.id,
          author_name: user.fullName || 'Anonymous'
        })
        .select()
        .single()

      if (error) {
        console.error('Supabase error:', error.message)
        toast.error(error.message)
        return
      }

      if (data) {
        console.log('Post created successfully:', data)
        setPosts(current => [data, ...current])
        toast.success('Post created successfully!')
        return data
      }
    } catch (error: any) {
      console.error('Error creating post:', error?.message || error)
      toast.error('Failed to create post. Please try again.')
      throw error
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

  // Update handleLike function
  const handleLike = async (postId: number) => {
    if (!user) {
      toast.error("Please sign in to like posts")
      return
    }

    try {
      if (likedPosts.includes(postId)) {
        // Unlike post
        const { error: unlikeError } = await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id)

        if (unlikeError) throw unlikeError

        // Update local state
        setLikedPosts(prev => prev.filter(id => id !== postId))
        setPosts(prev => 
          prev.map(post => 
            post.id === postId 
              ? { ...post, likes: Math.max(0, post.likes - 1) }
              : post
          )
        )
      } else {
        // Like post
        const { error: likeError } = await supabase
          .from('post_likes')
          .insert({
            post_id: postId,
            user_id: user.id
          })

        if (likeError) throw likeError

        // Update local state
        setLikedPosts(prev => [...prev, postId])
        setPosts(prev => 
          prev.map(post => 
            post.id === postId 
              ? { ...post, likes: post.likes + 1 }
              : post
          )
        )
      }
    } catch (error) {
      console.error('Error toggling like:', error)
      toast.error("Failed to update like. Please try again.")
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
    const postsChannel = supabase
      .channel('public:posts')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'posts'
      }, payload => {
        setPosts(current => [payload.new as any, ...current])
      })
      .subscribe()

    return () => {
      supabase.removeChannel(postsChannel)
    }
  }, [])

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
                  {posts.map((post) => (
                    <Card key={post.id}>
                      <CardContent className="pt-6">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{post.author_name}</span>
                            {communities.find(c => c.id === post.community_id) && (
                              <Badge 
                                variant="outline" 
                                className="hover:bg-primary hover:text-primary-foreground transition-colors"
                              >
                                {communities.find(c => c.id === post.community_id)?.name}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm">{post.content}</p>
                          <div className="flex gap-4">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleLike(post.id)}
                              className={likedPosts.includes(post.id) ? 'text-red-500' : ''}
                            >
                              <Heart className="mr-1 h-4 w-4" />
                              {post.likes || 0}
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleShowComments(post.id)}
                            >
                              <MessageCircle className="mr-1 h-4 w-4" />
                              {post.comments}
                            </Button>
                          </div>
                          
                          {showComments === post.id && (
                            <div className="mt-4">
                              <CommentSection
                                postId={post.id}
                                comments={comments[post.id] || []}
                                onAddComment={(content) => handleAddComment(post.id, content)}
                              />
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
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