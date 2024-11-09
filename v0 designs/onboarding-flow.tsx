"use client"

import { useState } from "react"
import { ArrowLeft, ArrowRight, Cigarette, Running, Plus, Target, Send, Sparkles, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const popularGoals = [
  { id: "quit-smoking", title: "Stop Smoking", icon: Cigarette },
  { id: "run-marathon", title: "Run a Marathon", icon: Running },
  { id: "custom", title: "Create Custom Goal", icon: Plus },
]

export default function OnboardingFlow() {
  const [step, setStep] = useState(1)
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null)
  const [customGoalStep, setCustomGoalStep] = useState(1)
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hi! I'm here to help you create a SMART goal. What's your general goal or aspiration?" },
  ])
  const [inputValue, setInputValue] = useState("")
  const [goalDetails, setGoalDetails] = useState({
    general: "",
    specific: "",
    measurable: "",
    timeframe: "",
    category: "",
  })

  const handleGoalSelect = (goalId: string) => {
    setSelectedGoal(goalId)
    if (goalId === "custom") {
      setStep(3) // Move to custom goal creation
    } else {
      setStep(2) // Move to pre-defined goal details
    }
  }

  const handleCustomGoalSend = () => {
    if (!inputValue.trim()) return

    const newMessages = [...messages, { role: "user", content: inputValue }]

    if (customGoalStep === 1) {
      setGoalDetails(prev => ({ ...prev, general: inputValue }))
      newMessages.push({
        role: "assistant",
        content: "Great! Let's make this goal more specific. How exactly do you plan to achieve this? What specific actions will you take?",
      })
      setCustomGoalStep(2)
    } else if (customGoalStep === 2) {
      setGoalDetails(prev => ({ ...prev, specific: inputValue }))
      newMessages.push({
        role: "assistant",
        content: "How will you measure your progress? What metrics or milestones will you use to track success?",
      })
      setCustomGoalStep(3)
    } else if (customGoalStep === 3) {
      setGoalDetails(prev => ({ ...prev, measurable: inputValue }))
      newMessages.push({
        role: "assistant",
        content: "When would you like to achieve this goal by? Let's set a realistic timeframe.",
      })
      setCustomGoalStep(4)
    } else if (customGoalStep === 4) {
      setGoalDetails(prev => ({ ...prev, timeframe: inputValue }))
      setCustomGoalStep(5)
      newMessages.push({
        role: "assistant",
        content: "Great! I've structured your SMART goal. Please review the details below and confirm if you're ready to add this to your dashboard.",
      })
    }

    setMessages(newMessages)
    setInputValue("")
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleCustomGoalSend()
    }
  }

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
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
        )
      case 2:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-center">
              {selectedGoal === "quit-smoking" ? "Stop Smoking" : "Run a Marathon"}
            </h2>
            <Card>
              <CardContent className="pt-6">
                <form className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="start-date">Start Date</Label>
                    <Input type="date" id="start-date" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end-date">Target End Date</Label>
                    <Input type="date" id="end-date" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="motivation">What's your primary motivation?</Label>
                    <Textarea id="motivation" placeholder="I want to improve my health..." />
                  </div>
                </form>
              </CardContent>
              <CardFooter>
                <Button className="w-full" onClick={() => setStep(4)}>Set Goal</Button>
              </CardFooter>
            </Card>
          </div>
        )
      case 3:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-center">Create Custom Goal</h2>
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {messages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex ${
                        message.role === "assistant" ? "justify-start" : "justify-end"
                      }`}
                    >
                      <Card
                        className={`max-w-[80%] ${
                          message.role === "assistant" ? "" : "bg-primary text-primary-foreground"
                        }`}
                      >
                        <CardContent className="p-3">
                          <p className="text-sm">{message.content}</p>
                        </CardContent>
                      </Card>
                    </div>
                  ))}
                </div>
                {customGoalStep < 5 && (
                  <div className="mt-4">
                    <div className="flex gap-2">
                      <Textarea
                        placeholder="Type your response..."
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyPress={handleKeyPress}
                        className="min-h-[44px] flex-1 resize-none"
                        rows={1}
                      />
                      <Button size="icon" onClick={handleCustomGoalSend}>
                        <Send className="h-4 w-4" />
                        <span className="sr-only">Send</span>
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
              {customGoalStep === 5 && (
                <CardFooter>
                  <Button className="w-full" onClick={() => setStep(4)}>
                    Confirm Goal
                  </Button>
                </CardFooter>
              )}
            </Card>
          </div>
        )
      case 4:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-center">Goal Set Successfully!</h2>
            <Card>
              <CardContent className="pt-6 text-center">
                <Sparkles className="w-12 h-12 mx-auto mb-4 text-primary" />
                <p className="text-lg mb-4">
                  Congratulations on setting your goal! You're one step closer to achieving it.
                </p>
                <Button className="w-full" onClick={() => console.log("Navigate to dashboard")}>
                  Go to Dashboard
                </Button>
              </CardContent>
            </Card>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-2xl p-6">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setStep((prev) => Math.max(1, prev - 1))}
              disabled={step === 1}
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back</span>
            </Button>
            <div className="font-semibold">Step {step} of 4</div>
            <div className="w-8 h-8" /> {/* Placeholder for alignment */}
          </div>
          <Progress value={(step / 4) * 100} className="w-full" />
        </div>
        {renderStep()}
      </div>
    </div>
  )
}