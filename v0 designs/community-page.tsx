"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Bell, Heart, MessageCircle, Share2, Plus, Image as ImageIcon, Target } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

// Mock data for communities
const communities = [
  { id: 1, name: "Fitness Enthusiasts", members: 1500, posts: 350, color: "bg-red-500" },
  { id: 2, name: "Career Advancement", members: 2300, posts: 520, color: "bg-blue-500" },
  { id: 3, name: "Language Learning", members: 1800, posts: 410, color: "bg-green-500" },
  { id: 4, name: "Personal Finance", members: 3100, posts: 680, color: "bg-yellow-500" },
  { id: 5, name: "Mindfulness & Meditation", members: 1200, posts: 290, color: "bg-purple-500" },
]

// Mock data for posts
const initialPosts = [
  {
    id: 1,
    author: "Jane Doe",
    avatar: "/avatars/jane-doe.png",
    content: "Just completed my first 5K run! It's been a long journey, but so worth it. #FitnessGoals",
    image: "/images/5k-run.jpg",
    likes: 24,
    comments: 5,
    shares: 2,
    communityId: 1,
  },
  {
    id: 2,
    author: "John Smith",
    avatar: "/avatars/john-smith.png",
    content: "Tip: Break down your big career goals into smaller, actionable steps. It makes the journey less overwhelming!",
    likes: 18,
    comments: 3,
    shares: 1,
    communityId: 2,
  },
  {
    id: 3,
    author: "Emily Chen",
    avatar: "/avatars/emily-chen.png",
    content: "Milestone achieved: Conversational in Spanish after 6 months of consistent practice. Sí se puede! 🎉",
    likes: 32,
    comments: 7,
    shares: 4,
    communityId: 3,
  },
]

export default function CommunityPage() {
  const [joinedCommunities, setJoinedCommunities] = useState<number[]>([])
  const [posts, setPosts] = useState(initialPosts)
  const [newPost, setNewPost] = useState({ content: "", image: null, communityId: null })

  const handleJoinCommunity = (communityId: number) => {
    setJoinedCommunities((prev) =>
      prev.includes(communityId)
        ? prev.filter((id) => id !== communityId)
        : [...prev, communityId]
    )
  }

  const handleCreatePost = () => {
    if (newPost.content.trim() && newPost.communityId) {
      const post = {
        id: posts.length + 1,
        author: "Current User",
        avatar: "/avatars/current-user.png",
        content: newPost.content,
        image: newPost.image,
        likes: 0,
        comments: 0,
        shares: 0,
        communityId: newPost.communityId,
      }
      setPosts([post, ...posts])
      setNewPost({ content: "", image: null, communityId: null })
    }
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Community</h1>
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Community Feed</CardTitle>
            <CardDescription>Stay updated with your goal communities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Card>
                <CardContent className="pt-6">
                  <Textarea
                    placeholder="Share your progress, tips, or milestones..."
                    value={newPost.content}
                    onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                  />
                  <div className="flex justify-between items-center mt-4">
                    <select
                      className="border rounded p-2"
                      value={newPost.communityId || ""}
                      onChange={(e) => setNewPost({ ...newPost, communityId: Number(e.target.value) })}
                    >
                      <option value="">Select Community</option>
                      {communities.map((community) => (
                        <option key={community.id} value={community.id}>
                          {community.name}
                        </option>
                      ))}
                    </select>
                    <Button variant="outline" size="sm">
                      <ImageIcon className="mr-2 h-4 w-4" />
                      Add Image
                    </Button>
                    <Button onClick={handleCreatePost}>Post</Button>
                  </div>
                </CardContent>
              </Card>
              {posts.map((post) => (
                <Card key={post.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start space-x-4">
                      <Avatar>
                        <AvatarImage src={post.avatar} alt={post.author} />
                        <AvatarFallback>{post.author[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <p className="font-semibold">{post.author}</p>
                          <Badge
                            className={`${communities.find(c => c.id === post.communityId)?.color} text-white`}
                          >
                            {communities.find(c => c.id === post.communityId)?.name}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{post.content}</p>
                        {post.image && (
                          <img src={post.image} alt="Post image" className="rounded-md mb-2" />
                        )}
                        <div className="flex space-x-4 text-sm text-muted-foreground">
                          <Button variant="ghost" size="sm">
                            <Heart className="mr-1 h-4 w-4" />
                            {post.likes}
                          </Button>
                          <Button variant="ghost" size="sm">
                            <MessageCircle className="mr-1 h-4 w-4" />
                            {post.comments}
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Share2 className="mr-1 h-4 w-4" />
                            {post.shares}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Goal Communities</CardTitle>
              <CardDescription>Join communities aligned with your goals</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                <div className="space-y-4">
                  {communities.map((community) => (
                    <div key={community.id} className="flex items-center justify-between">
                      <div>
                        <Link href={`/community/${community.id}`} className="font-semibold hover:underline">
                          {community.name}
                        </Link>
                        <p className="text-sm text-muted-foreground">
                          {community.members} members • {community.posts} posts
                        </p>
                      </div>
                      <Button
                        variant={joinedCommunities.includes(community.id) ? "secondary" : "outline"}
                        size="sm"
                        onClick={() => handleJoinCommunity(community.id)}
                      >
                        {joinedCommunities.includes(community.id) ? "Joined" : "Join"}
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>Stay updated with your communities</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[200px]">
                <div className="space-y-4">
                  <div className="flex items-start space-x-4">
                    <Bell className="h-5 w-5 mt-0.5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">New comment on your post</p>
                      <p className="text-sm text-muted-foreground">John liked your recent milestone</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <Target className="h-5 w-5 mt-0.5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Goal milestone reached</p>
                      <p className="text-sm text-muted-foreground">You've completed 50% of your running goal!</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <Bell className="h-5 w-5 mt-0.5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Trending in Fitness Enthusiasts</p>
                      <p className="text-sm text-muted-foreground">New workout challenge gaining popularity</p>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}