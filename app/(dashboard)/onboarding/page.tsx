"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Cigarette, Timer, Plus, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import AIChat from "@/components/goals/ai-chat"
import { useGoals } from "@/hooks/use-goals"
import { toast } from "sonner"
import type { GoalStructure } from "@/types/goals"

const predefinedGoals = [
  { 
    id: "quit-smoking", 
    title: "Stop Smoking",
    icon: Cigarette,
    details: {
      title: "Stop Smoking",
      description: "Quit smoking completely and maintain a smoke-free lifestyle",
      smart_goal: {
        specific: "Stop smoking cigarettes completely",
        measurable: "Track days without smoking and reduce cigarette count to zero",
        achievable: "Use nicotine replacement therapy and support groups",
        relevant: "Improve health and save money",
        timeBound: "Quit completely within 3 months"
      },
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      color: "hsl(10, 70%, 50%)",
      reasoning: "For better health and financial stability"
    }
  },
  { 
    id: "run-marathon", 
    title: "Run a Marathon",
    icon: Timer,
    details: {
      title: "Run a Marathon",
      description: "Complete a full marathon (42.2km)",
      smart_goal: {
        specific: "Complete a full marathon race",
        measurable: "Track training progress and finish time",
        achievable: "Follow structured training plan",
        relevant: "Improve fitness and achieve personal milestone",
        timeBound: "Complete within 6 months"
      },
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      color: "hsl(200, 70%, 50%)",
      reasoning: "To challenge myself and improve fitness"
    }
  },
  { 
    id: "custom", 
    title: "Create Custom Goal",
    icon: Plus
  }
]

export default function OnboardingPage() {
  const router = useRouter()
  const { createGoal } = useGoals()
  const [step, setStep] = useState(1)
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null)
  const [customGoalStep, setCustomGoalStep] = useState(1)
  const [motivation, setMotivation] = useState("")

  const handleGoalSelect = async (goalId: string) => {
    setSelectedGoal(goalId)
    if (goalId === "custom") {
      setStep(2)
    } else {
      setStep(3)
    }
  }

  const handlePredefinedGoalSubmit = async () => {
    if (!selectedGoal || selectedGoal === "custom") return

    const goalTemplate = predefinedGoals.find(g => g.id === selectedGoal)
    if (!goalTemplate?.details) return

    try {
      const goal = await createGoal({
        ...goalTemplate.details,
        reasoning: motivation || goalTemplate.details.reasoning
      })

      if (goal) {
        toast.success("Goal created successfully!")
        setStep(4)
      }
    } catch (error) {
      console.error('Error creating goal:', error)
      toast.error("Failed to create goal")
    }
  }

  const handleGoalCreated = (goal: GoalStructure) => {
    toast.success("Goal created successfully!")
    setStep(4)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-2xl p-6">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="font-semibold">Step {step} of 4</div>
          </div>
          <div className="h-2 bg-secondary rounded-full">
            <div 
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-center">Choose Your Goal</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {predefinedGoals.map((goal) => (
                <Card
                  key={goal.id}
                  className={`cursor-pointer transition-all ${
                    selectedGoal === goal.id ? "border-primary" : ""
                  }`}
                  onClick={() => handleGoalSelect(goal.id)}
                >
                  <CardContent className="pt-6 text-center">
                    <goal.icon className="w-12 h-12 mx-auto mb-4" />
                    <h3 className="font-semibold">{goal.title}</h3>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-center">Create Custom Goal</h2>
            <Card>
              <CardContent className="pt-6">
                <AIChat 
                  onGoalCreated={handleGoalCreated}
                />
              </CardContent>
            </Card>
          </div>
        )}

        {step === 3 && selectedGoal !== 'custom' && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-center">
              Why This Goal Matters
            </h2>
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <Label htmlFor="motivation">What&apos;s your primary motivation?</Label>
                  <Textarea
                    id="motivation"
                    placeholder="What&apos;s your primary motivation?"
                    value={motivation}
                    onChange={(e) => setMotivation(e.target.value)}
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full" 
                  onClick={handlePredefinedGoalSubmit}
                >
                  Set Goal
                </Button>
              </CardFooter>
            </Card>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-center">Goal Set Successfully!</h2>
            <Card>
              <CardContent className="pt-6 text-center">
                <Sparkles className="w-12 h-12 mx-auto mb-4 text-primary" />
                <p className="text-lg mb-4">
                  Congratulations on setting your goal! You&apos;re one step closer to achieving it.
                </p>
                <Button 
                  className="w-full" 
                  onClick={() => router.push('/dashboard')}
                >
                  Go to Dashboard
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}