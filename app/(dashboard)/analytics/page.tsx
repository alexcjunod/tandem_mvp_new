"use client"

import { useState, useMemo, useEffect } from 'react'
import { useGoals } from "@/hooks/use-goals"
import { useUser } from "@clerk/nextjs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { ChartContainer } from "@/components/ui/chart"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LabelList, Area, AreaChart } from 'recharts'
import { format, eachDayOfInterval, subDays, isSameDay, parseISO, isAfter, startOfDay } from 'date-fns'
import { Activity, Calendar, Target, Trophy, TrendingUp } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// Add ChartConfig type
type ChartConfig = {
  [key: string]: {
    label: string
    color?: string
  }
}

// Add this type for the time range
type TimeRangeType = "7d" | "30d" | "90d";

interface CompletionDataPoint {
  date: string
  completionRate: number
  completed: number
  total: number
}

interface GoalProgressData {
  name: string
  progress: number
  milestoneProgress: number
  taskProgress: number
  completedMilestones: number
  totalMilestones: number
  completedTasks: number
  totalTasks: number
  color: string
}

// Add this error fallback component
const ChartErrorFallback = () => (
  <div className="flex items-center justify-center h-full">
    <p className="text-muted-foreground">Unable to display chart</p>
  </div>
);

// Modify the AreaChartComponent
const AreaChartComponent = ({ data }: { data: CompletionDataPoint[] }) => {
  console.log('Area Chart Data:', data);

  const validData = useMemo(() => {
    if (!Array.isArray(data)) {
      console.log('Data is not an array');
      return [];
    }
    
    const filtered = data
      .filter(d => {
        const isValid = d && 
          typeof d.date === 'string' && 
          typeof d.completionRate === 'number' &&
          !isNaN(d.completionRate);
        if (!isValid) {
          console.log('Invalid data point:', d);
        }
        return isValid;
      });

    console.log('Filtered Data:', filtered);
    return filtered;
  }, [data]);

  if (!validData.length) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">No data available</p>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ResponsiveContainer>
        <AreaChart data={validData}>
          <defs>
            <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.1}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="date"
            scale="point"
            padding={{ left: 10, right: 10 }}
            tickFormatter={(value) => format(parseISO(value), 'MMM d')}
          />
          <YAxis
            domain={[0, 100]}
            tickCount={6}
            allowDecimals={false}
            scale="linear"
            tickFormatter={(value) => {
              const tick = Math.round(Number(value));
              return isNaN(tick) ? '0%' : `${tick}%`;
            }}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              return (
                <div className="rounded-lg border bg-background p-2 shadow-sm">
                  <p className="text-sm text-muted-foreground">
                    {format(parseISO(label), 'MMM d, yyyy')}
                  </p>
                  <p className="text-sm font-medium">
                    {`${payload[0].value}% Complete`}
                  </p>
                </div>
              );
            }}
          />
          <Area
            type="monotone"
            dataKey="completionRate"
            stroke="hsl(var(--primary))"
            fill="url(#colorRate)"
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

