"use client"

import { useState, useEffect } from 'react'
import { useUser } from "@clerk/nextjs"
import { format } from 'date-fns'
import { useRouter, useParams } from "next/navigation"
import { 
  Target, 
  Calendar, 
  CheckCircle2, 
  ChevronLeft,
  Plus,
  Pencil,
  Trash2
} from 'lucide-react'
import { toast } from 'sonner'
import { useGoals } from '@/hooks/use-goals'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import ReactConfetti from 'react-confetti'

import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"

const calculateProgress = (goal: Goal) => {
  if (!goal.milestones || goal.milestones.length === 0) return 0;
  
  const completedMilestones = goal.milestones.filter(m => m.completed).length;
  const totalMilestones = goal.milestones.length;
  
  return Math.round((completedMilestones / totalMilestones) * 100);
};

export default function GoalDetailsPage() {
  const params = useParams()
  const { user } = useUser()
  const router = useRouter()
  const supabase = createClientComponentClient()
  const { 
    goals, 
    updateGoal, 
    updateGoalTask, 
    updateGoalMilestone, 
    refreshGoals,
    deleteTask,
    deleteMilestone 
  } = useGoals()
  const [isLoading, setIsLoading] = useState(true)
  const [isEditingDate, setIsEditingDate] = useState(false)
  const [editedEndDate, setEditedEndDate] = useState('')
  const [isEditingSmart, setIsEditingSmart] = useState(false)
  const [editedSmartGoal, setEditedSmartGoal] = useState({
    specific: '',
    measurable: '',
    achievable: '',
    relevant: '',
    timeBound: ''
  })
  const [newTaskTitle, setNewTaskTitle] = useState("")
  const [newTaskType, setNewTaskType] = useState<'daily' | 'weekly'>('daily')
  const [newMilestoneTitle, setNewMilestoneTitle] = useState("")
  const [newMilestoneDate, setNewMilestoneDate] = useState("")
  const [currentGoal, setCurrentGoal] = useState<any>(null)
  const [isEditingDetails, setIsEditingDetails] = useState(false)
  const [editedDetails, setEditedDetails] = useState({
    title: '',
    description: ''
  })
  const [showConfetti, setShowConfetti] = useState(false)
  const [newTaskWeekday, setNewTaskWeekday] = useState<number | undefined>()
  const [showAllTasks, setShowAllTasks] = useState(false)
  const [showAllMilestones, setShowAllMilestones] = useState(false)

  // Fetch specific goal data
  const fetchGoalDetails = async () => {
    if (!user || !params?.id) return
    
    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('goals')
        .select(`
          *,
          tasks (*),
          milestones (*),
          reflections (*),
          resources (*)
        `)
        .eq('id', params.id)
        .single()

      if (error) throw error

      if (data) {
        setCurrentGoal(data)
        setEditedEndDate(data.end_date)
        setEditedSmartGoal(data.smart_goal)
      }
    } catch (err) {
      console.error('Error fetching goal:', err)
      toast.error('Failed to load goal')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchGoalDetails()
  }, [user, params?.id])

  useEffect(() => {
    if (currentGoal) {
      setEditedDetails({
        title: currentGoal.title,
        description: currentGoal.description
      })
    }
  }, [currentGoal])

  const handleEndDateUpdate = async () => {
    try {
      await updateGoal(currentGoal!.id, { end_date: editedEndDate })
      setIsEditingDate(false)
    } catch (error) {
      console.error('Error updating end date:', error)
      toast.error('Failed to update end date')
    }
  }

  const handleSmartGoalUpdate = async () => {
    try {
      await updateGoal(currentGoal!.id, { smart_goal: editedSmartGoal })
      setIsEditingSmart(false)
      toast.success('SMART goal updated')
    } catch (error) {
      console.error('Error updating SMART goal:', error)
      toast.error('Failed to update SMART goal')
    }
  }

  const handleAddTask = async () => {
    if (!newTaskTitle || !user) return
    
    try {
      const newTask = {
        title: newTaskTitle,
        completed: false,
        date: new Date().toISOString(),
        goal_id: currentGoal.id,
        type: newTaskType,
        weekday: newTaskType === 'weekly' ? newTaskWeekday : undefined,
        user_id: user.id
      }

      const { data, error } = await supabase
        .from('tasks')
        .insert([newTask])
        .select()
        .single()

      if (error) throw error

      await Promise.all([
        refreshGoals(),
        fetchGoalDetails()
      ])
      
      setNewTaskTitle("")
      setNewTaskType('daily')
      setNewTaskWeekday(undefined)
      toast.success('Task added successfully!')
    } catch (error) {
      console.error('Error adding task:', error)
      toast.error('Failed to add task')
    }
  }

  const handleAddMilestone = async () => {
    if (!newMilestoneTitle || !newMilestoneDate || !user) return
    
    try {
      const newMilestone = {
        title: newMilestoneTitle,
        date: newMilestoneDate,
        completed: false,
        goal_id: currentGoal.id
      }

      const { data, error } = await supabase
        .from('milestones')
        .insert([newMilestone])
        .select()
        .single()

      if (error) throw error

      await refreshGoals()
      setNewMilestoneTitle("")
      setNewMilestoneDate("")
      toast.success('Milestone added successfully!')
    } catch (error) {
      console.error('Error adding milestone:', error)
      toast.error('Failed to add milestone')
    }
  }

  const handleMilestoneToggle = async (milestoneId: string) => {
    try {
      const milestone = currentGoal?.milestones?.find(m => m.id === milestoneId);
      if (!milestone) {
        console.error('Milestone not found:', milestoneId);
        return;
      }

      // Update the milestone in Supabase
      const result = await updateGoalMilestone(milestoneId, {
        completed: !milestone.completed
      });

      if (result) {
        // Refresh both goals list and current goal data
        await Promise.all([
          refreshGoals(),
          fetchGoalDetails()
        ]);

        if (!milestone.completed) {
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 3000);
        }
      }
    } catch (error) {
      console.error('Error toggling milestone:', error);
      toast.error("Failed to update milestone");
    }
  };

  const handleDetailsUpdate = async () => {
    try {
      await updateGoal(currentGoal!.id, {
        title: editedDetails.title,
        description: editedDetails.description
      })
      setIsEditingDetails(false)
      toast.success('Goal details updated successfully')
    } catch (error) {
      console.error('Error updating goal details:', error)
      toast.error('Failed to update goal details')
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      const success = await deleteTask(taskId)
      if (success) {
        await Promise.all([
          refreshGoals(),
          fetchGoalDetails()
        ])
      }
    }
  }

  const handleDeleteMilestone = async (milestoneId: string) => {
    if (window.confirm('Are you sure you want to delete this milestone?')) {
      await deleteMilestone(milestoneId);
    }
  };

  if (isLoading || !currentGoal) {
    return <div>Loading...</div>
  }

  return (
    <div className="container mx-auto p-6">
      {showConfetti && (
        <ReactConfetti
          width={typeof window !== 'undefined' ? window.innerWidth : 0}
          height={typeof window !== 'undefined' ? window.innerHeight : 0}
          recycle={false}
          numberOfPieces={200}
          gravity={0.2}
        />
      )}

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
            {isEditingDetails ? (
              <div className="space-y-4">
                <Input
                  value={editedDetails.title}
                  onChange={(e) => setEditedDetails(prev => ({
                    ...prev,
                    title: e.target.value
                  }))}
                  placeholder="Goal title"
                />
                <Textarea
                  value={editedDetails.description}
                  onChange={(e) => setEditedDetails(prev => ({
                    ...prev,
                    description: e.target.value
                  }))}
                  placeholder="Goal description"
                />
                <div className="flex justify-end gap-2">
                  <Button onClick={handleDetailsUpdate}>Save</Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsEditingDetails(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-3xl font-bold flex items-center gap-2">
                    <Target className="h-8 w-8" />
                    {currentGoal.title}
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsEditingDetails(true)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>
                <CardDescription>{currentGoal.description}</CardDescription>
              </>
            )}
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Date Section */}
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <Calendar className="mr-2 h-4 w-4" />
                  <span className="text-sm">
                    Start: {format(new Date(currentGoal.start_date), 'MMM d, yyyy')}
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
                        End: {format(new Date(currentGoal.end_date), 'MMM d, yyyy')}
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

              {/* SMART Goal Section */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold">SMART Goal</h3>
                  {!isEditingSmart && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setIsEditingSmart(true)}
                    >
                      <Pencil className="h-3 w-3 mr-2" />
                      Edit
                    </Button>
                  )}
                </div>
                {isEditingSmart ? (
                  <div className="space-y-4">
                    <div>
                      <Badge variant="outline" className="mb-2">Specific</Badge>
                      <Input
                        value={editedSmartGoal.specific}
                        onChange={(e) => setEditedSmartGoal(prev => ({
                          ...prev,
                          specific: e.target.value
                        }))}
                      />
                    </div>
                    <div>
                      <Badge variant="outline" className="mb-2">Measurable</Badge>
                      <Input
                        value={editedSmartGoal.measurable}
                        onChange={(e) => setEditedSmartGoal(prev => ({
                          ...prev,
                          measurable: e.target.value
                        }))}
                      />
                    </div>
                    <div>
                      <Badge variant="outline" className="mb-2">Achievable</Badge>
                      <Input
                        value={editedSmartGoal.achievable}
                        onChange={(e) => setEditedSmartGoal(prev => ({
                          ...prev,
                          achievable: e.target.value
                        }))}
                      />
                    </div>
                    <div>
                      <Badge variant="outline" className="mb-2">Relevant</Badge>
                      <Input
                        value={editedSmartGoal.relevant}
                        onChange={(e) => setEditedSmartGoal(prev => ({
                          ...prev,
                          relevant: e.target.value
                        }))}
                      />
                    </div>
                    <div>
                      <Badge variant="outline" className="mb-2">Time-bound</Badge>
                      <Input
                        value={editedSmartGoal.timeBound}
                        onChange={(e) => setEditedSmartGoal(prev => ({
                          ...prev,
                          timeBound: e.target.value
                        }))}
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button onClick={handleSmartGoalUpdate}>Save</Button>
                      <Button
                        variant="outline"
                        onClick={() => setIsEditingSmart(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Badge variant="outline" className="mb-2">Specific</Badge>
                      <p className="text-sm">{currentGoal.smart_goal.specific}</p>
                    </div>
                    <div>
                      <Badge variant="outline" className="mb-2">Measurable</Badge>
                      <p className="text-sm">{currentGoal.smart_goal.measurable}</p>
                    </div>
                    <div>
                      <Badge variant="outline" className="mb-2">Achievable</Badge>
                      <p className="text-sm">{currentGoal.smart_goal.achievable}</p>
                    </div>
                    <div>
                      <Badge variant="outline" className="mb-2">Relevant</Badge>
                      <p className="text-sm">{currentGoal.smart_goal.relevant}</p>
                    </div>
                    <div>
                      <Badge variant="outline" className="mb-2">Time-bound</Badge>
                      <p className="text-sm">{currentGoal.smart_goal.timeBound}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Tasks Section */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold">Tasks</h3>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => setShowAllTasks(!showAllTasks)}
                    >
                      {showAllTasks ? 'Show Less' : `Show All (${currentGoal.tasks?.length || 0})`}
                    </Button>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline">
                          <Plus className="h-4 w-4 mr-2" />
                          Add Task
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add New Task</DialogTitle>
                          <DialogDescription>
                            Create a new task for {currentGoal.title}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <Input
                            placeholder="Task title"
                            value={newTaskTitle}
                            onChange={(e) => setNewTaskTitle(e.target.value)}
                          />
                          <Select
                            value={newTaskType}
                            onValueChange={(value: 'daily' | 'weekly') => {
                              setNewTaskType(value)
                              if (value === 'daily') setNewTaskWeekday(undefined)
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select task type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="daily">Daily</SelectItem>
                              <SelectItem value="weekly">Weekly</SelectItem>
                            </SelectContent>
                          </Select>

                          {newTaskType === 'weekly' && (
                            <Select
                              value={newTaskWeekday?.toString()}
                              onValueChange={(value) => setNewTaskWeekday(parseInt(value))}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select day of week" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="0">Sunday</SelectItem>
                                <SelectItem value="1">Monday</SelectItem>
                                <SelectItem value="2">Tuesday</SelectItem>
                                <SelectItem value="3">Wednesday</SelectItem>
                                <SelectItem value="4">Thursday</SelectItem>
                                <SelectItem value="5">Friday</SelectItem>
                                <SelectItem value="6">Saturday</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        </div>
                        <DialogFooter>
                          <Button onClick={handleAddTask}>Add Task</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
                <div className="space-y-2 mt-4">
                  {(showAllTasks 
                    ? currentGoal.tasks 
                    : currentGoal.tasks?.slice(0, 3)
                  )?.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between p-2 rounded hover:bg-muted group"
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircle2 
                          className={`h-4 w-4 ${task.completed ? 'text-green-500' : 'text-gray-300'}`}
                        />
                        <span className={task.completed ? 'line-through text-muted-foreground' : ''}>
                          {task.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge>{task.type}</Badge>
                        {task.type === 'weekly' && task.weekday !== undefined && (
                          <Badge variant="secondary">
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][task.weekday]}
                          </Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleDeleteTask(task.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Milestones Section */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold">Milestones</h3>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => setShowAllMilestones(!showAllMilestones)}
                    >
                      {showAllMilestones ? 'Show Less' : `Show All (${currentGoal.milestones?.length || 0})`}
                    </Button>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline">
                          <Plus className="h-4 w-4 mr-2" />
                          Add Milestone
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add New Milestone</DialogTitle>
                          <DialogDescription>
                            Create a new milestone for {currentGoal.title}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <Input
                            placeholder="Milestone title"
                            value={newMilestoneTitle}
                            onChange={(e) => setNewMilestoneTitle(e.target.value)}
                          />
                          <Input
                            type="date"
                            value={newMilestoneDate}
                            onChange={(e) => setNewMilestoneDate(e.target.value)}
                          />
                        </div>
                        <DialogFooter>
                          <Button onClick={handleAddMilestone}>Add Milestone</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
                <div className="space-y-2 mt-4">
                  {(showAllMilestones 
                    ? currentGoal.milestones 
                    : currentGoal.milestones?.slice(0, 3)
                  )?.map((milestone) => (
                    <div
                      key={milestone.id}
                      className="flex items-center justify-between p-2 rounded hover:bg-muted group"
                    >
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={milestone.completed}
                          onCheckedChange={() => handleMilestoneToggle(milestone.id)}
                          className="cursor-pointer"
                        />
                        <span className={milestone.completed ? 'line-through text-muted-foreground' : ''}>
                          {milestone.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(milestone.date), 'MMM d, yyyy')}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleDeleteMilestone(milestone.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Progress Card */}
        <Card>
          <CardHeader>
            <CardTitle>Goal Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Overall Progress</span>
                  <span>{calculateProgress(currentGoal)}%</span>
                </div>
                <Progress value={calculateProgress(currentGoal)} />
              </div>
              <div>
                <h4 className="text-sm font-medium mb-2">Tasks Completed</h4>
                <p className="text-2xl font-bold">
                  {currentGoal.tasks?.filter(t => t.completed).length} /{' '}
                  {currentGoal.tasks?.length}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-2">Milestones Achieved</h4>
                <p className="text-2xl font-bold">
                  {currentGoal.milestones?.filter(m => m.completed).length} /{' '}
                  {currentGoal.milestones?.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 