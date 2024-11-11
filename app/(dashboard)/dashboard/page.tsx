"use client"

import { useState, useEffect, useMemo } from 'react'
import { Plus, Target, Calendar as CalendarIcon, BookOpen, Link } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Calendar } from "@/components/ui/calendar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useRouter } from 'next/navigation'
import { RadialBarChart, RadialBar, ResponsiveContainer, Cell } from "recharts"
import { format, isSameDay } from 'date-fns'
import { toast } from 'sonner'
import ReactConfetti from 'react-confetti'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useUser, useAuth } from "@clerk/nextjs"
import { supabase } from "@/lib/supabase/client"
import { updateSupabaseAuthToken } from "@/lib/supabase/client"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { getGoals } from "@/lib/supabase/service"
import { Goal, Task, Milestone } from '@/types'

interface Task {
  id: string
  title: string
  completed: boolean
  date: string
  goalId?: string
  type: 'daily' | 'weekly' | 'custom'
  tag?: string
  user_id: string
}

// Add this interface near the top with other interfaces
interface Goal {
  id: string
  title: string
  progress: number
  color: string
  tasks: Task[]
  milestones: {
    title: string
    date: string
    completed: boolean
  }[]
}

// Add this interface with the other interfaces
interface Reflection {
  id: string
  date: string
  content: string
  goalId: string
}

// Add this interface with the other interfaces
interface Resource {
  id: string
  title: string
  url: string
  goalId: string
}

// Initial mock data (we'll move this to Supabase later)
const initialGoals = [
  {
    id: '1',
    title: "Run a Marathon",
    progress: 45,
    color: "hsl(10, 70%, 50%)", // Warm red
    tasks: [
      { id: 'd1', title: "Complete scheduled training run", completed: false, type: 'daily', date: new Date().toISOString(), goalId: '1' },
      { id: 'd2', title: "Do stretching routine", completed: false, type: 'daily', date: new Date().toISOString(), goalId: '1' },
      { id: 'd3', title: "Log workout details", completed: false, type: 'daily', date: new Date().toISOString(), goalId: '1' },
      { id: 'w1', title: "Long training run", completed: false, type: 'weekly', date: new Date().toISOString(), goalId: '1' },
      { id: 'w2', title: "Review weekly mileage", completed: false, type: 'weekly', date: new Date().toISOString(), goalId: '1' },
      { id: 'w3', title: "Plan next week's routes", completed: false, type: 'weekly', date: new Date().toISOString(), goalId: '1' }
    ],
    milestones: [
      { title: "Complete 5K", date: "2024-03-31", completed: false },
      { title: "Finish Half Marathon", date: "2024-06-30", completed: false }
    ]
  },
  {
    id: '2',
    title: "Learn Guitar",
    progress: 70,
    color: "hsl(200, 70%, 50%)", // Blue
    tasks: [
      { id: 'g1', title: "Practice basic chords", completed: false, type: 'daily', date: new Date().toISOString(), goalId: '2' },
      { id: 'g2', title: "Watch tutorial video", completed: false, type: 'daily', date: new Date().toISOString(), goalId: '2' },
      { id: 'g3', title: "Practice scales", completed: false, type: 'weekly', date: new Date().toISOString(), goalId: '2' }
    ],
    milestones: [
      { title: "Master basic chords", date: "2024-04-15", completed: false }
    ]
  },
  {
    id: '3',
    title: "Read 24 Books",
    progress: 25,
    color: "hsl(150, 70%, 50%)", // Green
    tasks: [
      { id: 'b1', title: "Read 30 minutes", completed: false, type: 'daily', date: new Date().toISOString(), goalId: '3' },
      { id: 'b2', title: "Write book summary", completed: false, type: 'weekly', date: new Date().toISOString(), goalId: '3' }
    ],
    milestones: [
      { title: "Complete 12 books", date: "2024-06-30", completed: false }
    ]
  },
  {
    id: '4',
    title: "Learn Spanish",
    progress: 60,
    color: "hsl(280, 70%, 50%)", // Purple
    tasks: [
      { id: 's1', title: "Practice vocabulary", completed: false, type: 'daily', date: new Date().toISOString(), goalId: '4' },
      { id: 's2', title: "Watch Spanish show", completed: false, type: 'weekly', date: new Date().toISOString(), goalId: '4' }
    ],
    milestones: [
      { title: "Complete beginner course", date: "2024-04-30", completed: false }
    ]
  }
]

// Add initial reflections data after initialGoals
const initialReflections: Reflection[] = [
  { id: 'r1', date: "2024-03-14", content: "Feeling good about my progress in running. Need to focus more on stretching.", goalId: '1' },
  { id: 'r2', date: "2024-03-13", content: "Learned a new chord progression today. Excited to incorporate it into a song.", goalId: '2' },
]

