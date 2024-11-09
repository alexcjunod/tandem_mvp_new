"use client"

import { useState, useMemo, useEffect } from 'react'
import { Plus, Target, Calendar as CalendarIcon } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import ReactConfetti from 'react-confetti'
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabase/client"
import { toast } from "sonner"
import type { CustomTask } from "@/types"

// Initial mock data (we'll move this to Supabase later)
const initialGoals = [
  {
    id: '1',
    title: "Run a Marathon",
    progress: 45,
    color: "hsl(var(--chart-1))",
    tasks: [
      { id: 'd1', title: "Complete scheduled training run", completed: false, type: 'daily' },
      { id: 'd2', title: "Do stretching routine", completed: false, type: 'daily' },
      { id: 'd3', title: "Log workout details", completed: false, type: 'daily' },
      { id: 'w1', title: "Long training run", completed: false, type: 'weekly' },
      { id: 'w2', title: "Review weekly mileage", completed: false, type: 'weekly' },
      { id: 'w3', title: "Plan next week's routes", completed: false, type: 'weekly' }
    ],
    milestones: [
      { title: "Complete 5K", date: "2024-03-31", completed: false },
      { title: "Finish 10K race", date: "2024-06-30", completed: false },
      { title: "Run Half Marathon", date: "2024-09-30", completed: false },
      { title: "Complete 30K training", date: "2024-11-30", completed: false }
    ]
  },
  // ... other initial goals
]

// Custom hook for window size
function useWindowSize() {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }

    window.addEventListener('resize', handleResize)
    handleResize()
    
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return windowSize
}

export default function Dashboard() {
  const router = useRouter()
  const { width, height } = useWindowSize()
  const [date, setDate] = useState<Date>(new Date())
  const [selectedGoalId, setSelectedGoalId] = useState<string>("1")
  const [goals, setGoals] = useState(initialGoals)
  const [showConfetti, setShowConfetti] = useState(false)
  const [customTasks, setCustomTasks] = useState<CustomTask[]>([])
  const [newTaskTitle, setNewTaskTitle] = useState("")
  const [newTaskDate, setNewTaskDate] = useState<Date | undefined>(new Date())

  // Get current goal
  const currentGoal = useMemo(() => {
    return selectedGoalId === "all" 
      ? goals[0] 
      : goals.find(g => g.id === selectedGoalId) || goals[0]
  }, [selectedGoalId, goals])

  // Get filtered tasks
  const dailyTasks = useMemo(() => {
    return currentGoal?.tasks.filter(task => task.type === 'daily') || []
  }, [currentGoal])

  const weeklyTasks = useMemo(() => {
    return currentGoal?.tasks.filter(task => task.type === 'weekly') || []
  }, [currentGoal])

  // Handlers
  const handleTaskToggle = async (taskId: string) => {
    if (!currentGoal) return

    try {
      const task = currentGoal.tasks.find(t => t.id === taskId)
      if (!task) return

      const { error } = await supabase
        .from('tasks')
        .update({ completed: !task.completed })
        .eq('id', taskId)

      if (error) throw error

      setGoals(prevGoals => 
        prevGoals.map(goal => ({
          ...goal,
          tasks: goal.tasks.map(t =>
            t.id === taskId ? { ...t, completed: !t.completed } : t
          )
        }))
      )
    } catch (error) {
      console.error('Error toggling task:', error)
      toast.error("Failed to update task")
    }
  }

  const handleMilestoneToggle = (index: number) => {
    setGoals(prevGoals =>
      prevGoals.map(goal =>
        goal.id === currentGoal.id
          ? {
              ...goal,
              milestones: goal.milestones.map((milestone, i) => {
                if (i === index) {
                  const newCompleted = !milestone.completed
                  if (newCompleted) {
                    setShowConfetti(true)
                    setTimeout(() => setShowConfetti(false), 3000)
                  }
                  return { ...milestone, completed: newCompleted }
                }
                return milestone
              })
            }
          : goal
      )
    )
  }

  // ... rest of your handlers with Supabase integration

  return (
    <div className="container mx-auto p-6">
      {showConfetti && (
        <ReactConfetti
          width={width}
          height={height}
          recycle={false}
          numberOfPieces={200}
          gravity={0.2}
        />
      )}
      
      <header className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Target className="h-8 w-8" />
            Goals Dashboard
          </h1>
          <p className="text-muted-foreground">Track your progress across all goals</p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={selectedGoalId || ""} onValueChange={setSelectedGoalId}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select a goal" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Goals</SelectItem>
              {goals.map(goal => (
                <SelectItem key={goal.id} value={goal.id}>
                  {goal.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => router.push('/onboarding')}>
            <Plus className="mr-2 h-4 w-4" /> New Goal
          </Button>
        </div>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Left Column - Tasks */}
        <div className="space-y-6">
          <Card className="w-full">
            <CardHeader className="pb-3">
              <Tabs defaultValue="daily" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="daily">Daily Tasks</TabsTrigger>
                  <TabsTrigger value="weekly">Weekly Tasks</TabsTrigger>
                  <TabsTrigger value="custom">Custom Tasks</TabsTrigger>
                </TabsList>
                <TabsContent value="daily" className="mt-4">
                  <div className="space-y-4">
                    {dailyTasks.map(task => (
                      <div key={task.id} className="flex items-center space-x-2">
                        <Checkbox 
                          id={task.id}
                          checked={task.completed}
                          onCheckedChange={() => handleTaskToggle(task.id)}
                        />
                        <label
                          htmlFor={task.id}
                          className={`text-sm font-medium leading-none ${
                            task.completed ? 'line-through text-muted-foreground' : ''
                          }`}
                        >
                          {task.title}
                        </label>
                      </div>
                    ))}
                  </div>
                </TabsContent>
                {/* ... other tabs content ... */}
              </Tabs>
            </CardHeader>
          </Card>

          {/* Milestones Card */}
          <Card>
            <CardHeader>
              <CardTitle>Milestones</CardTitle>
              <CardDescription>Your journey to {currentGoal.title}</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                {currentGoal.milestones.map((milestone, index) => (
                  <li key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        checked={milestone.completed}
                        onCheckedChange={() => handleMilestoneToggle(index)}
                      />
                      <span className={milestone.completed ? 'line-through text-muted-foreground' : ''}>
                        {milestone.title}
                      </span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(milestone.date), 'dd/MM/yyyy')}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Calendar</CardTitle>
              <CardDescription>View your milestone dates and tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={date}
                onSelect={(newDate) => newDate && setDate(newDate)}
                className="rounded-md border"
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}