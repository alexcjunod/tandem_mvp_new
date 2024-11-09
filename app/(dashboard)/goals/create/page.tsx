import AIGoalCreator from "@/components/goals/ai-goal-creator"

export default function CreateGoalPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-8">Create a New Goal</h1>
      <AIGoalCreator />
    </div>
  )
} 