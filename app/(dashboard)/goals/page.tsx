"use client"

import { useState, useEffect } from 'react'
import { useUser } from "@clerk/nextjs"
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { 
  Target, 
  Plus, 
  Calendar, 
  CheckCircle2, 
  Pencil,
  ChevronRight 
} from 'lucide-react'
import { toast } from 'sonner'

// Import UI components
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

// Import types and services
import { Goal, Task, Milestone } from '@/types'
import { getGoals } from '@/lib/supabase/service'

// Add initial goals data
const initialGoals: Goal[] = [
  {
    id: '1',
    user_id: '',
    title: "Run a Marathon",
    description: "Complete a full marathon in under 4 hours",
    progress: 45,
    start_date: "2024-01-01",
    end_date: "2024-12-31",
    color: "hsl(10, 70%, 50%)",
    smart_goal: {
      specific: "Complete a full marathon (26.2 miles) race",
      measurable: "Finish the race in under 4 hours",
      achievable: "Gradually increase weekly mileage and follow a structured training plan",
      relevant: "Improve overall fitness and accomplish a major personal challenge",
      timeBound: "Achieve this goal within 12 months, by December 31, 2024"
    },
    reasoning: "I've always been passionate about running and pushing my limits.",
    tasks: [
      { 
        id: 'd1', 
        user_id: '', 
        goal_id: '1',
        title: "Complete training run", 
        type: 'daily', 
        completed: false, 
        date: new Date().toISOString() 
      },
      { 
        id: 'w1', 
        user_id: '', 
        goal_id: '1',
        title: "Long run", 
        type: 'weekly', 
        completed: false, 
        date: new Date().toISOString() 
      }
    ],
    milestones: [
      { id: 'm1', goal_id: '1', title: "Complete 5K", date: "2024-03-31", completed: false },
      { id: 'm2', goal_id: '1', title: "Half Marathon", date: "2024-06-30", completed: false }
    ]
  }
]

export default function GoalsPage() {
  const router = useRouter()
  const { user } = useUser()
  const [goals, setGoals] = useState<Goal[]>([])
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditingDate, setIsEditingDate] = useState(false)
  const [editedEndDate, setEditedEndDate] = useState(selectedGoal?.end_date || '')

  const handleEndDateUpdate = () => {
    if (!selectedGoal) return
    
    setSelectedGoal({
      ...selectedGoal,
      end_date: editedEndDate
    })
    setIsEditingDate(false)
  }

  useEffect(() => {
    async function fetchGoals() {
      if (!user) return
      
      try {
        setIsLoading(true)
        console.log('Fetching goals for user:', user.id)
        
        const goalsData = await getGoals(user.id)
        console.log('Fetched goals:', goalsData)

        if (goalsData && goalsData.length > 0) {
          setGoals(goalsData)
          setSelectedGoal(goalsData[0])
        } else {
          console.log('No goals found, using initial goals')
          setGoals(initialGoals)
          setSelectedGoal(initialGoals[0])
        }
      } catch (err) {
        console.error('Error fetching goals:', err)
        toast.error('Failed to load goals')
        setGoals(initialGoals)
        setSelectedGoal(initialGoals[0])
      } finally {
        setIsLoading(false)
      }
    }

    fetchGoals()
  }, [user])

  if (isLoading) {
    return <div>Loading goals...</div>
  }

  if (!selectedGoal) {
    return (
      <div className="container mx-auto p-6">
        <header className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Your Goals</h1>
            <p>No goals yet. Create your first goal!</p>
          </div>
          <Button onClick={() => router.push('/onboarding')}>
            <Plus className="mr-2 h-4 w-4" /> New Goal
          </Button>
        </header>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <header className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Target className="h-8 w-8" />
            Your Goals
          </h1>
          <p className="text-muted-foreground">Manage and track your personal goals</p>
        </div>
        <Button onClick={() => router.push('/onboarding')}>
          <Plus className="mr-2 h-4 w-4" /> New Goal
        </Button>
      </header>

      <div className="grid gap-6 md:grid-cols-[300px_1fr_1fr]">
        {/* Goals List */}
        <Card>
          <CardHeader>
            <CardTitle>Goals</CardTitle>
            <CardDescription>Select a goal to view details</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[calc(100vh-300px)]">
              {goals.map((goal) => (
                <Button
                  key={goal.id}
                  variant={selectedGoal.id === goal.id ? "secondary" : "ghost"}
                  className="w-full justify-start mb-2"
                  onClick={() => setSelectedGoal(goal)}
                >
                  <div className="flex items-center justify-between w-full">
                    <span>{goal.title}</span>
                    <ChevronRight className="h-4 w-4" />
                  </div>
                </Button>
              ))}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Tasks Card */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl">{selectedGoal.title}</CardTitle>
                <CardDescription>{selectedGoal.description}</CardDescription>
              </div>
              <Button variant="outline" size="icon">
                <Pencil className="h-4 w-4" />
              </Button>
            </div>
            <div className="mt-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Progress</span>
                <span className="text-sm font-medium">{selectedGoal.progress}%</span>
              </div>
              <Progress value={selectedGoal.progress} className="w-full" />
            </div>
            <div className="flex justify-between items-center mt-4">
              <div className="flex items-center">
                <Calendar className="mr-2 h-4 w-4" />
                <span className="text-sm">
                  Start: {selectedGoal.start_date ? format(new Date(selectedGoal.start_date), 'MMM d, yyyy') : 'Not set'}
                </span>
              </div>
              <div className="flex items-center">
                <Calendar className="mr-2 h-4 w-4" />
                {isEditingDate ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      value={editedEndDate}
                      onChange={(e) => setEditedEndDate(e.target.value)}
                      className="text-sm p-1 border rounded"
                    />
                    <Button size="sm" onClick={handleEndDateUpdate}>Save</Button>
                    <Button size="sm" variant="outline" onClick={() => setIsEditingDate(false)}>Cancel</Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-sm">
                      End: {selectedGoal.end_date ? format(new Date(selectedGoal.end_date), 'MMM d, yyyy') : 'Not set'}
                    </span>
                    <Button size="sm" variant="ghost" onClick={() => setIsEditingDate(true)}>
                      <Pencil className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] w-full rounded-md border p-4">
              {selectedGoal.tasks.map((task: Task) => (
                <div key={task.id} className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <CheckCircle2 className={`mr-2 h-4 w-4 ${task.completed ? 'text-green-500' : 'text-gray-300'}`} />
                    <span className={task.completed ? 'line-through text-muted-foreground' : ''}>
                      {task.title}
                    </span>
                  </div>
                  <Badge>{task.type}</Badge>
                </div>
              ))}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Milestones Card */}
        <Card>
          <CardHeader>
            <CardTitle>Milestones</CardTitle>
            <CardDescription>Track your progress milestones</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px] w-full rounded-md border p-4">
              {selectedGoal.milestones.map((milestone: Milestone) => (
                <div key={milestone.id} className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <CheckCircle2 className={`mr-2 h-4 w-4 ${milestone.completed ? 'text-green-500' : 'text-gray-300'}`} />
                    <span className={milestone.completed ? 'line-through text-muted-foreground' : ''}>
                      {milestone.title}
                    </span>
                  </div>
                  <Badge variant="outline">{format(new Date(milestone.date), 'MMM d, yyyy')}</Badge>
                </div>
              ))}
            </ScrollArea>
          </CardContent>
          <CardFooter>
            <Button className="w-full" onClick={() => router.push(`/goals/${selectedGoal.id}`)}>
              View Full Details
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
} 