"use client"

import { useState } from "react"
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, Cigarette, Timer, Plus, Target, Send, Sparkles, Check, Trash2, Brain } from "lucide-react"
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
import AIChat from "@/components/goals/ai-chat"
import { Goal } from "@/types/goals"

interface Task {
  title: string
  type: 'daily' | 'weekly' | 'custom'
  weekday?: number
}

interface PresetGoal {
  id: string
  title: string
  icon: any
  smart_goal: {
    specific: string
    measurable: string
    achievable: string
    relevant: string
    timeBound: string
  }
  tasks: Task[]
  milestones: {
    title: string
    date: string
  }[]
}

interface SimpleGoal {
  id: string
  title: string
  icon: any
}

const popularGoals: (PresetGoal | SimpleGoal)[] = [
  { 
    id: "marathon-sub-430", 
    title: "Complete a Marathon in Under 4:30",
    icon: Timer,
    smart_goal: {
      specific: "Follow a 16-week training plan to complete a marathon in under 4 hours and 30 minutes.",
      measurable: "Track daily runs, distances, and paces using a running app or GPS watch.",
      achievable: "Train consistently with a mix of easy runs, long runs, speed work, and rest days.",
      relevant: "Achieving this goal will improve endurance and personal fitness.",
      timeBound: "Complete the marathon 16 weeks from the start of the training plan."
    },
    tasks: [
      // Daily tasks for tracking and preparation
      { title: "Log today's run details (distance, pace, effort)", type: "daily" },
      { title: "Check tomorrow's training plan", type: "daily" },
      { title: "Post-run stretching routine", type: "daily" },
      { title: "Prepare running gear for tomorrow", type: "daily" },
      
      // Weekly schedule based on Runner's World Sub-4:30 plan
      { title: "Easy Run (45-60 mins)", type: "weekly", weekday: 1 }, // Monday
      { title: "Speed Work: Intervals/Tempo", type: "weekly", weekday: 2 }, // Tuesday
      { title: "Schedule: Rest Day", type: "weekly", weekday: 3 }, // Wednesday
      { title: "Mid-Week Long Run", type: "weekly", weekday: 4 }, // Thursday
      { title: "Easy Run or Cross-Train", type: "weekly", weekday: 5 }, // Friday
      { title: "Schedule: Rest Day", type: "weekly", weekday: 6 }, // Saturday
      { title: "Long Run", type: "weekly", weekday: 0 }, // Sunday
      
      // Weekly planning tasks
      { title: "Plan next week's routes", type: "weekly", weekday: 6 }, // Saturday
      { title: "Review weekly progress", type: "weekly", weekday: 6 }, // Saturday
      { title: "Check gear condition", type: "weekly", weekday: 6 } // Saturday
    ],
    milestones: [
      { title: "Complete 10-mile Long Run", date: "+21" },
      { title: "Complete 15-mile Long Run", date: "+42" },
      { title: "Complete 20-mile Long Run", date: "+63" },
      { title: "Begin Tapering Phase", date: "+84" },
      { title: "Race Day: Marathon", date: "+112" }
    ]
  } as PresetGoal,
  { 
    id: "quit-smoking-goal", 
    title: "Stop Smoking",
    icon: Cigarette,
    smart_goal: {
      specific: "Quit smoking entirely by gradually reducing cigarette use.",
      measurable: "Track the number of cigarettes smoked daily and aim for zero by the target date.",
      achievable: "Use nicotine replacement therapy (NRT) and support groups.",
      relevant: "Improve health, save money, and enhance quality of life.",
      timeBound: "Quit smoking within 8 weeks."
    },
    tasks: [
      { title: "Track daily cigarette count", type: "daily", weekday: 0 },
      { title: "Replace one cigarette with NRT daily", type: "daily", weekday: 0 },
      { title: "Join a support group or app", type: "weekly", weekday: 3 }, // Wednesday
      { title: "Practice stress management techniques", type: "daily", weekday: 0 }
    ],
    milestones: [
      { title: "Reduce smoking by 50%", date: "+14" },
      { title: "Switch to NRT for all cravings", date: "+28" },
      { title: "Smoke-free for 1 week", date: "+49" },
      { title: "Smoke-free for 1 month", date: "+63" }
    ]
  } as PresetGoal,
  { id: "manual", title: "Create Manual Goal", icon: Target },
  { id: "ai", title: "Create with AI", icon: Brain }
]

// Add utility functions
const filterTasks = (tasks: Task[], view: 'daily' | 'weekly' | 'all') => {
  const today = new Date();
  const currentDayOfWeek = today.getDay();

  switch (view) {
    case 'daily':
      return tasks.filter(task => 
        task.type === 'daily' || 
        (task.type === 'weekly' && task.weekday === currentDayOfWeek)
      ).sort((a, b) => {
        if (a.type === 'daily' && b.type === 'weekly') return -1;
        if (a.type === 'weekly' && b.type === 'daily') return 1;
        return a.title.localeCompare(b.title);
      });

    case 'weekly':
      return tasks
        .filter(task => task.type === 'weekly')
        .sort((a, b) => {
          if (a.weekday === undefined || b.weekday === undefined) return 0;
          if (a.weekday !== b.weekday) return a.weekday - b.weekday;
          return a.title.localeCompare(b.title);
        });

    default:
      return tasks.sort((a, b) => {
        if (a.type !== b.type) return a.type === 'daily' ? -1 : 1;
        return a.title.localeCompare(b.title);
      });
  }
};

