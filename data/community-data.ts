export const communities = [
  { 
    id: 1, 
    name: "Fitness Enthusiasts", 
    members: 1500, 
    posts: 350, 
    color: "bg-red-500",
    description: "A community for fitness lovers to share tips, progress, and motivation."
  },
  // ... rest of your communities
]

export const initialPosts = [
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
  // ... rest of your posts
]

export interface Post {
  id: number
  author: string
  avatar: string
  content: string
  image?: string | null
  likes: number
  comments: number
  shares: number
  communityId: number
}

export interface Community {
  id: number
  name: string
  members: number
  posts: number
  color: string
  description: string
} 