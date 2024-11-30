"use client"

import { useState } from 'react'
import { Calendar as BigCalendar, dateFnsLocalizer, View } from 'react-big-calendar'
import format from 'date-fns/format'
import parse from 'date-fns/parse'
import startOfWeek from 'date-fns/startOfWeek'
import getDay from 'date-fns/getDay'
import addDays from 'date-fns/addDays'
import isSameDay from 'date-fns/isSameDay'
import startOfMonth from 'date-fns/startOfMonth'
import endOfMonth from 'date-fns/endOfMonth'
import eachDayOfInterval from 'date-fns/eachDayOfInterval'
import { Card } from "@/components/ui/card"
import { useGoals } from "@/hooks/use-goals"
import { Task, Milestone } from "@/types/goals"
import { Button } from "@/components/ui/button"
import { Plus, Target, Calendar } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { useUser } from "@clerk/nextjs"
import { supabase } from "@/lib/supabase/client"
import './calendar.css'

const locales = {
  'en-US': require('date-fns/locale/en-US')
}

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
})

type TaskType = 'daily' | 'weekly' | 'custom'

interface CalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  allDay: boolean
  resource: {
    type: TaskType | 'milestone'
    goalId?: string
    goalTitle?: string
    goalColor?: string
    completed: boolean
  }
}

