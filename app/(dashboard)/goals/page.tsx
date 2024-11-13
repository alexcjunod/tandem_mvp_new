"use client"

import { useState, useEffect } from 'react'
import { useUser } from "@clerk/nextjs"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { format } from 'date-fns'
import { useRouter } from "next/navigation"
import { Target, Plus, Calendar, ArrowRight, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function GoalsPage() {
  const { user } = useUser()
  const router = useRouter()
  const [goals, setGoals] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    async function fetchGoals() {
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
          .eq('user_id', user.id)

        if (error) throw error

        if (data) {
          setGoals(data)
        }
      } catch (err) {
        console.error('Error fetching goals:', err)
        toast.error('Failed to load goals')
      } finally {
        setIsLoading(false)
      }
    }

    fetchGoals()
  }, [user, supabase])

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Target className="h-8 w-8" />
            Your Goals
          </h1>
          <p className="text-muted-foreground">Track and manage your personal goals</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Goal
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {goals.map((goal) => (
          <Card key={goal.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle>{goal.title}</CardTitle>
              <CardDescription>{goal.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Progress</span>
                    <span>{goal.progress}%</span>
                  </div>
                  <Progress value={goal.progress} />
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-2">Tasks</h4>
                  <div className="space-y-2">
                    {goal.tasks?.slice(0, 3).map((task: any) => (
                      <div key={task.id} className="flex items-center gap-2">
                        <CheckCircle2 className={`h-4 w-4 ${task.completed ? 'text-green-500' : 'text-gray-300'}`} />
                        <span className={`text-sm ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                          {task.title}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>{format(new Date(goal.start_date), 'MMM d')}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>{format(new Date(goal.end_date), 'MMM d')}</span>
                  </div>
                </div>

                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => router.push(`/goals/${goal.id}`)}
                >
                  View Details
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
} 