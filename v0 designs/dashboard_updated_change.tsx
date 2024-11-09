"use client"

import { useState, useMemo, useEffect } from 'react'
import { Plus, Flame, Check, ChevronsUpDown, Target, TrendingUp, Calendar as CalendarIcon } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar } from "@/components/ui/calendar"
import { Progress } from "@/components/ui/progress"
import { useRouter } from 'next/navigation'
import { LabelList, RadialBar, RadialBarChart } from "recharts"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { format } from 'date-fns'
import ReactConfetti from 'react-confetti'
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

// Define interfaces
interface Milestone {
  title: string
  date: string
  completed: boolean
}

interface Task {
  id: string
  title: string
  completed: boolean
  type: 'daily' | 'weekly'
}

interface Goal {
  id: string
  title: string
  progress: number
  color: string
  tasks: Task[]
  milestones: Milestone[]
}

// Add a new interface for custom tasks
interface CustomTask {
  id: string
  title: string
  date: Date
  completed: boolean
}

// Initial mock data
const initialGoals: Goal[] = [
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
  {
    id: '2',
    title: "Learn Guitar",
    progress: 70,
    color: "hsl(var(--chart-2))",
    tasks: [
      { id: 'd4', title: "Practice chords", completed: false, type: 'daily' },
      { id: 'd5', title: "Practice scales", completed: false, type: 'daily' },
      { id: 'w4', title: "Learn new song", completed: false, type: 'weekly' },
      { id: 'w5', title: "Record practice session", completed: false, type: 'weekly' }
    ],
    milestones: [
      { title: "Master basic chords", date: "2024-04-30", completed: false },
      { title: "Play first song", date: "2024-06-30", completed: false },
      { title: "Perform for friends", date: "2024-09-30", completed: false }
    ]
  }
]

// Custom useWindowSize hook
function useWindowSize() {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  })

  useEffect(() => {
    function handleResize() {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('resize', handleResize)
      handleResize() // Call once to set initial size
      
      return () => window.removeEventListener('resize', handleResize)
    }
  }, [])

  return windowSize
}