export default function CalendarPage() {
  const { goals, tasks, isLoading, refreshGoals } = useGoals()
  const { user } = useUser()
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [currentDate, setCurrentDate] = useState<Date>(new Date())
  const [view, setView] = useState<View>('month')
  const [newTaskTitle, setNewTaskTitle] = useState("")
  const [newTaskType, setNewTaskType] = useState<'daily' | 'weekly' | 'custom'>('custom')
  const [newTaskGoalId, setNewTaskGoalId] = useState<string>("no-goal")
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // Generate recurring events for the visible month
  const generateEvents = (): CalendarEvent[] => {
    const events: CalendarEvent[] = []
    const start = startOfMonth(currentDate)
    const end = endOfMonth(currentDate)
    const daysInMonth = eachDayOfInterval({ start, end })

    // Add milestones first
    goals.forEach(goal => {
      goal.milestones?.forEach(milestone => {
        const milestoneDate = new Date(milestone.date)
        if (isSameDay(milestoneDate, start) || isSameDay(milestoneDate, end) || (milestoneDate > start && milestoneDate < end)) {
          events.push({
            id: milestone.id,
            title: milestone.title,
            start: milestoneDate,
            end: milestoneDate,
            allDay: true,
            resource: {
              type: 'milestone',
              goalId: goal.id,
              goalTitle: goal.title,
              goalColor: goal.color,
              completed: milestone.completed
            }
          })
        }
      })
    })

    // Add daily tasks
    daysInMonth.forEach(date => {
      const dailyTasks = tasks.filter(task => task.type === 'daily')
      dailyTasks.forEach(task => {
        const goal = goals.find(g => g.id === task.goal_id)
        events.push({
          id: `${task.id}-${date.toISOString()}`,
          title: task.title,
          start: date,
          end: date,
          allDay: true,
          resource: {
            type: 'daily',
            goalId: task.goal_id,
            goalTitle: goal?.title,
            goalColor: goal?.color,
            completed: task.completed
          }
        })
      })
    })

    // Add weekly tasks
    daysInMonth.forEach(date => {
      const weeklyTasks = tasks.filter(task => task.type === 'weekly' && typeof task.weekday === 'number')
      weeklyTasks.forEach(task => {
        if (date.getDay() === task.weekday) {
          const goal = goals.find(g => g.id === task.goal_id)
          events.push({
            id: `${task.id}-${date.toISOString()}`,
            title: task.title,
            start: date,
            end: date,
            allDay: true,
            resource: {
              type: 'weekly',
              goalId: task.goal_id,
              goalTitle: goal?.title,
              goalColor: goal?.color,
              completed: task.completed
            }
          })
        }
      })
    })

    // Add custom tasks
    const customTasks = tasks.filter(task => task.type === 'custom' as TaskType)
    customTasks.forEach(task => {
      const taskDate = new Date(task.date)
      if (isSameDay(taskDate, start) || isSameDay(taskDate, end) || (taskDate > start && taskDate < end)) {
        const goal = goals.find(g => g.id === task.goal_id)
        events.push({
          id: task.id,
          title: task.title,
          start: taskDate,
          end: taskDate,
          allDay: true,
          resource: {
            type: 'custom',
            goalId: task.goal_id,
            goalTitle: goal?.title,
            goalColor: goal?.color,
            completed: task.completed
          }
        })
      }
    })

    return events
  }

  const handleAddTask = async () => {
    if (!newTaskTitle || !user) return

    try {
      const { data: newTask, error } = await supabase
        .from('tasks')
        .insert([{
          title: newTaskTitle,
          type: newTaskType,
          date: selectedDate.toISOString(),
          goal_id: newTaskGoalId === "no-goal" ? null : newTaskGoalId,
          completed: false,
          user_id: user.id
        }])
        .select()
        .single()

      if (error) throw error

      await refreshGoals()
      setNewTaskTitle("")
      setNewTaskType('custom')
      setNewTaskGoalId("no-goal")
      setIsDialogOpen(false)
      toast.success('Task added successfully!')
    } catch (error) {
      console.error('Error adding task:', error)
      toast.error('Failed to add task')
    }
  }

  const EventComponent = ({ event }: { event: CalendarEvent }) => {
    const { type, goalId, goalTitle, goalColor, completed } = event.resource
    
    // Milestone styling
    if (type === 'milestone') {
      return (
        <div className="flex items-center gap-2 p-1 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
          <Target className="h-3 w-3" />
          <span className="font-medium">{event.title}</span>
          {goalId && (
            <Badge 
              variant="outline" 
              className="ml-auto border-primary-foreground text-primary-foreground"
            >
              {goalTitle}
            </Badge>
          )}
        </div>
      )
    }

    // Regular task styling
    return (
      <div className={`flex items-center gap-2 p-1 rounded-md hover:bg-accent transition-colors ${
        completed ? 'opacity-50' : ''
      }`}>
        <span className={completed ? 'line-through' : ''}>{event.title}</span>
        <div className="flex gap-1 ml-auto">
          {goalId && (
            <Badge 
              variant="outline" 
              style={{ 
                borderColor: goalColor,
                color: goalColor
              }}
            >
              {goalTitle}
            </Badge>
          )}
          <Badge variant="secondary" className="capitalize">
            {type}
          </Badge>
        </div>
      </div>
    )
  }

  const handleNavigate = (newDate: Date) => {
    setCurrentDate(newDate)
  }

  const handleViewChange = (newView: View) => {
    setView(newView)
  }

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Calendar className="h-8 w-8" />
            Calendar
          </h1>
          <p className="text-muted-foreground">View and manage your tasks and milestones</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Add Task
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New Task</DialogTitle>
              <DialogDescription>
                Create a new task for {format(selectedDate, 'MMMM d, yyyy')}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Task Title</Label>
                <Input
                  id="title"
                  placeholder="Enter task title"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="type">Task Type</Label>
                <Select
                  value={newTaskType}
                  onValueChange={(value: 'daily' | 'weekly' | 'custom') => setNewTaskType(value)}
                >
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Select task type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="goal">Associated Goal</Label>
                <Select value={newTaskGoalId} onValueChange={setNewTaskGoalId}>
                  <SelectTrigger id="goal">
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
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddTask}>Add Task</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="p-4">
        <BigCalendar
          localizer={localizer}
          events={generateEvents()}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 'calc(100vh - 250px)' }}
          components={{
            event: EventComponent
          }}
          date={currentDate}
          onNavigate={handleNavigate}
          view={view}
          onView={handleViewChange}
          onSelectSlot={({ start }) => {
            setSelectedDate(new Date(start))
            setIsDialogOpen(true)
          }}
          selectable
          popup
          views={['month', 'week', 'day']}
          className="rounded-md"
        />
      </Card>
    </div>
  )
} 