"use client"

import { useState } from 'react'
import { Plus, ChevronRight, Calendar, CheckCircle2, Target, Pencil } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'

// Mock data for demonstration
const goals = [
  {
    id: '1',
    title: 'Run a Marathon',
    description: 'Complete a full marathon in under 4 hours',
    progress: 45,
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    milestones: [
      { id: 'm1', title: 'Run 5K', date: '2024-03-15', completed: true },
      { id: 'm2', title: 'Run 10K', date: '2024-06-30', completed: false },
      { id: 'm3', title: 'Run Half Marathon', date: '2024-09-30', completed: false },
      { id: 'm4', title: 'Complete Marathon', date: '2024-12-31', completed: false },
    ],
    tasks: [
      { id: 't1', title: 'Daily 5K run', type: 'daily', completed: false },
      { id: 't2', title: 'Strength training', type: 'weekly', completed: false },
      { id: 't3', title: 'Long run (15K)', type: 'weekly', completed: false },
    ]
  },
  {
    id: '2',
    title: 'Learn Guitar',
    description: 'Master playing guitar and perform a song in public',
    progress: 30,
    startDate: '2024-02-01',
    endDate: '2024-11-30',
    milestones: [
      { id: 'm5', title: 'Learn basic chords', date: '2024-04-30', completed: true },
      { id: 'm6', title: 'Play first full song', date: '2024-07-31', completed: false },
      { id: 'm7', title: 'Compose original song', date: '2024-10-31', completed: false },
      { id: 'm8', title: 'Perform in public', date: '2024-11-30', completed: false },
    ],
    tasks: [
      { id: 't4', title: 'Practice chords', type: 'daily', completed: false },
      { id: 't5', title: 'Learn new song', type: 'weekly', completed: false },
      { id: 't6', title: 'Record practice session', type: 'weekly', completed: false },
    ]
  }
]

export default function GoalsPage() {
  const router = useRouter()
  const [selectedGoal, setSelectedGoal] = useState(goals[0])

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

      <div className="grid gap-6 md:grid-cols-[300px_1fr]">
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

        {/* Goal Details */}
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
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Progress</span>
                <span className="text-sm font-medium">{selectedGoal.progress}%</span>
              </div>
              <Progress value={selectedGoal.progress} className="w-full" />
            </div>
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center">
                <Calendar className="mr-2 h-4 w-4" />
                <span className="text-sm">Start: {format(new Date(selectedGoal.startDate), 'MMM d, yyyy')}</span>
              </div>
              <div className="flex items-center">
                <Calendar className="mr-2 h-4 w-4" />
                <span className="text-sm">End: {format(new Date(selectedGoal.endDate), 'MMM d, yyyy')}</span>
              </div>
            </div>
            <Tabs defaultValue="milestones">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="milestones">Milestones</TabsTrigger>
                <TabsTrigger value="tasks">Tasks</TabsTrigger>
              </TabsList>
              <TabsContent value="milestones">
                <ScrollArea className="h-[300px] w-full rounded-md border p-4">
                  {selectedGoal.milestones.map((milestone) => (
                    <div key={milestone.id} className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <CheckCircle2 className={`mr-2 h-4 w-4 ${milestone.completed ? 'text-green-500' : 'text-gray-300'}`} />
                        <span className={milestone.completed ? 'line-through text-muted-foreground' : ''}>{milestone.title}</span>
                      </div>
                      <Badge variant="outline">{format(new Date(milestone.date), 'MMM d, yyyy')}</Badge>
                    </div>
                  ))}
                </ScrollArea>
              </TabsContent>
              <TabsContent value="tasks">
                <ScrollArea className="h-[300px] w-full rounded-md border p-4">
                  {selectedGoal.tasks.map((task) => (
                    <div key={task.id} className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <CheckCircle2 className={`mr-2 h-4 w-4 ${task.completed ? 'text-green-500' : 'text-gray-300'}`} />
                        <span className={task.completed ? 'line-through text-muted-foreground' : ''}>{task.title}</span>
                      </div>
                      <Badge>{task.type}</Badge>
                    </div>
                  ))}
                </ScrollArea>
              </TabsContent>
            </Tabs>
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