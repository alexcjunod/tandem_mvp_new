"use client"

import AIChat from "@/components/goals/ai-chat"
import { useRouter } from "next/navigation"

export default function CreateGoalWithAIPage() {
  const router = useRouter()

  return (
    <div className="container mx-auto p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Create Your Goal</h1>
        <p className="text-muted-foreground mb-6">
          Chat with our AI assistant to create a personalized goal plan
        </p>
        <AIChat 
          onGoalCreated={(goal) => {
            router.push(`/goals/${goal.id}`);
          }} 
        />
      </div>
    </div>
  )
} 