"use client"

import { useState, useEffect } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import { Card } from "@/components/ui/card"
import { useGoals } from "@/hooks/use-goals"
import { Task, Milestone, Goal } from "@/types/goals"
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
import './fullcalendar.css'
import { addDays, isBefore, startOfDay, endOfDay, eachDayOfInterval, getDay, parseISO, isAfter } from 'date-fns'

type TaskType = 'daily' | 'weekly' | 'custom'

interface CalendarEvent {
  id: string
  title: string
  start: string
  allDay: boolean
  backgroundColor?: string
  borderColor?: string
  textColor?: string
  display?: 'block' | 'list-item'
  classNames?: string[]
  extendedProps: {
    type: TaskType | 'milestone' | 'task-count'
    goalId?: string
    goalTitle?: string
    goalColor?: string
    completed?: boolean
    tasks?: Task[]
  }
}

export default function CalendarPage() {
  const { goals, tasks, isLoading, refreshGoals } = useGoals()
  const { user } = useUser()
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [selectedTasks, setSelectedTasks] = useState<Task[]>([])
  const [newTaskTitle, setNewTaskTitle] = useState("")
  const [newTaskType, setNewTaskType] = useState<TaskType>('custom')
  const [newTaskGoalId, setNewTaskGoalId] = useState<string>("no-goal")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isTaskListOpen, setIsTaskListOpen] = useState(false)
  const [localTaskStates, setLocalTaskStates] = useState<{ [key: string]: boolean }>({})

  // Initialize local task states when tasks change
  useEffect(() => {
    const newLocalStates = tasks.reduce((acc, task) => {
      acc[task.id] = task.completed
      return acc
    }, {} as { [key: string]: boolean })
    setLocalTaskStates(newLocalStates)
  }, [tasks])

  const getTaskEndDate = (task: Task, goals: Goal[]): Date => {
    if (task.goal_id) {
      const goal = goals.find(g => g.id === task.goal_id)
      if (goal) {
        return parseISO(goal.end_date)
      }
    }
    // If no goal is associated, use a default end date (e.g., 1 year from task start)
    const taskStartDate = parseISO(task.date)
    return addDays(taskStartDate, 365)
  }

  const generateEvents = (): CalendarEvent[] => {
    const events: CalendarEvent[] = []
    const tasksByDate: { [key: string]: Task[] } = {}
    const today = startOfDay(new Date())

    // Process tasks and create recurring instances
    tasks.forEach(task => {
      // Use local state for completion status if available
      const isCompleted = localTaskStates[task.id] ?? task.completed
      const taskWithLocalState = { ...task, completed: isCompleted }
      
      const taskStartDate = startOfDay(parseISO(task.date))
      const endDate = getTaskEndDate(task, goals)
      
      // Only process if the task hasn't ended
      if (!isAfter(today, endDate)) {
        if (task.type === 'daily') {
          const dates = eachDayOfInterval({ 
            start: isAfter(today, taskStartDate) ? today : taskStartDate,
            end: endDate 
          })
          dates.forEach(date => {
            const dateKey = date.toISOString().split('T')[0]
            if (!tasksByDate[dateKey]) {
              tasksByDate[dateKey] = []
            }
            tasksByDate[dateKey].push({ ...taskWithLocalState, date: date.toISOString() })
          })
        } else if (task.type === 'weekly' && typeof task.weekday === 'number') {
          let currentDate = isAfter(today, taskStartDate) ? today : taskStartDate
          while (isBefore(currentDate, endDate)) {
            if (getDay(currentDate) === task.weekday) {
              const dateKey = currentDate.toISOString().split('T')[0]
              if (!tasksByDate[dateKey]) {
                tasksByDate[dateKey] = []
              }
              tasksByDate[dateKey].push({ ...taskWithLocalState, date: currentDate.toISOString() })
            }
            currentDate = addDays(currentDate, 1)
          }
        } else {
          // Custom (one-time) tasks
          if (!isBefore(parseISO(task.date), today)) {
            const dateKey = task.date.split('T')[0]
            if (!tasksByDate[dateKey]) {
              tasksByDate[dateKey] = []
            }
            tasksByDate[dateKey].push(taskWithLocalState)
          }
        }
      }
    })

    // Add milestones first (they'll appear at the top)
    goals.forEach(goal => {
      goal.milestones?.forEach(milestone => {
        if (!isBefore(parseISO(milestone.date), today)) {
          events.push({
            id: milestone.id,
            title: milestone.title,
            start: milestone.date,
            allDay: true,
            backgroundColor: 'hsl(var(--primary) / 0.1)',
            borderColor: 'hsl(var(--primary))',
            textColor: 'hsl(var(--primary))',
            display: 'block',
            classNames: ['calendar-milestone'],
            extendedProps: {
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

    // Add task count events
    Object.entries(tasksByDate).forEach(([date, dateTasks]) => {
      const completedCount = dateTasks.filter(t => t.completed).length
      events.push({
        id: `tasks-${date}`,
        title: `${completedCount}/${dateTasks.length} Tasks`,
        start: date,
        allDay: true,
        backgroundColor: 'hsl(var(--primary) / 0.1)',
        borderColor: 'hsl(var(--primary))',
        textColor: 'hsl(var(--primary))',
        display: 'block',
        classNames: ['calendar-tasks'],
        extendedProps: {
          type: 'task-count',
          tasks: dateTasks
        }
      })
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
          user_id: user.id,
          weekday: newTaskType === 'weekly' ? selectedDate.getDay() : null
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

  const handleEventClick = (info: any) => {
    const event = info.event
    if (event.extendedProps.type === 'task-count') {
      setSelectedTasks(event.extendedProps.tasks)
      setIsTaskListOpen(true)
    }
  }

  const handleTaskCompletion = async (taskId: string, currentCompleted: boolean) => {
    try {
      // Update local state immediately
      setLocalTaskStates(prev => ({
        ...prev,
        [taskId]: !currentCompleted
      }))

      // Update selected tasks to reflect the change immediately
      setSelectedTasks(prev => 
        prev.map(task => 
          task.id === taskId 
            ? { ...task, completed: !currentCompleted }
            : task
        )
      )

      // Update in database
      const { error } = await supabase
        .from('tasks')
        .update({ completed: !currentCompleted })
        .eq('id', taskId)

      if (error) throw error

      // Close the dialog
      setIsTaskListOpen(false)

      // Refresh goals in the background
      refreshGoals()

      // Show success message
      toast.success('Task updated successfully')
    } catch (error) {
      // Revert local state on error
      setLocalTaskStates(prev => ({
        ...prev,
        [taskId]: currentCompleted
      }))
      setSelectedTasks(prev => 
        prev.map(task => 
          task.id === taskId 
            ? { ...task, completed: currentCompleted }
            : task
        )
      )
      console.error('Error updating task:', error)
      toast.error('Failed to update task')
    }
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
                Create a new task
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
                  onValueChange={(value: TaskType) => setNewTaskType(value)}
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
        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          events={generateEvents()}
          headerToolbar={{
            left: 'prev',
            center: 'title',
            right: 'next'
          }}
          height="calc(100vh - 250px)"
          dateClick={(info) => {
            setSelectedDate(info.date)
            setIsDialogOpen(true)
          }}
          eventClick={handleEventClick}
          eventContent={(eventInfo) => {
            const event = eventInfo.event
            const type = event.extendedProps.type

            if (type === 'task-count') {
              return (
                <div className="flex items-center justify-center p-1 w-full h-full rounded-md bg-primary/10 hover:bg-primary/20 transition-colors cursor-pointer">
                  <span className="font-medium text-primary">{event.title}</span>
                </div>
              )
            }

            if (type === 'milestone') {
              return (
                <div className="flex items-center gap-2 p-1 rounded-md bg-primary text-primary-foreground">
                  <Target className="h-3 w-3" />
                  <span className="font-medium">{event.title}</span>
                </div>
              )
            }

            return <div>{event.title}</div>
          }}
        />
      </Card>

      <Dialog open={isTaskListOpen} onOpenChange={setIsTaskListOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tasks</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedTasks.map(task => {
              const goal = goals.find(g => g.id === task.goal_id)
              const isCompleted = localTaskStates[task.id] ?? task.completed
              return (
                <div key={task.id} className="flex items-center justify-between gap-4 p-2 rounded-lg border">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={isCompleted}
                      className="rounded border-primary text-primary focus:ring-primary"
                      onChange={() => handleTaskCompletion(task.id, isCompleted)}
                    />
                    <span className={isCompleted ? 'line-through text-muted-foreground' : ''}>
                      {task.title}
                    </span>
                  </div>
                  {goal && (
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
                </div>
              )
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 