// Modify the BarChartComponent
const BarChartComponent = ({ data }: { data: GoalProgressData[] }) => {
  // Ensure we have valid data
  const validData = useMemo(() => {
    if (!Array.isArray(data)) return [];
    
    return data
      .filter(d => d && typeof d.name === 'string' && typeof d.progress === 'number')
      .map(d => ({
        ...d,
        progress: Math.min(100, Math.max(0, d.progress))
      }));
  }, [data]);

  if (!validData.length) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">No data available</p>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ResponsiveContainer>
        <BarChart
          data={validData}
          layout="horizontal"
          margin={{ top: 20, right: 50, left: 100, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
          <XAxis
            type="number"
            domain={[0, 100]}
            tickCount={6}
            scale="linear"
            allowDecimals={false}
            tickFormatter={(value) => {
              const tick = Math.round(Number(value));
              return isNaN(tick) ? '0%' : `${tick}%`;
            }}
          />
          <YAxis
            dataKey="name"
            type="category"
            width={100}
            scale="band"
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              return (
                <div className="rounded-lg border bg-background p-2 shadow-sm">
                  <p className="text-sm font-medium">{label}</p>
                  <p className="text-sm text-muted-foreground">
                    {`${payload[0].value}% Complete`}
                  </p>
                </div>
              );
            }}
          />
          <Bar
            dataKey="progress"
            fill="hsl(var(--primary))"
            radius={[0, 4, 4, 0]}
            isAnimationActive={false}
          >
            <LabelList
              dataKey="progress"
              position="right"
              formatter={(value: number) => `${Math.round(value)}%`}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default function AnalyticsPage() {
  const { goals, tasks, isLoading } = useGoals()
  const { user } = useUser()
  const [selectedGoalId, setSelectedGoalId] = useState<string>("all")
  const [timeRange, setTimeRange] = useState<TimeRangeType>("30d")
  const [completionData, setCompletionData] = useState<any[]>([])

  // Add this function to get the date range
  const getDateRange = () => {
    const endDate = new Date()
    const days = timeRange === "90d" ? 90 : timeRange === "30d" ? 30 : 7
    return {
      start: subDays(endDate, days - 1),
      end: endDate
    }
  }

  // Modify the useEffect that fetches completion data
  useEffect(() => {
    const fetchCompletionData = async () => {
      if (!user) {
        setCompletionData([]);
        return;
      }

      // Use local timezone for today's date
      const now = new Date();
      const today = startOfDay(new Date(now.getFullYear(), now.getMonth(), now.getDate()));
      const todayStr = format(today, 'yyyy-MM-dd');
      const { start, end } = getDateRange();
      
      try {
        // Get all tasks first
        const { data: allTasks } = await supabase
          .from('tasks')
          .select('*')
          .eq(selectedGoalId !== "all" ? 'goal_id' : 'user_id',
               selectedGoalId !== "all" ? selectedGoalId : user.id);

        console.log('Current time:', now);
        console.log('Today:', todayStr);
        console.log('All Tasks:', allTasks);

        // Get today's tasks
        const todaysTasks = allTasks?.filter(task => {
          const taskDate = task.type === 'custom' 
            ? parseISO(task.date)
            : null;
          
          const isDaily = task.type === 'daily';
          const isWeeklyToday = task.type === 'weekly' && task.weekday === now.getDay();
          const isCustomToday = task.type === 'custom' && 
            format(startOfDay(taskDate!), 'yyyy-MM-dd') === todayStr;
          
          return isDaily || isWeeklyToday || isCustomToday;
        }) || [];

        console.log('Tasks Debug:', {
          currentTime: now.toISOString(),
          localDate: todayStr,
          totalTasks: allTasks?.length,
          todaysTaskCount: todaysTasks.length,
          todaysTasks: todaysTasks.map(t => ({
            title: t.title,
            type: t.type,
            completed: t.completed
          }))
        });

        // Get task completions for the date range
        const { data: completions } = await supabase
          .from('task_completions')
          .select('*')
          .eq(selectedGoalId !== "all" ? 'goal_id' : 'user_id', 
               selectedGoalId !== "all" ? selectedGoalId : user.id)
          .gte('completion_date', format(start, 'yyyy-MM-dd'))
          .lte('completion_date', format(end, 'yyyy-MM-dd'));

        console.log('Task Completions:', {
          range: {
            start: format(start, 'yyyy-MM-dd'),
            end: format(end, 'yyyy-MM-dd')
          },
          completions
        });

        // Initialize the date map with today's data first
        const dateMap = {
          [todayStr]: {
            completed: todaysTasks.filter(t => {
              const completionKey = `${t.id}-${todayStr}`;
              return completions?.some(c => 
                c.task_id === t.id && 
                c.completion_date === todayStr && 
                c.completed
              );
            }).length,
            total: todaysTasks.length
          }
        };

        // Process past days
        eachDayOfInterval({ start, end }).forEach(date => {
          const dateStr = format(date, 'yyyy-MM-dd');
          if (dateStr === todayStr) return; // Skip today as we've already handled it

          const dayOfWeek = date.getDay();

          // Get tasks that should be active on this day
          const dayTasks = allTasks?.filter(task => {
            if (task.type === 'daily') return true;
            if (task.type === 'weekly' && task.weekday === dayOfWeek) return true;
            if (task.type === 'custom' && format(parseISO(task.date), 'yyyy-MM-dd') === dateStr) return true;
            return false;
          }) || [];

          if (dayTasks.length > 0) {
            const completedTasks = dayTasks.filter(task => 
              completions?.some(c => 
                c.task_id === task.id && 
                c.completion_date === dateStr && 
                c.completed
              )
            );

            dateMap[dateStr] = {
              completed: completedTasks.length,
              total: dayTasks.length
            };
          }
        });

        // Convert to array format
        const chartData = Object.entries(dateMap)
          .filter(([date]) => !isAfter(parseISO(date), today))
          .map(([date, stats]) => ({
            date,
            completed: stats.completed,
            total: stats.total,
            completionRate: stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0
          }))
          .sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime());

        console.log('Final chart data:', chartData);
        setCompletionData(chartData);
      } catch (error) {
        console.error('Error fetching completion data:', error);
        setCompletionData([]);
      }
    };

    fetchCompletionData();
  }, [user, selectedGoalId, timeRange]);

  // Add this chart config
  const chartConfig = {
    completionRate: {
      label: "Completion Rate",
      color: "hsl(var(--primary))",
    },
  } satisfies ChartConfig

  // Modify the goal progress calculation
  const goalProgress = useMemo(() => {
    if (!goals.length) return [];

    return goals
      .map(goal => {
        if (!goal.title) return null;

        const completedMilestones = Math.max(0, goal.milestones?.filter(m => m.completed).length ?? 0);
        const totalMilestones = Math.max(1, goal.milestones?.length ?? 1);
        const completedTasks = Math.max(0, goal.tasks?.filter(t => t.completed).length ?? 0);
        const totalTasks = Math.max(1, goal.tasks?.length ?? 1);

        const milestoneProgress = (completedMilestones / totalMilestones) * 70;
        const taskProgress = (completedTasks / totalTasks) * 30;
        const totalProgress = Math.min(100, Math.max(0, Math.round(milestoneProgress + taskProgress)));

        return {
          name: goal.title,
          progress: totalProgress,
          milestoneProgress: Math.min(100, Math.round((completedMilestones / totalMilestones) * 100)),
          taskProgress: Math.min(100, Math.round((completedTasks / totalTasks) * 100)),
          completedMilestones,
          totalMilestones,
          completedTasks,
          totalTasks,
          color: goal.color || 'hsl(var(--primary))'
        };
      })
      .filter((goal): goal is GoalProgressData => 
        goal !== null && 
        typeof goal.progress === 'number' && 
        !isNaN(goal.progress)
      )
      .sort((a, b) => b.progress - a.progress);
  }, [goals]);

  // Calculate streak data
  const streakData = useMemo(() => {
    const today = new Date()
    const last30Days = eachDayOfInterval({
      start: subDays(today, 29),
      end: today
    })

    let currentStreak = 0
    let longestStreak = 0
    let tempStreak = 0
    let totalCompletedDays = 0

    last30Days.forEach(date => {
      const dayTasks = tasks.filter(task => 
        (task.type === 'daily' || 
        (task.type === 'weekly' && task.weekday === date.getDay())) &&
        task.completed &&
        isSameDay(parseISO(task.date), date)
      )

      const allTasksForDay = tasks.filter(task =>
        (task.type === 'daily' ||
        (task.type === 'weekly' && task.weekday === date.getDay())) &&
        isSameDay(parseISO(task.date), date)
      )

      const isCompleted = dayTasks.length === allTasksForDay.length && allTasksForDay.length > 0

      if (isCompleted) {
        tempStreak++
        totalCompletedDays++
        if (tempStreak > longestStreak) {
          longestStreak = tempStreak
        }
      } else {
        if (isSameDay(date, today)) {
          currentStreak = tempStreak
        }
        tempStreak = 0
      }
    })

    return {
      currentStreak,
      longestStreak,
      completionRate: Math.round((totalCompletedDays / 30) * 100)
    }
  }, [tasks])

  // Modify the chart data preparation
  const chartData = useMemo(() => {
    console.log('Raw completion data:', completionData);
    
    const { start, end } = getDateRange();
    const defaultData = eachDayOfInterval({ start, end }).map(date => ({
      date: format(date, 'yyyy-MM-dd'),
      completionRate: 0,
      completed: 0,
      total: 0
    }));

    if (!completionData?.length) {
      console.log('Using default data:', defaultData);
      return defaultData;
    }

    try {
      const processed = completionData
        .filter(data => {
          const isValid = data && typeof data === 'object';
          if (!isValid) {
            console.log('Invalid completion data:', data);
          }
          return isValid;
        })
        .map(data => {
          const processed = {
            date: format(parseISO(data.date || new Date().toISOString()), 'yyyy-MM-dd'),
            completionRate: Math.max(0, Math.min(100, Number(data.completionRate) || 0)),
            completed: Math.max(0, Number(data.completed) || 0),
            total: Math.max(1, Number(data.total) || 1)
          };
          console.log('Processed data point:', processed);
          return processed;
        });

      console.log('Final processed data:', processed);
      return processed;
    } catch (error) {
      console.error('Error processing chart data:', error);
      return defaultData;
    }
  }, [completionData, timeRange]);

  // Modify the checks for rendering
  const hasData = Boolean(goals.length && chartData.length);
  const hasGoalProgress = Boolean(goalProgress.length);

  const hasValidData = useMemo(() => {
    return chartData.every(d => 
      d && 
      typeof d.date === 'string' && 
      typeof d.completionRate === 'number' && 
      !isNaN(d.completionRate)
    );
  }, [chartData]);

  // Modify the return statement to handle empty states
  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <div className="container mx-auto p-6">
      <header className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Activity className="h-8 w-8" />
          Analytics
        </h1>
        <p className="text-muted-foreground">Track your progress and achievements</p>
      </header>

      {!hasData ? (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>No Data Available</CardTitle>
            <CardDescription>
              Create goals and complete tasks to see your analytics here.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <>
          {/* Task Completion Area Chart */}
          <Card className="mb-6">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle>Task Completion Rate</CardTitle>
                <CardDescription>Daily completion rate over time</CardDescription>
              </div>
              <div className="flex gap-2">
                <Select value={selectedGoalId} onValueChange={setSelectedGoalId}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select goal" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Goals</SelectItem>
                    {goals.map(goal => (
                      <SelectItem key={goal.id} value={goal.id}>{goal.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select 
                  value={timeRange} 
                  onValueChange={(value: TimeRangeType) => setTimeRange(value)}
                >
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Time range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7d">Last 7 days</SelectItem>
                    <SelectItem value="30d">Last 30 days</SelectItem>
                    <SelectItem value="90d">Last 90 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                {hasValidData ? (
                  <AreaChartComponent data={chartData} />
                ) : (
                  <div className="flex items-center justify-center h-[350px]">
                    <p className="text-muted-foreground">No valid data available</p>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <div className="flex w-full items-start gap-2 text-sm">
                <div className="grid gap-2">
                  <div className="flex items-center gap-2 font-medium leading-none">
                    Average completion rate: {
                      Math.round(
                        chartData.reduce((acc, day) => acc + (day.completionRate || 0), 0) / 
                        chartData.length
                      )
                    }%
                    <TrendingUp className="h-4 w-4" />
                  </div>
                  <div className="flex items-center gap-2 leading-none text-muted-foreground">
                    {format(getDateRange().start, 'MMM d, yyyy')} - {format(getDateRange().end, 'MMM d, yyyy')}
                  </div>
                </div>
              </div>
            </CardFooter>
          </Card>

          {/* Goal Progress Chart */}
          {hasGoalProgress && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Goal Progress</CardTitle>
                <CardDescription>Overall progress based on milestones (70%) and tasks (30%)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <BarChartComponent data={goalProgress} />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Streak Stats */}
          <div className="grid gap-6 md:grid-cols-3 mb-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-4 w-4" />
                  Current Streak
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{streakData.currentStreak} days</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-4 w-4" />
                  Longest Streak
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{streakData.longestStreak} days</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  30-Day Completion Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{streakData.completionRate}%</div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Goal Stats */}
          {goals.length > 0 && (
            <div className="grid gap-6 md:grid-cols-2">
              {goalProgress.map((goal) => (
                <Card key={goal.name}>
                  <CardHeader>
                    <CardTitle>{goal.name}</CardTitle>
                    <CardDescription>Detailed progress breakdown</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="text-sm font-medium">Tasks</div>
                        <div className="text-2xl">{goal.completedTasks}/{goal.totalTasks}</div>
                        <div className="text-sm text-muted-foreground">{goal.taskProgress}% complete</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium">Milestones</div>
                        <div className="text-2xl">{goal.completedMilestones}/{goal.totalMilestones}</div>
                        <div className="text-sm text-muted-foreground">{goal.milestoneProgress}% complete</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium">Overall Progress</div>
                        <div className="text-2xl">{goal.progress}%</div>
                        <div className="text-sm text-muted-foreground">Weighted average of tasks and milestones</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
} 