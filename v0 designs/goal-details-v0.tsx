"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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

// Mock data for demonstration
const goalDetails = {
  id: '1',
  title: 'Run a Marathon',
  smartGoal: {
    specific: "Complete a full marathon (26.2 miles) race",
    measurable: "Finish the race in under 4 hours",
    achievable: "Gradually increase weekly mileage and follow a structured training plan",
    relevant: "Improve overall fitness and accomplish a major personal challenge",
    timeBound: "Achieve this goal within 12 months, by December 31, 2024"
  },
  reasoning: "I've always been passionate about running and pushing my limits. Completing a marathon represents the ultimate test of endurance and mental strength. It's a personal challenge that will help me stay motivated, improve my overall health, and prove to myself that I can achieve anything I set my mind to.",
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
    { id: 't4', title: 'Rest and recovery', type: 'weekly', completed: false },
    { id: 't5', title: 'Cross-training (swimming or cycling)', type: 'weekly', completed: false },
  ]
}

export default function GoalDetailsPage() {
  const router = useRouter()
  const [isEditingGoal, setIsEditingGoal] = useState(false)
  const [editedGoal, setEditedGoal] = useState(goalDetails)

  const handleEditGoal = () => {
    setIsEditingGoal(true)
    setEditedGoal(goalDetails)
  }

  const handleSaveGoal = () => {
    // Here you would typically save the edited goal to your backend
    console.log('Saving edited goal:', editedGoal)
    setIsEditingGoal(false)
    // Update the goalDetails state or refetch the goal data
  }

  const daysRemaining = differenceInDays(new Date(goalDetails.endDate), new Date())

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
                  <CardTitle className="text-3xl font-bold">{goalDetails.title}</CardTitle>
                  <CardDescription>{goalDetails.description}</CardDescription>
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
                  <span className="text-sm font-medium">{goalDetails.progress}%</span>
                </div>
                <Progress value={goalDetails.progress} className="w-full" />
              </div>
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center">
                  <Calendar className="mr-2 h-4 w-4" />
                  <span className="text-sm">Start: {format(new Date(goalDetails.startDate), 'MMM d, yyyy')}</span>
                </div>
                <div className="flex items-center">
                  <Calendar className="mr-2 h-4 w-4" />
                  <span className="text-sm">End: {format(new Date(goalDetails.endDate), 'MMM d, yyyy')}</span>
                </div>
              </div>
              <Badge variant="secondary" className="mb-4">
                {daysRemaining} days remaining
              </Badge>
              <h3 className="text-lg font-semibold mb-2">SMART Goal Breakdown</h3>
              <ul className="list-disc pl-5 space-y-2 mb-4">
                <li><strong>Specific:</strong> {goalDetails.smartGoal.specific}</li>
                <li><strong>Measurable:</strong> {goalDetails.smartGoal.measurable}</li>
                <li><strong>Achievable:</strong> {goalDetails.smartGoal.achievable}</li>
                <li><strong>Relevant:</strong> {goalDetails.smartGoal.relevant}</li>
                <li><strong>Time-bound:</strong> {goalDetails.smartGoal.timeBound}</li>
              </ul>
              <h3 className="text-lg font-semibold mb-2">Your Reasoning</h3>
              <p className="text-sm text-muted-foreground">{goalDetails.reasoning}</p>
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
                    {goalDetails.milestones.map((milestone) => (
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
                    {goalDetails.tasks.map((task) => (
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
                      <Input id="milestone-title" className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="milestone-date" className="text-right">
                        Date
                      </Label>
                      <Input id="milestone-date" type="date" className="col-span-3" />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit">Add Milestone</Button>
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
                      <Input id="task-title" className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="task-type" className="text-right">
                        Type
                      </Label>
                      <select id="task-type" className="col-span-3">
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="custom">Custom</option>
                      </select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit">Add Task</Button>
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
                value={editedGoal.title}
                onChange={(e) => setEditedGoal({ ...editedGoal, title: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Textarea
                id="description"
                value={editedGoal.description}
                onChange={(e) => setEditedGoal({ ...editedGoal, description: e.target.value })}
                className="col-span-3"
              />
            </div>
            {/* Add more fields for editing SMART goal details */}
          </div>
          <DialogFooter>
            <Button type="submit" onClick={handleSaveGoal}>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}