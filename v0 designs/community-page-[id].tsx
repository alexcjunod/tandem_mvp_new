"use client"

import { useState } from "react"
import { useRouter } from "next/router"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Bell, Heart, MessageCircle, Share2, Plus, Image as ImageIcon, Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"

// Mock data for communities
const communities = [
  { id: 1, name: "Fitness Enthusiasts", members: 1500, posts: 350, color: "bg-red-500", description: "A community for fitness lovers to share tips, progress, and motivation." },
  { id: 2, name: "Career Advancement", members: 2300, posts: 520, color: "bg-blue-500", description: "Discuss career strategies, share job opportunities, and support each other's professional growth." },
  { id: 3, name: "Language Learning", members: 1800, posts: 410, color: "bg-green-500", description: "Connect with fellow language learners, share resources, and practice together." },
  { id: 4, name: "Personal Finance", members: 3100, posts: 680, color: "bg-yellow-500", description: "Learn about budgeting, investing, and achieving financial independence." },
  { id: 5, name: "Mindfulness & Meditation", members: 1200, posts: 290, color: "bg-purple-500", description: "Explore mindfulness techniques, share meditation experiences, and support mental well-being." },
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
  const router = useRouter()
  const { id } = router.query
  const communityId = Number(id)

  const community = communities.find(c => c.id === communityId)
  const [posts, setPosts] = useState(initialPosts.filter(post => post.communityId === communityId))
  const [newPost, setNewPost] = useState({ content: "", image: null })

  const handleCreatePost = () => {
    if (newPost.content.trim()) {
      const post = {
        id: posts.length + 1,
        author: "Current User",
        avatar: "/avatars/current-user.png",
        content: newPost.content,
        image: newPost.image,
        likes: 0,
        comments: 0,
        shares: 0,
        communityId: communityId,
      }
      setPosts([post, ...posts])
      setNewPost({ content: "", image: null })
    }
  }

  if (!community) {
    return <div>Community not found</div>
  }

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
              <Users className="mr-1 h-4 w-4" />
              {community.members} members
            </Badge>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Community Posts</CardTitle>
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
                        <p className="font-semibold">{post.author}</p>
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
              <CardTitle>Community Rules</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-4 space-y-2">
                <li>Be respectful and supportive of other members</li>
                <li>Stay on topic and share relevant content</li>
                <li>No spam or self-promotion</li>
                <li>Respect privacy and confidentiality</li>
                <li>Report any inappropriate behavior</li>
              </ul>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Trending Topics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {["#GoalSetting", "#ProgressNotPerfection", "#AccountabilityPartner", "#SmallWins", "#StayMotivated"].map((topic, index) => (
                  <Badge key={index} variant="secondary" className="mr-2">
                    {topic}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}