export default function Dashboard() {
  const router = useRouter()
  const { width, height } = useWindowSize()
  const [date, setDate] = useState<Date>(new Date())
  const [selectedGoalId, setSelectedGoalId] = useState<string>("1")
  const [goals, setGoals] = useState<Goal[]>(initialGoals)
  const [showConfetti, setShowConfetti] = useState(false)
  const [customTasks, setCustomTasks] = useState<CustomTask[]>([])
  const [newTaskTitle, setNewTaskTitle] = useState("")
  const [newTaskDate, setNewTaskDate] = useState<Date | undefined>(new Date())

  // Get current goal
  const currentGoal = useMemo(() => {
    if (selectedGoalId === "all") {
      return goals[0]
    }
    return goals.find(g => g.id === selectedGoalId) || goals[0]
  }, [selectedGoalId, goals])

  // Get filtered tasks
  const dailyTasks = useMemo(() => {
    return currentGoal?.tasks.filter(task => task.type === 'daily') || []
  }, [currentGoal])

  const weeklyTasks = useMemo(() => {
    return currentGoal?.tasks.filter(task => task.type === 'weekly') || []
  }, [currentGoal])

  // Chart configuration
  const chartConfig = {
    progress: {
      label: "Progress",
    },
    ...goals.reduce((acc, goal) => ({
      ...acc,
      [goal.id]: {
        label: goal.title,
        color: goal.color
      }
    }), {})
  } satisfies ChartConfig

  // Chart data
  const chartData = useMemo(() => {
    if (selectedGoalId === "all") {
      return goals.map(goal => ({
        id: goal.id,
        progress: goal.progress,
        fill: goal.color
      }))
    }
    return [{
      id: currentGoal.id,
      progress: currentGoal.progress,
      fill: currentGoal.color
    }]
  }, [selectedGoalId, goals, currentGoal])

  // Handlers
  const handleTaskToggle = (taskId: string) => {
    setGoals(prevGoals => 
      prevGoals.map(goal => ({
        ...goal,
        tasks: goal.tasks.map(task =>
          task.id === taskId ? { ...task, completed: !task.completed } : task
        )
      }))
    )
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
                    // Show confetti when completing a milestone
                    setShowConfetti(true)
                    setTimeout(() => setShowConfetti(false), 3000) // Hide after 3 seconds
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

  const handleAddCustomTask = () => {
    if (newTaskTitle && newTaskDate) {
      const newTask: CustomTask = {
        id: `custom-${Date.now()}`,
        title: newTaskTitle,
        date: newTaskDate,
        completed: false
      }
      setCustomTasks(prevTasks => [...prevTasks, newTask])
      setNewTaskTitle("")
      setNewTaskDate(new Date())
    }
  }

  const handleCustomTaskToggle = (taskId: string) => {
    setCustomTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      )
    )
  }

  // Get tasks for the selected date
  const tasksForSelectedDate = useMemo(() => {
    return customTasks.filter(task => 
      task.date.toDateString() === date.toDateString()
    )
  }, [customTasks, date])

  // Format date consistently
  const formatDate = (date: string) => {
    return format(new Date(date), 'dd/MM/yyyy')
  }

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
          <Select value={selectedGoalId} onValueChange={setSelectedGoalId}>
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
                <TabsContent value="weekly" className="mt-4">
                  <div className="space-y-4">
                    {weeklyTasks.map(task => (
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
                <TabsContent value="custom" className="mt-4">
                  <div className="space-y-4">
                    {tasksForSelectedDate.map(task => (
                      <div key={task.id} className="flex items-center space-x-2">
                        <Checkbox 
                          id={task.id}
                          checked={task.completed}
                          onCheckedChange={() => handleCustomTaskToggle(task.id)}
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
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline">Add Custom Task</Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add Custom Task</DialogTitle>
                          <DialogDescription>
                            Create a new task for any date.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Input
                              id="task-title"
                              placeholder="Task title"
                              className="col-span-4"
                              value={newTaskTitle}
                              onChange={(e) => setNewTaskTitle(e.target.value)}
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "w-full justify-start text-left font-normal",
                                    !newTaskDate && "text-muted-foreground"
                                  
                                  )}
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {newTaskDate ? format(newTaskDate, "PPP") : <span>Pick a date</span>}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0">
                                <Calendar
                                  mode="single"
                                  selected={newTaskDate}
                                  onSelect={setNewTaskDate}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button onClick={handleAddCustomTask}>Add Task</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </TabsContent>
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
                      {formatDate(milestone.date)}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Progress Overview */}
        <div className="space-y-6">
          <Card className="flex flex-col">
            <CardHeader className="items-center pb-0">
              <CardTitle>Goal Progress</CardTitle>
              <CardDescription>
                {selectedGoalId === "all" 
                  ? "Overall progress across all goals"
                  : `Progress for ${goals.find(g => g.id === selectedGoalId)?.title}`}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 pb-0">
              <ChartContainer
                config={chartConfig}
                className="mx-auto aspect-square max-h-[250px]"
              >
                <RadialBarChart
                  data={chartData}
                  startAngle={-90}
                  endAngle={380}
                  innerRadius={30}
                  outerRadius={110}
                >
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent hideLabel nameKey="id" />}
                  />
                  <RadialBar dataKey="progress" background>
                    <LabelList
                      position="insideStart"
                      dataKey="id"
                      className="fill-white capitalize mix-blend-luminosity"
                      fontSize={11}
                    />
                  </RadialBar>
                </RadialBarChart>
              </ChartContainer>
            </CardContent>
            <CardFooter className="flex-col gap-2 text-sm">
              <div className="leading-none text-muted-foreground">
                {selectedGoalId === "all" 
                  ? "Showing progress for all active goals"
                  : "Showing detailed progress for selected goal"}
              </div>
            </CardFooter>
          </Card>

          {/* Calendar Card */}
          <Card>
            <CardHeader>
              <CardTitle>Calendar</CardTitle>
              <CardDescription>View your milestone dates and custom tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={date}
                onSelect={(newDate) => newDate && setDate(newDate)}
                className="rounded-md border"
                modifiers={{
                  milestone: currentGoal.milestones.map(m => new Date(m.date)),
                  customTask: customTasks.map(t => t.date)
                }}
                modifiersStyles={{
                  milestone: { 
                    fontWeight: 'bold',
                    backgroundColor: 'hsl(var(--primary))',
                    color: 'hsl(var(--primary-foreground))'
                  },
                  customTask: {
                    fontWeight: 'bold',
                    backgroundColor: 'hsl(var(--secondary))',
                    color: 'hsl(var(--secondary-foreground))'
                  }
                }}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}