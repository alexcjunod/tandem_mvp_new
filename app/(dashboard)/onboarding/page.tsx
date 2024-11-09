"use client"

import * as React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { 
  Cigarette, 
  Plus, 
  Target, 
  Send, 
  Sparkles, 
  Timer  // Using Timer instead of Running as it's available in lucide-react
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import AIChat from "@/components/goals/ai-chat"

const popularGoals = [
  { id: "quit-smoking", title: "Stop Smoking", icon: Cigarette },
  { id: "run-marathon", title: "Run a Marathon", icon: Timer }, // Changed to Timer
  { id: "custom", title: "Create Custom Goal", icon: Plus },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null)
  const [customGoalStep, setCustomGoalStep] = useState(1)

  const handleGoalSelect = (goalId: string) => {
    setSelectedGoal(goalId)
    if (goalId === "custom") {
      setStep(3)
    } else {
      setStep(2)
    }
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
              {popularGoals.map((goal) => (
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
            <h2 className="text-2xl font-bold text-center">
              {selectedGoal === "quit-smoking" ? "Stop Smoking" : "Run a Marathon"}
            </h2>
            <Card>
              <CardContent className="pt-6">
                {/* Pre-defined goal form */}
              </CardContent>
              <CardFooter>
                <Button className="w-full" onClick={() => setStep(4)}>
                  Set Goal
                </Button>
              </CardFooter>
            </Card>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-center">Create Custom Goal</h2>
            <Card>
              <CardContent className="pt-6">
                <AIChat 
                  customGoalStep={customGoalStep}
                  setCustomGoalStep={setCustomGoalStep}
                  onGoalCreated={() => setStep(4)}
                />
              </CardContent>
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
                  Congratulations on setting your goal! You're one step closer to achieving it.
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