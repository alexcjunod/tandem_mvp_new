"use client"

import { useState, useMemo, useEffect } from 'react'
import { Plus, Target, TrendingUp, Calendar as CalendarIcon, BookOpen, Link } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
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
import { format, isSameDay, startOfWeek, endOfWeek } from 'date-fns'
import ReactConfetti from 'react-confetti'
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

interface Milestone {
  id: string
  title: string
  date: string
  completed: boolean
  goalId: string
}

interface Task {
  id: string
  title: string
  completed: boolean
  date: string
  goalId: string
  type: 'daily' | 'weekly' | 'custom'
}

interface Goal {
  id: string
  title: string
  progress: number
  color: string
}

interface Reflection {
  id: string
  date: string
  content: string
  goalId: string
}

interface Resource {
  id: string
  title: string
  url: string
  goalId: string
}

const initialGoals: Goal[] = [
  { id: '1', title: "Run a Marathon", progress: 45, color: "hsl(var(--chart-1))" },
  { id: '2', title: "Learn Guitar", progress: 70, color: "hsl(var(--chart-2))" },
]

const initialTasks: Task[] = [
  { id: 't1', title: "Complete scheduled training run", completed: false, date: "2024-03-15", goalId: '1', type: 'daily' },
  { id: 't2', title: "Do stretching routine", completed: false, date: "2024-03-15", goalId: '1', type: 'daily' },
  { id: 't3', title: "Log workout details", completed: false, date: "2024-03-15", goalId: '1', type: 'daily' },
  { id: 't4', title: "Practice chords", completed: false, date: "2024-03-15", goalId: '2', type: 'daily' },
  { id: 't5', title: "Practice scales", completed: false, date: "2024-03-15", goalId: '2', type: 'daily' },
  { id: 't6', title: "Long training run", completed: false, date: "2024-03-16", goalId: '1', type: 'weekly' },
  { id: 't7', title: "Learn new song", completed: false, date: "2024-03-16", goalId: '2', type: 'weekly' },
  { id: 't8', title: "Prepare for local 5K", completed: false, date: "2024-03-20", goalId: '1', type: 'custom' },
]

const initialMilestones: Milestone[] = [
  { id: 'm1', title: "Complete 5K", date: "2024-03-31", completed: false, goalId: '1' },
  { id: 'm2', title: "Finish 10K race", date: "2024-06-30", completed: false, goalId: '1' },
  { id: 'm3', title: "Master basic chords", date: "2024-04-30", completed: false, goalId: '2' },
  { id: 'm4', title: "Play first song", date: "2024-06-30", completed: false, goalId: '2' },
]

const initialReflections: Reflection[] = [
  { id: 'r1', date: "2024-03-14", content: "Feeling good about my progress in running. Need to focus more on stretching.", goalId: '1' },
  { id: 'r2', date: "2024-03-13", content: "Learned a new chord progression today. Excited to incorporate it into a song.", goalId: '2' },
]

const initialResources: Resource[] = [
  { id: 'res1', title: "Beginner's Guide to Marathon Training", url: "https://example.com/marathon-guide", goalId: '1' },
  { id: 'res2', title: "Online Guitar Lessons", url: "https://example.com/guitar-lessons", goalId: '2' },
]

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
      handleResize()
      
      return () => window.removeEventListener('resize', handleResize)
    }
  }, [])

  return windowSize
}

