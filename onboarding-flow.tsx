"use client"

import { useState } from "react"
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, Cigarette, Timer, Plus, Target, Send, Sparkles, Check, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useUser } from "@clerk/nextjs"
import { createClient } from '@supabase/supabase-js'
import { useGoals } from "@/hooks/use-goals"
import { toast } from "sonner"
import { Progress } from "@/components/ui/progress"

const popularGoals = [
  { id: "quit-smoking", title: "Stop Smoking", icon: Cigarette },
  { id: "run-marathon", title: "Run a Marathon", icon: Timer },
  { id: "manual", title: "Create Manual Goal", icon: Target },
  { id: "custom", title: "Create Custom Goal (AI)", icon: Plus },
]

export default function OnboardingFlow() {
  const router = useRouter()
  const { user } = useUser()
  const { createGoal } = useGoals()
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

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
    } else if (goalId === "manual") {
      setStep(2) // Move to manual goal form
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

  const [manualGoal, setManualGoal] = useState({
    title: "",
    description: "",
    start_date: "",
    end_date: "",
    smart_goal: {
      specific: "",
      measurable: "",
      achievable: "",
      relevant: "",
      timeBound: ""
    },
    reasoning: "",
    color: "#000000",
    initialTasks: [{ title: "", type: "daily" as "daily" | "weekly" | "custom" }],
    initialMilestones: [{ title: "", date: "" }]
  })

  const handleAddTask = () => {
    setManualGoal(prev => ({
      ...prev,
      initialTasks: [...prev.initialTasks, { title: "", type: "daily" as "daily" | "weekly" | "custom" }]
    }))
  }

  const handleAddMilestone = () => {
    setManualGoal(prev => ({
      ...prev,
      initialMilestones: [...prev.initialMilestones, { title: "", date: "" }]
    }))
  }

  const handleRemoveTask = (index: number) => {
    setManualGoal(prev => ({
      ...prev,
      initialTasks: prev.initialTasks.filter((_, i) => i !== index)
    }))
  }

  const handleRemoveMilestone = (index: number) => {
    setManualGoal(prev => ({
      ...prev,
      initialMilestones: prev.initialMilestones.filter((_, i) => i !== index)
    }))
  }

  const handleManualGoalSubmit = async () => {
    if (!user) {
      toast.error('You must be logged in to create a goal')
      return
    }

    try {
      const goal = await createGoal({
        title: manualGoal.title,
        description: manualGoal.description,
        start_date: manualGoal.start_date,
        end_date: manualGoal.end_date,
        smart_goal: manualGoal.smart_goal,
        reasoning: manualGoal.reasoning,
        color: manualGoal.color,
        progress: 0
      })

      if (goal) {
        // Create initial tasks
        for (const task of manualGoal.initialTasks) {
          if (task.title.trim()) {
            const { error: taskError } = await supabase
              .from('tasks')
              .insert({
                title: task.title,
                type: task.type,
                completed: false,
                date: new Date().toISOString(),
                goal_id: goal.id,
                user_id: user.id
              })

            if (taskError) {
              console.error('Error creating task:', taskError)
            }
          }
        }

        // Create initial milestones
        for (const milestone of manualGoal.initialMilestones) {
          if (milestone.title.trim()) {
            const { error: milestoneError } = await supabase
              .from('milestones')
              .insert({
                title: milestone.title,
                date: milestone.date,
                completed: false,
                goal_id: goal.id
              })

            if (milestoneError) {
              console.error('Error creating milestone:', milestoneError)
            }
          }
        }

        toast.success('Goal created successfully!')
        router.push('/dashboard')
      }
    } catch (error) {
      console.error('Error creating manual goal:', error)
      toast.error('Failed to create goal')
    }
  }

  const renderManualGoalForm = () => (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-center">Create Manual Goal</h2>
      <Card>
        <CardContent className="pt-6">
          <form className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Goal Title</Label>
              <Input
                id="title"
                value={manualGoal.title}
                onChange={(e) => setManualGoal(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter your goal title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={manualGoal.description}
                onChange={(e) => setManualGoal(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe your goal"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start-date">Start Date</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={manualGoal.start_date}
                  onChange={(e) => setManualGoal(prev => ({ ...prev, start_date: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end-date">End Date</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={manualGoal.end_date}
                  onChange={(e) => setManualGoal(prev => ({ ...prev, end_date: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold">SMART Goal Details</h3>
              
              <div className="space-y-2">
                <Label htmlFor="specific">Specific</Label>
                <Textarea
                  id="specific"
                  value={manualGoal.smart_goal.specific}
                  onChange={(e) => setManualGoal(prev => ({
                    ...prev,
                    smart_goal: { ...prev.smart_goal, specific: e.target.value }
                  }))}
                  placeholder="What exactly do you want to accomplish?"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="measurable">Measurable</Label>
                <Textarea
                  id="measurable"
                  value={manualGoal.smart_goal.measurable}
                  onChange={(e) => setManualGoal(prev => ({
                    ...prev,
                    smart_goal: { ...prev.smart_goal, measurable: e.target.value }
                  }))}
                  placeholder="How will you track progress?"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="achievable">Achievable</Label>
                <Textarea
                  id="achievable"
                  value={manualGoal.smart_goal.achievable}
                  onChange={(e) => setManualGoal(prev => ({
                    ...prev,
                    smart_goal: { ...prev.smart_goal, achievable: e.target.value }
                  }))}
                  placeholder="Is this goal realistic?"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="relevant">Relevant</Label>
                <Textarea
                  id="relevant"
                  value={manualGoal.smart_goal.relevant}
                  onChange={(e) => setManualGoal(prev => ({
                    ...prev,
                    smart_goal: { ...prev.smart_goal, relevant: e.target.value }
                  }))}
                  placeholder="Why is this goal important to you?"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="timeBound">Time-bound</Label>
                <Textarea
                  id="timeBound"
                  value={manualGoal.smart_goal.timeBound}
                  onChange={(e) => setManualGoal(prev => ({
                    ...prev,
                    smart_goal: { ...prev.smart_goal, timeBound: e.target.value }
                  }))}
                  placeholder="What's your timeline for this goal?"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Initial Tasks</h3>
                <Button type="button" variant="outline" size="sm" onClick={handleAddTask}>
                  Add Task
                </Button>
              </div>
              {manualGoal.initialTasks.map((task, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={task.title}
                    onChange={(e) => {
                      const newTasks = [...manualGoal.initialTasks]
                      newTasks[index].title = e.target.value
                      setManualGoal(prev => ({ ...prev, initialTasks: newTasks }))
                    }}
                    placeholder="Task title"
                  />
                  <Select
                    value={task.type}
                    onValueChange={(value: 'daily' | 'weekly' | 'custom') => {
                      const newTasks = [...manualGoal.initialTasks]
                      newTasks[index].type = value
                      setManualGoal(prev => ({ ...prev, initialTasks: newTasks }))
                    }}
                  >
                    <SelectTrigger className="w-[150px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveTask(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Milestones</h3>
                <Button type="button" variant="outline" size="sm" onClick={handleAddMilestone}>
                  Add Milestone
                </Button>
              </div>
              {manualGoal.initialMilestones.map((milestone, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={milestone.title}
                    onChange={(e) => {
                      const newMilestones = [...manualGoal.initialMilestones]
                      newMilestones[index].title = e.target.value
                      setManualGoal(prev => ({ ...prev, initialMilestones: newMilestones }))
                    }}
                    placeholder="Milestone title"
                  />
                  <Input
                    type="date"
                    value={milestone.date}
                    onChange={(e) => {
                      const newMilestones = [...manualGoal.initialMilestones]
                      newMilestones[index].date = e.target.value
                      setManualGoal(prev => ({ ...prev, initialMilestones: newMilestones }))
                    }}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveMilestone(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </form>
        </CardContent>
        <CardFooter>
          <Button className="w-full" onClick={handleManualGoalSubmit}>Create Goal</Button>
        </CardFooter>
      </Card>
    </div>
  )

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-center">Choose Your Goal</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        return selectedGoal === "manual" ? renderManualGoalForm() : (
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