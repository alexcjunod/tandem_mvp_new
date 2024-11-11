"use client"

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { format, differenceInDays } from 'date-fns'
import { ArrowLeft, Calendar, CheckCircle2, Target, Pencil, Plus } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

// Use the same Goal interface from your dashboard
interface Goal {
  id: string
  title: string
  description: string
  progress: number
  startDate: string
  endDate: string
  color: string
  smartGoal?: {
    specific: string
    measurable: string
    achievable: string
    relevant: string
    timeBound: string
  }
  reasoning?: string
  milestones: {
    id: string
    title: string
    date: string
    completed: boolean
  }[]
  tasks: {
    id: string
    title: string
    type: 'daily' | 'weekly'
    completed: boolean
  }[]
}

// Add the goals data
const initialGoals = [
  {
    id: '1',
    title: "Run a Marathon",
    description: "Complete a full marathon in under 4 hours",
    progress: 45,
    startDate: "2024-01-01",
    endDate: "2024-12-31",
    color: "hsl(10, 70%, 50%)",
    smartGoal: {
      specific: "Complete a full marathon (26.2 miles) race",
      measurable: "Finish the race in under 4 hours",
      achievable: "Gradually increase weekly mileage and follow a structured training plan",
      relevant: "Improve overall fitness and accomplish a major personal challenge",
      timeBound: "Achieve this goal within 12 months, by December 31, 2024"
    },
    reasoning: "I've always been passionate about running and pushing my limits. Completing a marathon represents the ultimate test of endurance and mental strength.",
    milestones: [
      { id: 'm1', title: "Complete 5K", date: "2024-03-31", completed: false },
      { id: 'm2', title: "Finish Half Marathon", date: "2024-06-30", completed: false }
    ],
    tasks: [
      { id: 'd1', title: "Complete scheduled training run", type: 'daily', completed: false },
      { id: 'd2', title: "Do stretching routine", type: 'daily', completed: false },
      { id: 'w1', title: "Long training run", type: 'weekly', completed: false },
      { id: 'w2', title: "Review weekly mileage", type: 'weekly', completed: false }
    ]
  },
  {
    id: '2',
    title: "Learn Guitar",
    description: "Master playing guitar and perform a song in public",
    progress: 70,
    startDate: "2024-02-01",
    endDate: "2024-12-31",
    color: "hsl(200, 70%, 50%)",
    smartGoal: {
      specific: "Learn to play guitar proficiently",
      measurable: "Master basic chords and perform a full song",
      achievable: "Practice daily with structured lessons",
      relevant: "Develop musical skills and creative expression",
      timeBound: "Perform in public by end of year"
    },
    reasoning: "Music has always been a passion, and learning guitar will allow me to express myself creatively.",
    milestones: [
      { id: 'm3', title: "Master basic chords", date: "2024-04-15", completed: false }
    ],
    tasks: [
      { id: 'g1', title: "Practice basic chords", type: 'daily', completed: false },
      { id: 'g2', title: "Watch tutorial video", type: 'daily', completed: false },
      { id: 'g3', title: "Practice scales", type: 'weekly', completed: false }
    ]
  },
  // ... add other goals with their SMART goals and reasoning
]