// Add initial resources data after initialReflections
const initialResources: Resource[] = [
  { id: 'res1', title: "Beginner's Guide to Marathon Training", url: "https://example.com/marathon-guide", goalId: '1' },
  { id: 'res2', title: "Online Guitar Lessons", url: "https://example.com/guitar-lessons", goalId: '2' },
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

// Add TaskItem component at the top level
interface TaskItemProps {
  task: Task
  onToggle: (taskId: string) => void
  goals: Goal[]
}

function TaskItem({ task, onToggle, goals }: TaskItemProps) {
  const goal = task.goalId ? goals.find(g => g.id === task.goalId) : null;
  
  return (
    <div className="flex items-center justify-between w-full">
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
          {task.goalId && goal && (
            <Badge 
              variant="outline" 
              className="ml-2"
              style={{ 
                borderColor: goal.color,
                color: goal.color
              }}
            >
              {goal.title}
            </Badge>
          )}
          {task.tag && (
            <Badge variant="secondary" className="ml-2">
              {task.tag}
            </Badge>
          )}
          {task.type === 'custom' && (
            <span className="text-sm text-muted-foreground ml-2">
              {format(new Date(task.date), 'MMM dd, yyyy')}
            </span>
          )}
        </label>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const router = useRouter()
  const { width, height } = useWindowSize()
  const [date, setDate] = useState<Date>(new Date())
  const [selectedGoalId, setSelectedGoalId] = useState<string>("all")
  const [goals, setGoals] = useState<Goal[]>([])
  const [showConfetti, setShowConfetti] = useState(false)
  const [customTasks, setCustomTasks] = useState<Task[]>([])
  const [newTaskTitle, setNewTaskTitle] = useState("")
  const [newTaskDate, setNewTaskDate] = useState<Date | undefined>(new Date())
  const [newTaskType, setNewTaskType] = useState<'daily' | 'weekly' | 'custom'>('daily')
  const [newTaskGoalId, setNewTaskGoalId] = useState<string>("no-goal")
  const [newTaskTag, setNewTaskTag] = useState("")
  const [reflections, setReflections] = useState<Reflection[]>(initialReflections)
  const [newReflectionContent, setNewReflectionContent] = useState("")
  const [newReflectionGoalId, setNewReflectionGoalId] = useState("")
  const [resources, setResources] = useState<Resource[]>(initialResources)
  const [newResourceTitle, setNewResourceTitle] = useState("")
  const [newResourceUrl, setNewResourceUrl] = useState("")
  const [newResourceGoalId, setNewResourceGoalId] = useState("")
  const { user, isLoaded } = useUser()
  const [isLoading, setIsLoading] = useState(true)
  const { getToken } = useAuth()

  // First, set up Supabase auth
  useEffect(() => {
    async function setupSupabase() {
      if (!user || !isLoaded) return
      
      try {
        const token = await getToken({ template: "supabase" })
        if (token) {
          await updateSupabaseAuthToken(token)
          console.log('Supabase auth token set')
        }
      } catch (err) {
        console.error('Error setting up Supabase:', err)
        toast.error('Failed to set up authentication')
      }
    }

    setupSupabase()
  }, [user, isLoaded, getToken])

  // Then fetch goals
  useEffect(() => {
    async function fetchGoals() {
      if (!user || !isLoaded) return
      
      try {
        setIsLoading(true)
        console.log('Fetching goals for user:', user.id)
        
        // First get the token
        const token = await getToken({ template: "supabase" })
        if (!token) {
          throw new Error('No auth token available')
        }

        // Then set up Supabase auth
        const session = await updateSupabaseAuthToken(token)
        if (!session) {
          throw new Error('Failed to set up Supabase auth')
        }

        // Now fetch goals
        const { data: goals, error } = await supabase
          .from('goals')
          .select(`
            *,
            tasks (*),
            milestones (*)
          `)
          .eq('user_id', user.id)

        console.log('Raw Supabase response:', { goals, error })

        if (error) throw error

        if (goals && goals.length > 0) {
          setGoals(goals)
        } else {
          console.log('No goals found, using initial goals')
          setGoals(initialGoals)
        }
      } catch (err) {
        console.error('Error fetching goals:', err)
        toast.error('Failed to load goals')
        setGoals(initialGoals)
      } finally {
        setIsLoading(false)
      }
    }

    fetchGoals()
  }, [user, isLoaded, getToken])

  useEffect(() => {
    if (user) {
      console.log("Your Clerk User ID:", user.id)
    }
  }, [user])

  // Move all useMemo hooks together, before any conditional returns
  const currentGoal = useMemo(() => {
    if (selectedGoalId === "all") {
      return {
        id: "all",
        title: "All Goals",
        progress: 0,
        color: "",
        tasks: goals.flatMap(g => g.tasks),
        milestones: goals.flatMap(g => g.milestones.map(m => ({
          ...m,
          goalId: g.id,
          goalTitle: g.title,
          goalColor: g.color
        })))
      }
    }
    return goals.find(g => g.id === selectedGoalId) || goals[0]
  }, [selectedGoalId, goals])

  const dailyTasks = useMemo(() => {
    const goalTasks = currentGoal?.tasks.filter(task => task.type === 'daily') || [];
    const customDailyTasks = customTasks.filter(task => 
      task.type === 'daily' || 
      (task.type === 'custom' && isSameDay(new Date(task.date), date))
    );
    return [...goalTasks, ...customDailyTasks];
  }, [currentGoal, customTasks, date]);

  const weeklyTasks = useMemo(() => {
    const goalTasks = currentGoal?.tasks.filter(task => task.type === 'weekly') || [];
    const customWeeklyTasks = customTasks.filter(task => task.type === 'weekly');
    return [...goalTasks, ...customWeeklyTasks];
  }, [currentGoal, customTasks]);

  const customOnlyTasks = useMemo(() => {
    return customTasks.filter(task => task.type === 'custom');
  }, [customTasks]);

  // Add loading check after all hooks
  if (isLoading) {
    return <div>Loading dashboard...</div>
  }

  // Handlers
  const handleTaskToggle = async (taskId: string) => {
    try {
      // Check if it's a custom task
      const isCustomTask = customTasks.some(t => t.id === taskId);
      
      if (isCustomTask) {
        setCustomTasks(prevTasks => 
          prevTasks.map(t =>
            t.id === taskId ? { ...t, completed: !t.completed } : t
          )
        );
      } else {
        // Handle goal tasks
        setGoals(prevGoals => 
          prevGoals.map(goal => ({
            ...goal,
            tasks: goal.tasks.map(t =>
              t.id === taskId ? { ...t, completed: !t.completed } : t
            )
          }))
        );
      }
    } catch (error) {
      console.error('Error toggling task:', error);
      toast.error("Failed to update task");
    }
  };

  const handleMilestoneToggle = (index: number, goalId?: string) => {
    if (selectedGoalId === "all" && !goalId) return;

    setGoals(prevGoals =>
      prevGoals.map(goal => {
        // If we're in "all" view, only update the specific goal
        if (goalId && goal.id !== goalId) return goal;
        
        // If we're in single goal view, only update if it matches current goal
        if (!goalId && goal.id !== selectedGoalId) return goal;

        return {
          ...goal,
          milestones: goal.milestones.map((milestone, i) => {
            if (i === index) {
              const newCompleted = !milestone.completed;
              if (newCompleted) {
                setShowConfetti(true);
                setTimeout(() => setShowConfetti(false), 3000);
              }
              return { ...milestone, completed: newCompleted };
            }
            return milestone;
          })
        };
      })
    );
  };

  const handleAddTask = async () => {
    if (!user || !newTaskTitle) return
    
    try {
      const newTask: Task = {
        id: `task-${Date.now()}`,
        title: newTaskTitle,
        completed: false,
        date: newTaskDate?.toISOString() || new Date().toISOString(),
        goalId: newTaskGoalId === "no-goal" ? undefined : newTaskGoalId,
        type: newTaskType,
        tag: newTaskTag || undefined,
        user_id: user.id
      };

      setCustomTasks(prev => [...prev, newTask]);
      setNewTaskTitle("");
      setNewTaskType('daily');
      setNewTaskDate(new Date());
      setNewTaskGoalId("no-goal");
      setNewTaskTag("");
      toast.success('Task added successfully!');
    } catch (error) {
      console.error('Error adding task:', error);
      toast.error('Failed to add task');
    }
  };

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
      toast.success('Reflection added successfully!')
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
      toast.success('Resource added successfully!')
    }
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

      <div className="grid gap-6 md:grid-cols-[1fr_300px]">
        {/* Left Column - Tasks */}
        <div className="space-y-6">
          <Card className="w-full">
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
                        selected={date}
                        onSelect={(newDate) => newDate && setDate(newDate)}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <TabsContent value="daily" className="mt-4 space-y-4">
                  {dailyTasks.map(task => (
                    <TaskItem 
                      key={task.id} 
                      task={task} 
                      onToggle={handleTaskToggle} 
                      goals={goals} 
                    />
                  ))}
                </TabsContent>
                <TabsContent value="weekly" className="mt-4 space-y-4">
                  {weeklyTasks.map(task => (
                    <TaskItem 
                      key={task.id} 
                      task={task} 
                      onToggle={handleTaskToggle} 
                      goals={goals} 
                    />
                  ))}
                </TabsContent>
                <TabsContent value="custom" className="mt-4 space-y-4">
                  {customOnlyTasks.map(task => (
                    <TaskItem 
                      key={task.id} 
                      task={task} 
                      onToggle={handleTaskToggle} 
                      goals={goals} 
                    />
                  ))}
                </TabsContent>
              </Tabs>
            </CardHeader>
            <CardContent>
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
                      Create a new task for your goals or a standalone task.
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
                          <SelectValue placeholder="Select a goal (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="no-goal">No Goal</SelectItem>
                          {goals.map(goal => (
                            <SelectItem key={goal.id} value={goal.id}>
                              {goal.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Select 
                        value={newTaskType} 
                        onValueChange={(value: 'daily' | 'weekly' | 'custom') => setNewTaskType(value)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select task type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="custom">Custom Date</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Input
                        id="task-tag"
                        placeholder="Add a tag (optional)"
                        className="col-span-4"
                        value={newTaskTag}
                        onChange={(e) => setNewTaskTag(e.target.value)}
                      />
                    </div>
                    {newTaskType === 'custom' && (
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
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    )}
                  </div>
                  <DialogFooter>
                    <Button onClick={handleAddTask}>Add Task</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>

          {/* Milestones Card */}
          <Card>
            <CardHeader>
              <CardTitle>Milestones</CardTitle>
              <CardDescription>
                {selectedGoalId === "all" 
                  ? "Your journey across all goals" 
                  : `Your journey to ${currentGoal.title}`
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                {(selectedGoalId === "all" ? currentGoal.milestones : currentGoal.milestones.map(m => ({
                  ...m,
                  goalId: currentGoal.id,
                  goalTitle: currentGoal.title,
                  goalColor: currentGoal.color
                }))).map((milestone, index) => (
                  <li key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        checked={milestone.completed}
                        onCheckedChange={() => handleMilestoneToggle(index, selectedGoalId === "all" ? milestone.goalId : undefined)}
                      />
                      <div className={`flex items-center space-x-2 ${
                        milestone.completed ? 'line-through text-muted-foreground' : ''
                      }`}>
                        <span>{milestone.title}</span>
                        {selectedGoalId === "all" && (
                          <Badge 
                            variant="outline" 
                            className="ml-2"
                            style={{ 
                              borderColor: milestone.goalColor,
                              color: milestone.goalColor
                            }}
                          >
                            {milestone.goalTitle}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(milestone.date), 'dd/MM/yyyy')}
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
                {reflections
                  .filter(r => selectedGoalId === "all" || r.goalId === selectedGoalId)
                  .map(reflection => (
                    <li key={reflection.id} className="border-b pb-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(reflection.date), 'MMMM d, yyyy')}
                        </span>
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

        {/* Right Column - Progress and Resources */}
        <div className="space-y-6">
          {/* Progress Overview Card */}
          <Card className="flex flex-col">
            <CardHeader className="items-center pb-0">
              <CardTitle>Goal Progress</CardTitle>
              <CardDescription>Overall progress across all goals</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 pb-0">
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart
                    innerRadius="30%"
                    outerRadius="100%"
                    data={goals}
                    startAngle={90}
                    endAngle={-270}
                  >
                    <RadialBar
                      minAngle={15}
                      background
                      clockWise={true}
                      dataKey="progress"
                      cornerRadius={5}
                      fill="#82ca9d"
                    >
                      {goals.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </RadialBar>
                  </RadialBarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
            <CardFooter className="flex-col gap-2 pt-4">
              {goals.map((goal) => (
                <div
                  key={goal.id}
                  className="flex w-full items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: goal.color }}
                    />
                    <span className="text-sm font-medium">{goal.title}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {goal.progress}%
                  </span>
                </div>
              ))}
            </CardFooter>
          </Card>

          {/* Resources Card */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Resources</CardTitle>
              <CardDescription>Quick access to your tools and guides</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {resources
                  .filter(r => selectedGoalId === "all" || r.goalId === selectedGoalId)
                  .map(resource => (
                    <a
                      key={resource.id}
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 rounded-lg border p-3 hover:bg-accent transition-colors"
                    >
                      <Link className="h-4 w-4" />
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-medium">{resource.title}</span>
                        <Badge variant="outline" className="w-fit">
                          {goals.find(g => g.id === resource.goalId)?.title}
                        </Badge>
                      </div>
                    </a>
                  ))}
              </div>
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