export default function Dashboard() {
  const router = useRouter()
  const { width, height } = useWindowSize()
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [goals, setGoals] = useState<Goal[]>(initialGoals)
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [milestones, setMilestones] = useState<Milestone[]>(initialMilestones)
  const [reflections, setReflections] = useState<Reflection[]>(initialReflections)
  const [resources, setResources] = useState<Resource[]>(initialResources)
  const [showConfetti, setShowConfetti] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState("")
  const [newTaskGoalId, setNewTaskGoalId] = useState("")
  const [newTaskType, setNewTaskType] = useState<'daily' | 'weekly' | 'custom'>('daily')
  const [newReflectionContent, setNewReflectionContent] = useState("")
  const [newReflectionGoalId, setNewReflectionGoalId] = useState("")
  const [newResourceTitle, setNewResourceTitle] = useState("")
  const [newResourceUrl, setNewResourceUrl] = useState("")
  const [newResourceGoalId, setNewResourceGoalId] = useState("")
  const [selectedGoalId, setSelectedGoalId] = useState<string>("all")

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

  const chartData = useMemo(() => {
    return goals.map(goal => ({
      id: goal.id,
      progress: goal.progress,
      fill: goal.color
    }))
  }, [goals])

  const filteredTasks = useMemo(() => {
    if (selectedGoalId === "all") return tasks
    return tasks.filter(task => task.goalId === selectedGoalId)
  }, [tasks, selectedGoalId])

  const dailyTasks = useMemo(() => filteredTasks.filter(task => task.type === 'daily'), [filteredTasks])
  const weeklyTasks = useMemo(() => filteredTasks.filter(task => task.type === 'weekly'), [filteredTasks])
  const customTasks = useMemo(() => filteredTasks.filter(task => task.type === 'custom'), [filteredTasks])

  const tasksForSelectedDate = useMemo(() => {
    return filteredTasks.filter(task => 
      isSameDay(new Date(task.date), selectedDate)
    )
  }, [filteredTasks, selectedDate])

  const milestonesForSelectedDate = useMemo(() => {
    return milestones.filter(milestone => 
      isSameDay(new Date(milestone.date), selectedDate) &&
      (selectedGoalId === "all" || milestone.goalId === selectedGoalId)
    )
  }, [milestones, selectedDate, selectedGoalId])

  const handleTaskToggle = (taskId: string) => {
    setTasks(prevTasks => 
      prevTasks.map(task =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      )
    )
  }

  const handleMilestoneToggle = (milestoneId: string) => {
    setMilestones(prevMilestones =>
      prevMilestones.map(milestone => {
        if (milestone.id === milestoneId) {
          const newCompleted = !milestone.completed
          if (newCompleted) {
            setShowConfetti(true)
            setTimeout(() => setShowConfetti(false), 3000)
          }
          return { ...milestone, completed: newCompleted }
        }
        return milestone
      })
    )
  }

  const handleAddTask = () => {
    if (newTaskTitle && newTaskGoalId) {
      const newTask: Task = {
        id: `task-${Date.now()}`,
        title: newTaskTitle,
        completed: false,
        date: selectedDate.toISOString().split('T')[0],
        goalId: newTaskGoalId,
        type: newTaskType
      }
      setTasks(prevTasks => [...prevTasks, newTask])
      setNewTaskTitle("")
      setNewTaskGoalId("")
      setNewTaskType('daily')
    }
  }

  const handleAddReflection = () => {
    if (newReflectionContent && newReflectionGoalId) {
      const newReflection: Reflection = {
        id: `reflection-${Date.now()}`,
        date: format(new Date(), 'yyyy-MM-dd'),
        content: newReflectionContent,
        goalId: newReflectionGoalId
      }
      setReflections(prevReflections => [...prevReflections, newReflection])
      setNewReflectionContent("")
      setNewReflectionGoalId("")
    }
  }

  const handleAddResource = () => {
    if (newResourceTitle && newResourceUrl && newResourceGoalId) {
      const newResource: Resource = {
        id: `resource-${Date.now()}`,
        title: newResourceTitle,
        url: newResourceUrl,
        goalId: newResourceGoalId
      }
      setResources(prevResources => [...prevResources, newResource])
      setNewResourceTitle("")
      setNewResourceUrl("")
      setNewResourceGoalId("")
    }
  }

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
              <SelectValue placeholder="Filter by goal" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Goals</SelectItem>
              {goals.map(goal => (
                <SelectItem key={goal.id} value={goal.id}>{goal.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => router.push('/onboarding')}>
            <Plus className="mr-2 h-4 w-4" /> New Goal
          </Button>
        </div>
      </header>

      <div className="grid gap-6 md:grid-cols-[1fr_300px]">
        {/* Left Column - Tasks and Reflections */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <Tabs defaultValue="daily" className="w-full">
                <div className="flex justify-between items-center mb-4">
                  <TabsList>
                    <TabsTrigger value="daily">Daily Tasks</TabsTrigger>
                    <TabsTrigger value="weekly">Weekly Tasks</TabsTrigger>
                    <TabsTrigger value="custom">Custom Tasks</TabsTrigger>
                  </TabsList>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="icon">
                        <CalendarIcon className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={(date) => date && setSelectedDate(date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <TabsContent value="daily" className="mt-4 space-y-4">
                  {dailyTasks.map(task => (
                    <TaskItem key={task.id} task={task} onToggle={handleTaskToggle} goals={goals} />
                  ))}
                </TabsContent>
                <TabsContent value="weekly" className="mt-4 space-y-4">
                  {weeklyTasks.map(task => (
                    <TaskItem key={task.id} task={task} onToggle={handleTaskToggle} goals={goals} />
                  ))}
                </TabsContent>
                <TabsContent value="custom" className="mt-4 space-y-4">
                  {customTasks.map(task => (
                    <TaskItem key={task.id} task={task} onToggle={handleTaskToggle} goals={goals} />
                  ))}
                </TabsContent>
              </Tabs>
            </CardHeader>
            <CardFooter>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Task
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Task</DialogTitle>
                    <DialogDescription>
                      Create a new task for your goals.
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
                      <Select value={newTaskGoalId} onValueChange={setNewTaskGoalId}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a goal" />
                        </SelectTrigger>
                        <SelectContent>
                          {goals.map(goal => (
                            <SelectItem key={goal.id} value={goal.id}>
                              {goal.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Select value={newTaskType} onValueChange={(value: 'daily' | 'weekly' | 'custom') => setNewTaskType(value)}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select task type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="custom">Custom</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleAddTask}>Add Task</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Milestones</CardTitle>
              <CardDescription>Your journey milestones</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                {milestones.filter(m => selectedGoalId === "all" || m.goalId === selectedGoalId).map((milestone) => (
                  <li key={milestone.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        checked={milestone.completed}
                        onCheckedChange={() => handleMilestoneToggle(milestone.id)}
                      />
                      <span className={`flex items-center space-x-2 ${milestone.completed ? 'line-through text-muted-foreground' : ''}`}>
                        <span>{milestone.title}</span>
                        <Badge variant="outline" className="ml-2">
                          {goals.find(g => g.id === milestone.goalId)?.title}
                        </Badge>
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

          {/* Reflections Card */}
          <Card>
            <CardHeader>
              <CardTitle>Reflections</CardTitle>
              <CardDescription>Journal your thoughts and progress</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                {reflections.filter(r => selectedGoalId === "all" || r.goalId === selectedGoalId).map(reflection => (
                  <li key={reflection.id} className="border-b pb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-muted-foreground">{format(new Date(reflection.date), 'MMMM d, yyyy')}</span>
                      <Badge variant="outline">
                        {goals.find(g => g.id === reflection.goalId)?.title}
                      </Badge>
                    </div>
                    <p className="text-sm">{reflection.content}</p>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full">
                    <BookOpen className="mr-2 h-4 w-4" />
                    Add Reflection
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Reflection</DialogTitle>
                    <DialogDescription>
                      Write a reflection on your progress.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <Textarea
                      placeholder="Your reflection..."
                      value={newReflectionContent}
                      onChange={(e) => setNewReflectionContent(e.target.value)}
                    />
                    <Select value={newReflectionGoalId} onValueChange={setNewReflectionGoalId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a goal" />
                      </SelectTrigger>
                      <SelectContent>
                        {goals.map(goal => (
                          <SelectItem key={goal.id} value={goal.id}>
                            {goal.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleAddReflection}>Add Reflection</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardFooter>
          </Card>
        </div>

        {/* Right Column - Progress Overview and Resources */}
        <div className="space-y-6">
          <Card className="flex flex-col">
            <CardHeader className="items-center pb-0">
              <CardTitle>Goal Progress</CardTitle>
              <CardDescription>Overall progress across all goals</CardDescription>
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
                Showing progress for all active goals
              </div>
            </CardFooter>
          </Card>

          {/* Resources Card */}
          <Card>
            <CardHeader>
              <CardTitle>Resources</CardTitle>
              <CardDescription>Helpful links and tools for your goals</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                {resources.filter(r => selectedGoalId === "all" || r.goalId === selectedGoalId).map(resource => (
                  <li key={resource.id} className="flex items-center justify-between">
                    <a href={resource.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline flex items-center">
                      <Link className="mr-2 h-4 w-4" />
                      {resource.title}
                    </a>
                    <Badge variant="outline">
                      {goals.find(g => g.id === resource.goalId)?.title}
                    </Badge>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Resource
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Resource</DialogTitle>
                    <DialogDescription>
                      Add a helpful resource for your goal.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <Input
                      placeholder="Resource title"
                      value={newResourceTitle}
                      onChange={(e) => setNewResourceTitle(e.target.value)}
                    />
                    <Input
                      placeholder="Resource URL"
                      value={newResourceUrl}
                      onChange={(e) => setNewResourceUrl(e.target.value)}
                    />
                    <Select value={newResourceGoalId} onValueChange={setNewResourceGoalId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a goal" />
                      </SelectTrigger>
                      <SelectContent>
                        {goals.map(goal => (
                          <SelectItem key={goal.id} value={goal.id}>
                            {goal.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleAddResource}>Add Resource</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}

interface TaskItemProps {
  task: Task
  onToggle: (taskId: string) => void
  goals: Goal[]
}

function TaskItem({ task, onToggle, goals }: TaskItemProps) {
  return (
    <div className="flex items-center space-x-2">
      <Checkbox 
        id={task.id}
        checked={task.completed}
        onCheckedChange={() => onToggle(task.id)}
      />
      <label
        htmlFor={task.id}
        className={`flex items-center space-x-2 text-sm font-medium leading-none ${
          task.completed ? 'line-through text-muted-foreground' : ''
        }`}
      >
        <span>{task.title}</span>
        <Badge variant="outline" className="ml-2">
          {goals.find(g => g.id === task.goalId)?.title}
        </Badge>
      </label>
    </div>
  )
}