export default function GoalDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const [goal, setGoal] = useState<Goal | null>(null)
  const [isEditingGoal, setIsEditingGoal] = useState(false)
  const [editedGoal, setEditedGoal] = useState<Goal | null>(null)
  const [newMilestone, setNewMilestone] = useState({ title: '', date: '' })
  const [newTask, setNewTask] = useState({ title: '', type: 'daily' as const })

  useEffect(() => {
    // This will be replaced with a Supabase fetch
    const currentGoal = initialGoals.find(g => g.id === params.id)
    if (currentGoal) {
      setGoal(currentGoal)
      setEditedGoal(currentGoal)
    }
  }, [params.id])

  const handleEditGoal = () => {
    setIsEditingGoal(true)
    setEditedGoal(goal)
  }

  const handleSaveGoal = () => {
    if (!editedGoal) return
    // This will be replaced with a Supabase update
    setGoal(editedGoal)
    setIsEditingGoal(false)
    toast.success("Goal updated successfully")
  }

  const handleAddMilestone = () => {
    if (!goal || !newMilestone.title || !newMilestone.date) return
    
    const milestone = {
      id: `milestone-${Date.now()}`,
      title: newMilestone.title,
      date: newMilestone.date,
      completed: false
    }

    setGoal({
      ...goal,
      milestones: [...goal.milestones, milestone]
    })
    setNewMilestone({ title: '', date: '' })
    toast.success("Milestone added successfully")
  }

  const handleAddTask = () => {
    if (!goal || !newTask.title) return
    
    const task = {
      id: `task-${Date.now()}`,
      title: newTask.title,
      type: newTask.type,
      completed: false
    }

    setGoal({
      ...goal,
      tasks: [...goal.tasks, task]
    })
    setNewTask({ title: '', type: 'daily' })
    toast.success("Task added successfully")
  }

  const handleToggleTask = (taskId: string) => {
    if (!goal) return

    setGoal({
      ...goal,
      tasks: goal.tasks.map(task =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      )
    })
  }

  const handleToggleMilestone = (milestoneId: string) => {
    if (!goal) return

    setGoal({
      ...goal,
      milestones: goal.milestones.map(milestone =>
        milestone.id === milestoneId ? { ...milestone, completed: !milestone.completed } : milestone
      )
    })
  }

  if (!goal) {
    return <div>Loading...</div>
  }

  const daysRemaining = differenceInDays(new Date(goal.endDate), new Date())

  return (
    <div className="container mx-auto p-6">
      <Button variant="ghost" className="mb-6" onClick={() => router.push('/goals')}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Goals
      </Button>

      <div className="grid gap-6 md:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-3xl font-bold">{goal.title}</CardTitle>
                  <CardDescription>{goal.description}</CardDescription>
                </div>
                <Button variant="outline" size="icon" onClick={handleEditGoal}>
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Progress</span>
                  <span className="text-sm font-medium">{goal.progress}%</span>
                </div>
                <Progress value={goal.progress} className="w-full" />
              </div>
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center">
                  <Calendar className="mr-2 h-4 w-4" />
                  <span className="text-sm">Start: {format(new Date(goal.startDate), 'MMM d, yyyy')}</span>
                </div>
                <div className="flex items-center">
                  <Calendar className="mr-2 h-4 w-4" />
                  <span className="text-sm">End: {format(new Date(goal.endDate), 'MMM d, yyyy')}</span>
                </div>
              </div>
              <Badge variant="secondary" className="mb-4">
                {daysRemaining} days remaining
              </Badge>
              <h3 className="text-lg font-semibold mb-2">SMART Goal Breakdown</h3>
              <ul className="list-disc pl-5 space-y-2 mb-4">
                <li><strong>Specific:</strong> {goal.smartGoal?.specific}</li>
                <li><strong>Measurable:</strong> {goal.smartGoal?.measurable}</li>
                <li><strong>Achievable:</strong> {goal.smartGoal?.achievable}</li>
                <li><strong>Relevant:</strong> {goal.smartGoal?.relevant}</li>
                <li><strong>Time-bound:</strong> {goal.smartGoal?.timeBound}</li>
              </ul>
              <h3 className="text-lg font-semibold mb-2">Your Reasoning</h3>
              <p className="text-sm text-muted-foreground">{goal.reasoning}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Milestones & Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="milestones">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="milestones">Milestones</TabsTrigger>
                  <TabsTrigger value="tasks">Tasks</TabsTrigger>
                </TabsList>
                <TabsContent value="milestones">
                  <ScrollArea className="h-[300px] w-full rounded-md border p-4">
                    {goal.milestones.map((milestone) => (
                      <div key={milestone.id} className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                          <CheckCircle2 
                            className={`mr-2 h-4 w-4 cursor-pointer ${milestone.completed ? 'text-green-500' : 'text-gray-300'}`}
                            onClick={() => handleToggleMilestone(milestone.id)}
                          />
                          <span className={milestone.completed ? 'line-through text-muted-foreground' : ''}>
                            {milestone.title}
                          </span>
                        </div>
                        <Badge variant="outline">{format(new Date(milestone.date), 'MMM d, yyyy')}</Badge>
                      </div>
                    ))}
                  </ScrollArea>
                </TabsContent>
                <TabsContent value="tasks">
                  <ScrollArea className="h-[300px] w-full rounded-md border p-4">
                    {goal.tasks.map((task) => (
                      <div key={task.id} className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                          <CheckCircle2 
                            className={`mr-2 h-4 w-4 cursor-pointer ${task.completed ? 'text-green-500' : 'text-gray-300'}`}
                            onClick={() => handleToggleTask(task.id)}
                          />
                          <span className={task.completed ? 'line-through text-muted-foreground' : ''}>
                            {task.title}
                          </span>
                        </div>
                        <Badge>{task.type}</Badge>
                      </div>
                    ))}
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Milestone
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Milestone</DialogTitle>
                    <DialogDescription>
                      Create a new milestone for your goal.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="milestone-title" className="text-right">
                        Title
                      </Label>
                      <Input 
                        id="milestone-title" 
                        value={newMilestone.title}
                        onChange={(e) => setNewMilestone({ ...newMilestone, title: e.target.value })}
                        className="col-span-3" 
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="milestone-date" className="text-right">
                        Date
                      </Label>
                      <Input 
                        id="milestone-date" 
                        type="date" 
                        value={newMilestone.date}
                        onChange={(e) => setNewMilestone({ ...newMilestone, date: e.target.value })}
                        className="col-span-3" 
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleAddMilestone}>Add Milestone</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Task
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Task</DialogTitle>
                    <DialogDescription>
                      Create a new task for your goal.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="task-title" className="text-right">
                        Title
                      </Label>
                      <Input 
                        id="task-title" 
                        value={newTask.title}
                        onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                        className="col-span-3" 
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="task-type" className="text-right">
                        Type
                      </Label>
                      <select
                        id="task-type"
                        value={newTask.type}
                        onChange={(e) => setNewTask({ ...newTask, type: e.target.value as 'daily' | 'weekly' })}
                        className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                      >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                      </select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleAddTask}>Add Task</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardFooter>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Goal Insights</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Here you can add charts, statistics, or other insights about the goal */}
              <p>Placeholder for goal insights and analytics.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Here you can add a feed of recent actions or updates related to the goal */}
              <p>Placeholder for recent activity feed.</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={isEditingGoal} onOpenChange={setIsEditingGoal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Goal</DialogTitle>
            <DialogDescription>
              Make changes to your goal here. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">
                Title
              </Label>
              <Input
                id="title"
                value={editedGoal?.title}
                onChange={(e) => setEditedGoal(editedGoal ? { ...editedGoal, title: e.target.value } : null)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Textarea
                id="description"
                value={editedGoal?.description}
                onChange={(e) => setEditedGoal(editedGoal ? { ...editedGoal, description: e.target.value } : null)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" onClick={handleSaveGoal}>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 