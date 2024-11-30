"use client"

import { useState, useEffect, useMemo } from 'react'
import { Plus, Target, Calendar as CalendarIcon, BookOpen, Link, Trash2 } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Calendar } from "@/components/ui/calendar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useRouter } from 'next/navigation'
import { RadialBarChart, RadialBar, ResponsiveContainer, Cell, Tooltip, TooltipProps } from "recharts"
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
import { Goal, Task, Milestone, Reflection, Resource } from '@/types/goals'
import { useGoals } from '@/hooks/use-goals'
import { Skeleton } from "@/components/ui/skeleton"
import {
  ChartConfig,
  ChartContainer,
  CustomTooltip,
} from "@/components/ui/chart"
import { LabelList } from "recharts"

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

// Use imported types instead
const initialReflections: Reflection[] = [
  { id: 'r1', date: "2024-03-14", content: "Feeling good about my progress in running. Need to focus more on stretching.", goal_id: '1', user_id: 'user1' },
  { id: 'r2', date: "2024-03-13", content: "Learned a new chord progression today. Excited to incorporate it into a song.", goal_id: '2', user_id: 'user1' },
]

// Use imported types instead
const initialResources: Resource[] = [
  { id: 'res1', title: "Beginner's Guide to Marathon Training", url: "https://example.com/marathon-guide", goal_id: '1', user_id: 'user1' },
  { id: 'res2', title: "Online Guitar Lessons", url: "https://example.com/guitar-lessons", goal_id: '2', user_id: 'user1' },
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
  const goal = task.goal_id ? goals.find(g => g.id === task.goal_id) : null;
  
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
          className={`text-sm font-medium leading-none ${
            task.completed ? 'line-through text-muted-foreground' : ''
          }`}
        >
          {task.title}
        </label>
      </div>
      <div className="flex items-center gap-2">
        {task.goal_id && goal && (
          <Badge 
            variant="outline" 
            style={{ 
              borderColor: goal.color,
              color: goal.color
            }}
          >
            {goal.title}
          </Badge>
        )}
        {!task.goal_id && (
          <Badge variant="secondary">
            General
          </Badge>
        )}
        {task.type === 'daily' && (
          <Badge variant="secondary">
            Daily
          </Badge>
        )}
        {task.type === 'weekly' && task.weekday !== undefined && (
          <Badge variant="secondary">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][task.weekday]}
          </Badge>
        )}
        {task.type === 'custom' && task.date && (
          <Badge variant="secondary">
            {format(new Date(task.date), 'MMM d, yyyy')}
          </Badge>
        )}
      </div>
    </div>
  )
}

// Add this helper function to calculate daily progress
const calculateDailyProgress = (tasks: Task[]) => {
  if (!tasks || tasks.length === 0) return 0;
  const completedTasks = tasks.filter(t => t.completed).length;
  return Math.round((completedTasks / tasks.length) * 100);
};

// Add this color scheme array
const GOAL_COLORS = [
  "hsl(10, 70%, 50%)",  // Red
  "hsl(200, 70%, 50%)", // Blue
  "hsl(150, 70%, 50%)", // Green
  "hsl(280, 70%, 50%)", // Purple
  "hsl(50, 70%, 50%)",  // Yellow
  "hsl(320, 70%, 50%)", // Pink
];

// Add the chart config
const chartConfig = {
  progress: {
    label: "Progress",
  },
  // This will be dynamically populated with goals
} satisfies ChartConfig

