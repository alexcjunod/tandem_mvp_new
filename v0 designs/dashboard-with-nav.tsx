"use client"

import { useState, useMemo } from "react"
import { Plus, Flame, Check, BarChart3, Users, User, Settings, LogOut, Menu, Home } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar } from "@/components/ui/calendar"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
}

function Sidebar({ className }: SidebarProps) {
  const [selected, setSelected] = useState("dashboard")
  
  const links = [
    { name: "Dashboard", icon: Home, href: "/dashboard" },
    { name: "Goals", icon: BarChart3, href: "/goals" },
    { name: "Community", icon: Users, href: "/community" },
    { name: "Profile", icon: User, href: "/profile" },
    { name: "Settings", icon: Settings, href: "/settings" },
  ]

  return (
    <div className={cn("pb-12", className)}>
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
            Menu
          </h2>
          <div className="space-y-1">
            {links.map((link) => (
              <Button
                key={link.name}
                variant={selected === link.name.toLowerCase() ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => setSelected(link.name.toLowerCase())}
              >
                <link.icon className="mr-2 h-4 w-4" />
                {link.name}
              </Button>
            ))}
          </div>
        </div>
      </div>
      <div className="px-3 py-2">
        <Button variant="ghost" className="w-full justify-start text-muted-foreground">
          <LogOut className="mr-2 h-4 w-4" />
          Log out
        </Button>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [selectedGoal, setSelectedGoal] = useState<string>("all")
  
  // Mock data for goals
  const [goals, setGoals] = useState([
    { id: 1, title: "Read for 30 minutes", completed: false },
    { id: 2, title: "Exercise for 1 hour", completed: true },
    { id: 3, title: "Meditate for 10 minutes", completed: false },
    { id: 4, title: "Write 500 words", completed: false },
  ])

  // Mock data for daily goal completion
  const [dailyCompletion, setDailyCompletion] = useState(() => {
    const pastWeek = getPastWeekDates()
    return pastWeek.map(date => ({
      date,
      completed: Math.floor(Math.random() * (goals.length + 1)),
      total: goals.length
    }))
  })

  const filteredGoals = selectedGoal === "all" 
    ? goals 
    : goals.filter(goal => goal.id.toString() === selectedGoal)

  const handleGoalToggle = (id: number) => {
    setGoals(goals.map(goal => 
      goal.id === id ? { ...goal, completed: !goal.completed } : goal
    ))
  }

  const handleSelectAll = (checked: boolean) => {
    setGoals(goals.map(goal => ({ ...goal, completed: checked })))
  }

  const allCompleted = filteredGoals.every(goal => goal.completed)
  const streakDays = 3 // This would be calculated based on actual data

  // Prepare data for the bar chart
  const chartData = useMemo(() => {
    return dailyCompletion.map(day => ({
      ...day,
      completionRate: (day.completed / day.total) * 100
    }))
  }, [dailyCompletion])

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-64 border-r min-h-screen">
        <div className="sticky top-0">
          <div className="flex h-14 items-center border-b px-6 font-semibold">
            <Flame className="mr-2 h-5 w-5 text-primary" />
            GoalTracker
          </div>
          <Sidebar />
        </div>
      </aside>

      {/* Mobile sidebar */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="lg:hidden">
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <div className="flex h-14 items-center border-b px-6 font-semibold">
            <Flame className="mr-2 h-5 w-5 text-primary" />
            GoalTracker
          </div>
          <Sidebar />
        </SheetContent>
      </Sheet>

      <main className="flex-1 p-6">
        <header className="mb-6">
          <h1 className="text-3xl font-bold">Goal Dashboard</h1>
          <p className="text-muted-foreground">Track your progress and stay accountable</p>
        </header>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Your Goals</CardTitle>
                  <CardDescription>Manage and track your daily goals</CardDescription>
                </div>
                <Select value={selectedGoal} onValueChange={setSelectedGoal}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select a goal" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Goals</SelectItem>
                    {goals.map(goal => (
                      <SelectItem key={goal.id} value={goal.id.toString()}>{goal.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2 mb-4">
                <Checkbox 
                  id="select-all" 
                  checked={allCompleted}
                  onCheckedChange={handleSelectAll}
                />
                <label
                  htmlFor="select-all"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Select All
                </label>
              </div>
              <ul className="space-y-4">
                {filteredGoals.map(goal => (
                  <li key={goal.id} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`goal-${goal.id}`} 
                      checked={goal.completed}
                      onCheckedChange={() => handleGoalToggle(goal.id)}
                    />
                    <label
                      htmlFor={`goal-${goal.id}`}
                      className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${
                        goal.completed ? 'line-through text-muted-foreground' : ''
                      }`}
                    >
                      {goal.title}
                    </label>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button className="w-full">
                <Plus className="mr-2 h-4 w-4" /> Add New Goal
              </Button>
            </CardFooter>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Goal Streak</CardTitle>
                <CardDescription>Your current progress streak</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <Flame className="h-6 w-6 text-orange-500" />
                  <Progress value={33} className="w-full" />
                  <span className="text-xl font-bold">{streakDays} days</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Activity Calendar</CardTitle>
                <CardDescription>Your goal completion history</CardDescription>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  className="rounded-md border"
                />
              </CardContent>
            </Card>
          </div>
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Detailed Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="daily" className="w-full">
              <TabsList>
                <TabsTrigger value="daily">Daily</TabsTrigger>
                <TabsTrigger value="weekly">Weekly</TabsTrigger>
                <TabsTrigger value="monthly">Monthly</TabsTrigger>
              </TabsList>
              <TabsContent value="daily">
                <div className="mt-4">
                  <h3 className="text-lg font-semibold mb-2">Daily Goal Completion Rate</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData}>
                      <XAxis 
                        dataKey="date" 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      />
                      <YAxis 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'hsl(var(--background))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '0.5rem',
                        }}
                      />
                      <Bar dataKey="completionRate" radius={[4, 4, 0, 0]}>
                        {chartData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={`hsl(${entry.completionRate * 1.2}, 70%, 50%)`}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </TabsContent>
              <TabsContent value="weekly">Weekly progress visualization goes here</TabsContent>
              <TabsContent value="monthly">Monthly progress visualization goes here</TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

// Helper function to generate dates for the past week
const getPastWeekDates = () => {
  const dates = []
  for (let i = 6; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    dates.push(date.toISOString().split('T')[0])
  }
  return dates
}