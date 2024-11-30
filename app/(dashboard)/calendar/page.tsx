"use client"

import { useState } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import { Card } from "@/components/ui/card"
import { useGoals } from "@/hooks/use-goals"
import { Task, Milestone, Goal } from "@/types/goals"
import { Target, Calendar } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { useUser } from "@clerk/nextjs"
import './fullcalendar.css'
import { isBefore, startOfDay, parseISO, getDay, addMonths, addDays, isSameDay, format } from 'date-fns'

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
    type: 'milestone' | 'task-count'
    goalId?: string
    goalTitle?: string
    goalColor?: string
    completed?: boolean
    tasks?: Task[]
    date?: string
  }
}

export default function CalendarPage() {
  const { goals, tasks, isLoading } = useGoals()
  const [selectedTasks, setSelectedTasks] = useState<Task[]>([])
  const [isTaskListOpen, setIsTaskListOpen] = useState(false)
  const today = startOfDay(new Date())

  const getLatestGoalEndDate = (): Date => {
    const endDates = goals
      .map(goal => parseISO(goal.end_date))
      .filter(date => !isNaN(date.getTime()))

    if (endDates.length === 0) {
      return addMonths(new Date(), 6) // Default to 6 months if no goals
    }

    return new Date(Math.max(...endDates.map(date => date.getTime())))
  }

  const generateEvents = (): CalendarEvent[] => {
    const events: CalendarEvent[] = []
    const endDate = getLatestGoalEndDate()
    let currentDate = startOfDay(new Date())

    // Process tasks day by day until the end date
    while (isBefore(currentDate, endDate)) {
      const dateKey = format(currentDate, 'yyyy-MM-dd')
      const dayOfWeek = getDay(currentDate)
      const tasksForDay: Task[] = []

      // Add daily tasks
      tasks.forEach(task => {
        if (task.type === 'daily') {
          const projectedTask = {
            ...task,
            date: dateKey,
            completed: isSameDay(parseISO(task.date), currentDate) ? task.completed : false
          }
          tasksForDay.push(projectedTask)
        }
      })

      // Add weekly tasks that match the current day of week
      tasks.forEach(task => {
        if (task.type === 'weekly' && task.weekday === dayOfWeek) {
          const projectedTask = {
            ...task,
            date: dateKey,
            completed: isSameDay(parseISO(task.date), currentDate) ? task.completed : false
          }
          tasksForDay.push(projectedTask)
        }
      })

      if (tasksForDay.length > 0) {
        const completedTasks = tasksForDay.filter(t => t.completed).length
        const totalTasks = tasksForDay.length
        const title = `${completedTasks}/${totalTasks} Tasks`

        events.push({
          id: `tasks-${dateKey}`,
          title,
          start: dateKey,
          allDay: true,
          backgroundColor: 'hsl(var(--primary) / 0.1)',
          borderColor: 'hsl(var(--primary))',
          textColor: 'hsl(var(--primary))',
          display: 'block',
          classNames: ['calendar-tasks'],
          extendedProps: {
            type: 'task-count',
            tasks: tasksForDay,
            date: dateKey
          }
        })
      }

      currentDate = addDays(currentDate, 1)
    }

    // Add milestones
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

    return events
  }

  const handleEventClick = (info: any) => {
    const event = info.event
    if (event.extendedProps.type === 'task-count') {
      setSelectedTasks(event.extendedProps.tasks)
      setIsTaskListOpen(true)
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
          <p className="text-muted-foreground">View your recurring tasks and milestones</p>
        </div>
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
          eventClick={handleEventClick}
          validRange={{
            start: today,
            end: getLatestGoalEndDate()
          }}
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
            <DialogTitle>Tasks for {selectedTasks[0]?.date}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedTasks.map(task => {
              const goal = goals.find(g => g.id === task.goal_id)
              return (
                <div key={task.id} className="flex items-center justify-between gap-4 p-2 rounded-lg border">
                  <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded border ${task.completed ? 'bg-primary border-primary' : 'border-primary'}`} />
                    <div>
                      <span className={task.completed ? 'line-through text-muted-foreground' : ''}>
                        {task.title}
                      </span>
                      <Badge variant="secondary" className="ml-2">
                        {task.type}
                      </Badge>
                    </div>
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

/// comment to push to github