// Add these utility functions after imports
const filterTasks = (tasks: Task[], view: 'daily' | 'weekly' | 'all') => {
  const today = new Date();
  const currentDayOfWeek = today.getDay();

  switch (view) {
    case 'daily':
      // Return daily tasks and weekly tasks for current day
      return tasks.filter(task => 
        task.type === 'daily' || 
        (task.type === 'weekly' && task.weekday === currentDayOfWeek)
      ).sort((a, b) => {
        // Sort daily tasks before weekly tasks
        if (a.type === 'daily' && b.type === 'weekly') return -1;
        if (a.type === 'weekly' && b.type === 'daily') return 1;
        return a.title.localeCompare(b.title);
      });

    case 'weekly':
      // Return all weekly tasks
      return tasks
        .filter(task => task.type === 'weekly')
        .sort((a, b) => {
          if (a.weekday === undefined || b.weekday === undefined) return 0;
          // Sort by weekday first
          if (a.weekday !== b.weekday) return a.weekday - b.weekday;
          // Then by title
          return a.title.localeCompare(b.title);
        });

    default:
      // Return all tasks
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

export default function Dashboard() {
  const router = useRouter()
  const { width, height } = useWindowSize()
  const { 
    goals, 
    tasks,
    isLoading: goalsLoading, 
    updateGoalTask, 
    updateGoalMilestone,
    refreshGoals,
    addReflection,
    addResource
  } = useGoals()
  const { user, isLoaded } = useUser()
  const { getToken } = useAuth()
  
  // State declarations
  const [date, setDate] = useState<Date>(new Date())
  const [selectedGoalId, setSelectedGoalId] = useState<string>("all")
  const [showConfetti, setShowConfetti] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState("")
  const [newTaskDate, setNewTaskDate] = useState<Date | undefined>(new Date())
  const [newTaskType, setNewTaskType] = useState<'daily' | 'weekly' | 'custom'>('daily')
  const [newTaskGoalId, setNewTaskGoalId] = useState<string>("no-goal")
  const [newTaskTag, setNewTaskTag] = useState("")
  const [reflections, setReflections] = useState<Reflection[]>(initialReflections)
  const [newReflectionContent, setNewReflectionContent] = useState("")
  const [newReflectionGoalId, setNewReflectionGoalId] = useState<string>("general")
  const [resources, setResources] = useState<Resource[]>(initialResources)
  const [newResourceTitle, setNewResourceTitle] = useState("")
  const [newResourceUrl, setNewResourceUrl] = useState("")
  const [newResourceGoalId, setNewResourceGoalId] = useState<string>("general")
  const [newTaskWeekday, setNewTaskWeekday] = useState<number | undefined>(undefined)
  const [taskView, setTaskView] = useState<'daily' | 'weekly' | 'all'>('daily');

  // Memoize the setup function to avoid recreation on every render
  const setupSupabase = useMemo(() => async () => {
    if (!user || !isLoaded) return
    
    try {
      const token = await getToken({ template: "supabase" })
      if (token) {
        await updateSupabaseAuthToken(token)
        console.log('Supabase auth token set')
        await refreshGoals()
        console.log('Goals refreshed after auth setup')
      }
    } catch (err) {
      console.error('Error setting up Supabase:', err)
      toast.error('Failed to set up authentication')
    }
  }, [user, isLoaded, getToken, refreshGoals])

  // Initial setup effect
  useEffect(() => {
    setupSupabase()
  }, [setupSupabase])

  // Memoize handlers that use refreshGoals
  const handleTaskToggle = useMemo(() => async (taskId: string) => {
    try {
      const task = tasks.find(t => t.id === taskId)
      if (!task) {
        console.error('Task not found:', taskId)
        return
      }

      const result = await updateGoalTask(taskId, { 
        completed: !task.completed 
      })

      if (result) {
        await refreshGoals()
        toast.success('Task updated successfully')
      }
    } catch (error) {
      console.error('Error toggling task:', error)
      toast.error("Failed to update task")
    }
  }, [tasks, updateGoalTask, refreshGoals])

  const handleMilestoneToggle = useMemo(() => async (milestoneId: string, goalId?: string) => {
    try {
      const goal = goals.find(g => g.id === (goalId || selectedGoalId))
      if (!goal || !goal.milestones) {
        console.error('Goal or milestones not found')
        return
      }

      const milestone = goal.milestones.find(m => m.id === milestoneId)
      if (!milestone) {
        console.error('Milestone not found:', milestoneId)
        return
      }

      const result = await updateGoalMilestone(milestone.id, { 
        completed: !milestone.completed 
      })

      if (result) {
        await refreshGoals()
        if (!milestone.completed) {
          setShowConfetti(true)
          setTimeout(() => setShowConfetti(false), 3000)
        }
        toast.success('Milestone updated successfully')
      }
    } catch (error) {
      console.error('Error toggling milestone:', error)
      toast.error("Failed to update milestone")
    }
  }, [goals, selectedGoalId, updateGoalMilestone, refreshGoals])

  // Memoize data calculations
  const currentGoal = useMemo(() => {
    if (selectedGoalId === "all") {
      return {
        id: "all",
        title: "All Goals",
        tasks: goals.flatMap(g => g.tasks ?? []),
        milestones: goals.flatMap(g => g.milestones ?? []),
        color: `hsl(var(--primary))`
      } as const;
    }
    return goals.find(g => g.id === selectedGoalId) || null;
  }, [selectedGoalId, goals]);

  const dailyTasks = useMemo(() => {
    const today = new Date();
    const currentDayOfWeek = today.getDay();
    return [
      // Daily tasks
      ...tasks.filter(task => task.type === 'daily'),
      // Weekly tasks for today
      ...tasks.filter(task => 
        task.type === 'weekly' && 
        task.weekday === currentDayOfWeek
      )
    ].sort((a, b) => a.title.localeCompare(b.title));
  }, [tasks]);

  const weeklyTasks = useMemo(() => {
    const today = new Date();
    const currentDayOfWeek = today.getDay();
    return tasks
      .filter(task => 
        task.type === 'weekly' && 
        task.weekday !== currentDayOfWeek // Only show weekly tasks for other days
      )
      .sort((a, b) => {
        // Sort by weekday first
        if (a.weekday === undefined || b.weekday === undefined) return 0;
        return (a.weekday - b.weekday) || a.title.localeCompare(b.title);
      });
  }, [tasks]);

  const customOnlyTasks = useMemo(() => {
    return tasks
      .filter(task => task.type !== 'daily' && task.type !== 'weekly')
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [tasks]);

  useEffect(() => {
    if (!goalsLoading && goals.length === 0) {
      router.push('/onboarding')
    }
  }, [goalsLoading, goals, router])

  // Add loading check after all hooks
  if (goalsLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="space-y-6">
          <Skeleton className="h-12 w-[250px]" />
          <div className="grid gap-6 md:grid-cols-2">
            <Skeleton className="h-[400px]" />
            <div className="space-y-6">
              <Skeleton className="h-[200px]" />
              <Skeleton className="h-[200px]" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Handlers
  const handleAddTask = async () => {
    if (!newTaskTitle || !user) return;
    
    try {
      const newTask = {
        title: newTaskTitle,
        completed: false,
        date: new Date().toISOString(),
        goal_id: newTaskGoalId === "no-goal" ? null : newTaskGoalId, // Ensure null for general tasks
        type: newTaskType,
        weekday: newTaskType === 'weekly' ? newTaskWeekday : undefined,
        user_id: user.id
      };

      const { data, error } = await supabase
        .from('tasks')
        .insert([newTask])
        .select()
        .single();

      if (error) throw error;

      await refreshGoals(); // Refresh to get the updated task list

      // Reset all form fields
      setNewTaskTitle("");
      setNewTaskType('daily');
      setNewTaskWeekday(undefined);
      setNewTaskGoalId("no-goal");
      
      toast.success('Task added successfully!');
    } catch (error) {
      console.error('Error adding task:', error);
      toast.error('Failed to add task');
    }
  };

  const handleAddReflection = async () => {
    if (!newReflectionContent || !user) return;
    
    try {
      const newReflection: Omit<Reflection, "id"> = {
        content: newReflectionContent,
        date: new Date().toISOString(),
        goal_id: newReflectionGoalId,
        user_id: user.id
      };

      const result = await addReflection(newReflection);
      
      if (result) {
        setNewReflectionContent("");
        setNewReflectionGoalId("general");
        toast.success('Reflection added successfully!');
      }
    } catch (error) {
      console.error('Error adding reflection:', error);
      toast.error('Failed to add reflection');
    }
  };

  const handleAddResource = async () => {
    if (!newResourceTitle || !newResourceUrl || !user) return;
    
    try {
      const newResource: Omit<Resource, "id"> = {
        title: newResourceTitle,
        url: newResourceUrl,
        goal_id: newResourceGoalId,
        user_id: user.id
      };

      const result = await addResource(newResource);
      
      if (result) {
        setNewResourceTitle("");
        setNewResourceUrl("");
        setNewResourceGoalId("general");
        toast.success('Resource added successfully!');
      }
    } catch (error) {
      console.error('Error adding resource:', error);
      toast.error('Failed to add resource');
    }
  };

  const handleDeleteReflection = async (reflectionId: string) => {
    try {
      const { error } = await supabase
        .from('reflections')
        .delete()
        .eq('id', reflectionId);

      if (error) throw error;
      await refreshGoals();
      toast.success('Reflection deleted successfully');
    } catch (error) {
      console.error('Error deleting reflection:', error);
      toast.error('Failed to delete reflection');
    }
  };

  const handleDeleteResource = async (resourceId: string) => {
    try {
      const { error } = await supabase
        .from('resources')
        .delete()
        .eq('id', resourceId);

      if (error) throw error;
      await refreshGoals();
      toast.success('Resource deleted successfully');
    } catch (error) {
      console.error('Error deleting resource:', error);
      toast.error('Failed to delete resource');
    }
  };

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
                      Create a new task for your goals
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <Input
                      placeholder="Task title"
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                    />
                    <Select
                      value={newTaskType}
                      onValueChange={(value: 'daily' | 'weekly' | 'custom') => {
                        setNewTaskType(value)
                        if (value === 'daily') setNewTaskWeekday(undefined)
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select task type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>

                    {newTaskType === 'weekly' && (
                      <Select
                        value={newTaskWeekday?.toString()}
                        onValueChange={(value) => setNewTaskWeekday(parseInt(value))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select day of week" />
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

                    {newTaskType === 'custom' && (
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
                    )}

                    <Select value={newTaskGoalId} onValueChange={setNewTaskGoalId}>
                      <SelectTrigger>
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
                  : currentGoal 
                    ? `Your journey to ${currentGoal.title}`
                    : "No goal selected"
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                {(selectedGoalId === "all" 
                  ? (currentGoal?.milestones ?? [])
                  : (currentGoal?.milestones ?? [])
                ).map((milestone) => (
                  <li key={milestone.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        checked={milestone.completed}
                        onCheckedChange={() => handleMilestoneToggle(
                          milestone.id, 
                          selectedGoalId === "all" ? milestone.goal_id : undefined
                        )}
                      />
                      <span className={milestone.completed ? 'line-through text-muted-foreground' : ''}>
                        {milestone.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedGoalId === "all" && milestone.goal_id && (
                        <Badge 
                          variant="outline" 
                          style={{ 
                            borderColor: goals.find(g => g.id === milestone.goal_id)?.color ?? 'var(--primary)',
                            color: goals.find(g => g.id === milestone.goal_id)?.color ?? 'var(--primary)'
                          }}
                        >
                          {goals.find(g => g.id === milestone.goal_id)?.title || "General"}
                        </Badge>
                      )}
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(milestone.date), 'dd/MM/yyyy')}
                      </span>
                    </div>
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
                {(selectedGoalId === "all" 
                  ? goals.flatMap(g => g.reflections ?? [])
                  : goals.find(g => g.id === selectedGoalId)?.reflections ?? []
                ).map(reflection => (
                  <li key={reflection.id} className="border-b pb-4 group">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(reflection.date), 'MMMM d, yyyy')}
                      </span>
                      <div className="flex items-center gap-2">
                        {reflection.goal_id && (
                          <Badge variant="outline">
                            {goals.find(g => g.id === reflection.goal_id)?.title || 'General'}
                          </Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleDeleteReflection(reflection.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
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
                      Write a reflection on your progress
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <Textarea
                      placeholder="I want to achieve this goal because&apos;..."
                      value={newReflectionContent}
                      onChange={(e) => setNewReflectionContent(e.target.value)}
                    />
                    <Select value={newReflectionGoalId} onValueChange={setNewReflectionGoalId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a goal (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General Reflection</SelectItem>
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
              <CardTitle>Daily Progress</CardTitle>
              <CardDescription>Today&apos;s tasks completion</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 pb-0">
              <ChartContainer
                config={chartConfig}
                className="mx-auto aspect-square max-h-[250px]"
              >
                <RadialBarChart
                  data={[
                    {
                      name: "General Tasks",
                      progress: calculateDailyProgress(tasks.filter(t => !t.goal_id)),
                      fill: `hsl(var(--primary))`,
                    },
                    // Add goal-specific tasks
                    ...goals.map((goal, index) => ({
                      name: goal.title,
                      progress: calculateDailyProgress(tasks.filter(t => t.goal_id === goal.id)),
                      fill: goal.color || `hsl(var(--chart-${(index + 1) % 5}))`,
                    }))
                  ]}
                  startAngle={-90}    // Start at 12 o'clock
                  endAngle={270}      // Make a full circle
                  innerRadius={30}    // Smaller inner radius
                  outerRadius={110}   // Larger outer radius
                  barSize={20}        // Thicker bars
                >
                  <RadialBar
                    background={{ fill: 'var(--muted)' }}
                    dataKey="progress"
                    cornerRadius={10}
                    label={{
                      position: 'insideStart',
                      fill: '#fff',
                      fontSize: 11,
                      formatter: () => '' // Remove percentage display
                    }}
                  >
                    <LabelList
                      position="insideStart"
                      dataKey="name" // Show only the name of the goal
                      className="fill-white capitalize mix-blend-luminosity"
                      fontSize={11}
                    />
                  </RadialBar>
                  <Tooltip content={CustomTooltip} />
                </RadialBarChart>
              </ChartContainer>
            </CardContent>
            <CardFooter className="flex-col gap-2 pt-4">
              <div className="flex w-full items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: `hsl(var(--primary))` }}
                  />
                  <span className="text-sm font-medium">General Tasks</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {calculateDailyProgress(tasks.filter(t => !t.goal_id))}%
                </span>
              </div>
              {goals.map((goal, index) => (
                <div
                  key={goal.id}
                  className="flex w-full items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ 
                        backgroundColor: goal.color || `hsl(var(--chart-${(index + 1) % 5}))`
                      }}
                    />
                    <span className="text-sm font-medium">{goal.title}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {calculateDailyProgress(tasks.filter(t => t.goal_id === goal.id))}%
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
                {(selectedGoalId === "all"
                  ? goals.flatMap(g => g.resources ?? [])
                  : goals.find(g => g.id === selectedGoalId)?.resources ?? []
                ).map(resource => (
                  <div
                    key={resource.id}
                    className="flex items-center justify-between gap-2 rounded-lg border p-3 hover:bg-accent transition-colors group"
                  >
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 flex-1"
                    >
                      <Link className="h-4 w-4" />
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-medium">{resource.title}</span>
                        {resource.goal_id && (
                          <Badge variant="outline" className="w-fit">
                            {goals.find(g => g.id === resource.goal_id)?.title || 'General'}
                          </Badge>
                        )}
                      </div>
                    </a>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleDeleteResource(resource.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
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
                      Add a helpful resource
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
                        <SelectValue placeholder="Select a goal (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General Resource</SelectItem>
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

// testing comment to see if deploy now works post reset