const getWeekdayName = (weekday: number): string => {
  const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return weekdays[weekday];
};

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

  const [manualGoal, setManualGoal] = useState<{
    title: string;
    description: string;
    start_date: string;
    end_date: string;
    smart_goal: {
      specific: string;
      measurable: string;
      achievable: string;
      relevant: string;
      timeBound: string;
    };
    reasoning: string;
    color: string;
    initialTasks: Task[];
    initialMilestones: { title: string; date: string; }[];
  }>({
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
    initialTasks: [{ 
      title: "", 
      type: "daily",
      weekday: 0
    }],
    initialMilestones: [{ title: "", date: "" }]
  })

  const handleGoalSelect = (goalId: string) => {
    setSelectedGoal(goalId)
    if (goalId === "ai") {
      setStep(3)
    } else if (goalId === "manual") {
      setStep(2)
    } else {
      const selectedGoalData = popularGoals.find(g => g.id === goalId) as PresetGoal
      if (selectedGoalData && 'smart_goal' in selectedGoalData) {
        const today = new Date()
        setManualGoal({
          ...manualGoal,
          title: selectedGoalData.title,
          start_date: today.toISOString().split('T')[0],
          smart_goal: selectedGoalData.smart_goal,
          initialTasks: selectedGoalData.tasks.map(task => ({
            title: task.title,
            type: task.type,
            ...(task.type === 'weekly' ? { weekday: task.weekday ?? 0 } : {})
          })),
          initialMilestones: selectedGoalData.milestones.map(m => ({
            title: m.title,
            date: new Date(today.getTime() + parseInt(m.date.slice(1)) * 24 * 60 * 60 * 1000)
              .toISOString().split('T')[0]
          }))
        })
      }
      setStep(2)
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

  const handleAddTask = () => {
    setManualGoal(prev => ({
      ...prev,
      initialTasks: [...prev.initialTasks, { 
        title: "", 
        type: "daily",
        weekday: 0
      }]
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
            const taskData = {
              title: task.title,
              type: task.type,
              completed: false,
              goal_id: goal.id,
              user_id: user.id,
              date: new Date().toISOString().split('T')[0],
              weekday: task.type === 'weekly' ? (task.weekday ?? 0) : null
            };

            console.log('Creating task with data:', taskData);

            const { error: taskError } = await supabase
              .from('tasks')
              .insert(taskData)

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
                  {task.type === 'weekly' && (
                    <Select
                      value={String(task.weekday || 0)}
                      onValueChange={(value) => {
                        const newTasks = [...manualGoal.initialTasks]
                        newTasks[index].weekday = parseInt(value)
                        setManualGoal(prev => ({ ...prev, initialTasks: newTasks }))
                      }}
                    >
                      <SelectTrigger className="w-[150px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">Sunday</SelectItem>
                        <SelectItem value="1">Monday</SelectItem>
                        <SelectItem value="2">Tuesday</SelectItem>
                        <SelectItem value="3">Wednesday</SelectItem>
                        <SelectItem value="4">Thursday</SelectItem>
                        <SelectItem value="5">Friday</SelectItem>
                        <SelectItem value="6">Saturday</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
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
              {selectedGoal === "quit-smoking-goal" ? "Stop Smoking" : "Marathon Training Plan"}
            </h2>
            <Card>
              <CardContent className="pt-6">
                <form className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="end-date">Target Race Date</Label>
                    {selectedGoal === "marathon-sub-430" && (
                      <div className="text-sm text-muted-foreground mb-2">
                        <p>💡 Based on Runner's World training plans, we recommend selecting a race date that's:</p>
                        <ul className="list-disc list-inside mt-1 ml-2">
                          <li>At least 16 weeks from today (for proper training)</li>
                          <li>During cooler months (Spring/Fall) for optimal performance</li>
                          <li>A Saturday or Sunday (most marathons are on weekends)</li>
                        </ul>
                      </div>
                    )}
                    <Input 
                      type="date" 
                      id="end-date"
                      value={manualGoal.end_date}
                      min={new Date(Date.now() + 16 * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                      onChange={(e) => {
                        const selectedGoalData = popularGoals.find(g => g.id === selectedGoal) as PresetGoal
                        if (selectedGoalData && 'smart_goal' in selectedGoalData) {
                          const today = new Date()
                          setManualGoal({
                            ...manualGoal,
                            title: selectedGoalData.title,
                            start_date: today.toISOString().split('T')[0],
                            end_date: e.target.value,
                            smart_goal: selectedGoalData.smart_goal,
                            initialTasks: selectedGoalData.tasks.map(task => ({
                              title: task.title,
                              type: task.type,
                              ...(task.type === 'weekly' ? { weekday: task.weekday ?? 0 } : {})
                            })),
                            initialMilestones: selectedGoalData.milestones.map(m => ({
                              title: m.title,
                              date: new Date(today.getTime() + parseInt(m.date.slice(1)) * 24 * 60 * 60 * 1000)
                                .toISOString().split('T')[0]
                            }))
                          })
                        }
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="motivation">What's your primary motivation?</Label>
                    <Textarea 
                      id="motivation"
                      value={manualGoal.reasoning}
                      onChange={(e) => setManualGoal(prev => ({ 
                        ...prev, 
                        reasoning: e.target.value 
                      }))}
                      placeholder="What inspired you to take on this marathon challenge?"
                    />
                  </div>
                </form>
              </CardContent>
              <CardFooter>
                <Button className="w-full" onClick={handleManualGoalSubmit}>Set Goal</Button>
              </CardFooter>
            </Card>
          </div>
        )
      case 3:
        return selectedGoal === "ai" ? (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-center">Create with AI</h2>
            <AIChat 
              onGoalCreated={(goal: Goal) => {
                if (goal) {
                  router.push(`/goals/${goal.id}`);
                }
              }} 
            />
          </div>
        ) : (
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
                <Button className="w-full" onClick={() => router.push('/dashboard')}>
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
        {renderStep()}
      </div>
    </div>
  )
}