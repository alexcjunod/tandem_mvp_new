"use client"

import { useState, useEffect } from 'react'
import { useUser } from "@clerk/nextjs"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { format } from 'date-fns'
import { useRouter } from "next/navigation"
import { 
  Target, 
  Calendar, 
  CheckCircle2, 
  Pencil,
  ChevronLeft,
  Trash2
} from 'lucide-react'
import { toast } from 'sonner'

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

export default function GoalDetailsPage({ params }: { params: { id: string } }) {
  const { user } = useUser()
  const router = useRouter()
  const [goal, setGoal] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditingDate, setIsEditingDate] = useState(false)
  const [editedEndDate, setEditedEndDate] = useState('')
  const supabase = createClientComponentClient()

  useEffect(() => {
    async function fetchGoal() {
      if (!user) return
      
      try {
        setIsLoading(true)
        const { data, error } = await supabase
          .from('goals')
          .select(`
            *,
            tasks (*),
            milestones (*)
          `)
          .eq('id', params.id)
          .single()

        if (error) throw error

        if (data) {
          setGoal(data)
          setEditedEndDate(data.end_date)
        }
      } catch (err) {
        console.error('Error fetching goal:', err)
        toast.error('Failed to load goal')
      } finally {
        setIsLoading(false)
      }
    }

    fetchGoal()
  }, [user, supabase, params.id])

  const handleEndDateUpdate = async () => {
    try {
      const { error } = await supabase
        .from('goals')
        .update({ end_date: editedEndDate })
        .eq('id', goal.id)

      if (error) throw error

      setGoal({ ...goal, end_date: editedEndDate })
      setIsEditingDate(false)
      toast.success('Goal updated')
    } catch (err) {
      console.error('Error updating goal:', err)
      toast.error('Failed to update goal')
    }
  }

  if (isLoading || !goal) {
    return <div>Loading...</div>
  }

  return (
    <div className="container mx-auto p-6">
      <Button
        variant="ghost"
        className="mb-6"
        onClick={() => router.push('/goals')}
      >
        <ChevronLeft className="h-4 w-4 mr-2" />
        Back to Goals
      </Button>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-3xl font-bold flex items-center gap-2">
              <Target className="h-8 w-8" />
              {goal.title}
            </CardTitle>
            <CardDescription>{goal.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <Calendar className="mr-2 h-4 w-4" />
                  <span className="text-sm">
                    Start: {format(new Date(goal.start_date), 'MMM d, yyyy')}
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
                      <Button size="sm" onClick={handleEndDateUpdate}>
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setIsEditingDate(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-sm">
                        End: {format(new Date(goal.end_date), 'MMM d, yyyy')}
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setIsEditingDate(true)}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">SMART Goal</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Badge variant="outline" className="mb-2">
                      Specific
                    </Badge>
                    <p className="text-sm">{goal.smart_goal.specific}</p>
                  </div>
                  <div>
                    <Badge variant="outline" className="mb-2">
                      Measurable
                    </Badge>
                    <p className="text-sm">{goal.smart_goal.measurable}</p>
                  </div>
                  <div>
                    <Badge variant="outline" className="mb-2">
                      Achievable
                    </Badge>
                    <p className="text-sm">{goal.smart_goal.achievable}</p>
                  </div>
                  <div>
                    <Badge variant="outline" className="mb-2">
                      Relevant
                    </Badge>
                    <p className="text-sm">{goal.smart_goal.relevant}</p>
                  </div>
                  <div>
                    <Badge variant="outline" className="mb-2">
                      Time-bound
                    </Badge>
                    <p className="text-sm">{goal.smart_goal.timeBound}</p>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold">Tasks</h3>
                  <Button size="sm" variant="outline">
                    Add Task
                  </Button>
                </div>
                <div className="space-y-2">
                  {goal.tasks?.map((task: any) => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between p-2 rounded hover:bg-muted"
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircle2
                          className={`h-4 w-4 cursor-pointer ${
                            task.completed ? 'text-green-500' : 'text-gray-300'
                          }`}
                        />
                        <span className={task.completed ? 'line-through' : ''}>
                          {task.title}
                        </span>
                      </div>
                      <Badge>{task.type}</Badge>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold">Milestones</h3>
                  <Button size="sm" variant="outline">
                    Add Milestone
                  </Button>
                </div>
                <div className="space-y-2">
                  {goal.milestones?.map((milestone: any) => (
                    <div
                      key={milestone.id}
                      className="flex items-center justify-between p-2 rounded hover:bg-muted"
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircle2
                          className={`h-4 w-4 cursor-pointer ${
                            milestone.completed ? 'text-green-500' : 'text-gray-300'
                          }`}
                        />
                        <span className={milestone.completed ? 'line-through' : ''}>
                          {milestone.title}
                        </span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(milestone.date), 'MMM d, yyyy')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Goal Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Overall Progress</span>
                  <span>{goal.progress}%</span>
                </div>
                <Progress value={goal.progress} />
              </div>
              <div>
                <h4 className="text-sm font-medium mb-2">Tasks Completed</h4>
                <p className="text-2xl font-bold">
                  {goal.tasks?.filter((t: any) => t.completed).length} /{' '}
                  {goal.tasks?.length}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-2">Milestones Achieved</h4>
                <p className="text-2xl font-bold">
                  {goal.milestones?.filter((m: any) => m.completed).length} /{' '}
                  {goal.milestones?.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 