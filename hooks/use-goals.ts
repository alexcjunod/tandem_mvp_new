import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useUser } from "@clerk/nextjs"
import { toast } from 'sonner'
import { Goal, Task, Milestone, Reflection, Resource } from '@/types'
import { startOfDay, isAfter, parseISO, format } from 'date-fns'
import { debounce } from 'lodash'

const getRandomColor = () => {
  // Array of pleasant, accessible colors (avoiding black)
  const colors = [
    'hsl(10, 80%, 60%)',    // Coral Red
    'hsl(200, 70%, 50%)',   // Blue
    'hsl(150, 60%, 40%)',   // Green
    'hsl(280, 60%, 60%)',   // Purple
    'hsl(40, 90%, 50%)',    // Orange
    'hsl(170, 70%, 45%)',   // Teal
    'hsl(320, 70%, 55%)',   // Pink
    'hsl(60, 80%, 45%)',    // Yellow
    'hsl(230, 60%, 50%)',   // Indigo
    'hsl(100, 65%, 45%)',   // Lime
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

export function useGoals() {
  const { user } = useUser()
  const [goals, setGoals] = useState<Goal[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [taskCompletions, setTaskCompletions] = useState<{[key: string]: boolean}>({})
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClientComponentClient()

  const getTaskCompletionKey = (taskId: string, date: Date = new Date()) => {
    return `${taskId}-${format(date, 'yyyy-MM-dd')}`
  }

  useEffect(() => {
    console.log('useGoals hook initialized with user:', user);
    if (user) {
      refreshGoals();
    }
  }, [user]);

  const refreshGoals = useCallback(async () => {
    if (!user) return;

    try {
      console.log('Fetching goals for user:', user.id);
      setIsLoading(true);
      
      // Fetch goals with all related data
      const { data: goalsData, error: goalsError } = await supabase
        .from('goals')
        .select(`
          *,
          tasks (*),
          milestones (*),
          reflections (*),
          resources (*)
        `)
        .eq('user_id', user.id);

      if (goalsError) throw goalsError;

      // Fetch all tasks for the user
      const { data: allTasks, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id);

      if (tasksError) throw tasksError;

      // Fetch task completions for today
      const today = format(new Date(), 'yyyy-MM-dd');
      const { data: completions, error: completionsError } = await supabase
        .from('task_completions')
        .select('*')
        .eq('user_id', user.id)
        .eq('completion_date', today);

      if (completionsError) throw completionsError;

      // Create a map of task completions
      const completionMap = completions?.reduce((acc, completion) => {
        const key = getTaskCompletionKey(completion.task_id);
        acc[key] = completion.completed;
        return acc;
      }, {} as {[key: string]: boolean});

      // Update tasks with completion status
      const tasksWithCompletions = allTasks.map(task => {
        const completionKey = getTaskCompletionKey(task.id);
        if (task.type === 'daily' || task.type === 'weekly') {
          return {
            ...task,
            completed: completionMap[completionKey] || false
          };
        }
        return task;
      });

      // Combine goals with their associated tasks
      const goalsWithTasks = goalsData.map(goal => ({
        ...goal,
        tasks: tasksWithCompletions.filter(task => task.goal_id === goal.id)
      }));

      setGoals(goalsWithTasks);
      setTasks(tasksWithCompletions);
      setTaskCompletions(completionMap);
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching goals and tasks:', error);
      toast.error('Failed to load goals and tasks');
      setIsLoading(false);
    }
  }, [user, supabase]);

  const createGoal = async (goalData: Partial<Goal>) => {
    if (!user) return null
    
    try {
      // Assign a random color if one isn't provided
      const goalWithColor = {
        ...goalData,
        color: goalData.color || getRandomColor(),
        user_id: user.id
      };

      const { data, error } = await supabase
        .from('goals')
        .insert([goalWithColor])
        .select()
        .single()

      if (error) throw error

      setGoals(prev => [...prev, data])
      toast.success('Goal created successfully')
      return data
    } catch (err) {
      console.error('Error creating goal:', err)
      toast.error('Failed to create goal')
      return null
    }
  }

  const updateGoal = async (goalId: string, updates: Partial<Goal>) => {
    try {
      const { data, error } = await supabase
        .from('goals')
        .update(updates)
        .eq('id', goalId)
        .select()
        .single()

      if (error) throw error

      setGoals(prev => prev.map(goal => 
        goal.id === goalId ? { ...goal, ...data } : goal
      ))
      toast.success('Goal updated successfully')
      return data
    } catch (err) {
      console.error('Error updating goal:', err)
      toast.error('Failed to update goal')
      return null
    }
  }

  const deleteGoal = async (goalId: string) => {
    try {
      const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', goalId)

      if (error) throw error

      setGoals(prev => prev.filter(goal => goal.id !== goalId))
      toast.success('Goal deleted successfully')
      return true
    } catch (err) {
      console.error('Error deleting goal:', err)
      toast.error('Failed to delete goal')
      return false
    }
  }

  const updateDailyStats = async (goalId: string) => {
    if (!user) return;

    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;

    const today = startOfDay(new Date()).toISOString().split('T')[0];
    const dayOfWeek = new Date().getDay();

    // Get all tasks for this goal
    const goalTasks = goal.tasks || [];
    
    // Get daily tasks
    const dailyTasks = goalTasks.filter(t => t.type === 'daily');
    const completedDailyTasks = dailyTasks.filter(t => t.completed);

    // Get weekly tasks for today
    const weeklyTasks = goalTasks.filter(t => 
      t.type === 'weekly' && t.weekday === dayOfWeek
    );
    const completedWeeklyTasks = weeklyTasks.filter(t => t.completed);

    try {
      await supabase
        .from('daily_task_stats')
        .upsert({
          user_id: user.id,
          goal_id: goalId,
          date: today,
          daily_tasks_completed: completedDailyTasks.length,
          daily_tasks_total: dailyTasks.length,
          weekly_tasks_completed: completedWeeklyTasks.length,
          weekly_tasks_total: weeklyTasks.length
        }, {
          onConflict: 'user_id,goal_id,date'
        });
    } catch (error) {
      console.error('Error updating daily stats:', error);
    }
  };

  const updateGoalTask = async (taskId: string, updates: Partial<Task>) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task) throw new Error('Task not found');

      // Optimistically update all local state at once
      const updatedTask = { ...task, ...updates };
      
      // Update tasks state
      const newTasks = tasks.map(t => t.id === taskId ? updatedTask : t);
      setTasks(newTasks);

      // Update goals state without triggering a re-render for each update
      const newGoals = goals.map(goal => ({
        ...goal,
        tasks: goal.tasks?.map(t => t.id === taskId ? updatedTask : t)
      }));
      setGoals(newGoals);

      // Update completions state
      const completionKey = getTaskCompletionKey(taskId);
      const newCompletions = {
        ...taskCompletions,
        [completionKey]: Boolean(updates.completed)
      };
      setTaskCompletions(newCompletions);

      // Handle backend updates silently
      if (task.type === 'daily' || task.type === 'weekly') {
        const now = new Date();
        const localDate = format(now, 'yyyy-MM-dd');
        
        // Use a single Promise.all for all backend operations
        await Promise.all([
          supabase
            .from('task_completions')
            .upsert({
              task_id: taskId,
              completion_date: localDate,
              completed: Boolean(updates.completed),
              user_id: user?.id
            }, {
              onConflict: 'task_id,completion_date',
              ignoreDuplicates: false
            })
            .then(null, error => {
              console.error('Task completion update failed:', error);
              return null;
            }),
          task.goal_id 
            ? updateDailyStats(task.goal_id).catch(error => {
                console.error('Daily stats update failed:', error);
                return null;
              })
            : Promise.resolve()
        ]);
      } else {
        // Handle one-time tasks
        await supabase
          .from('tasks')
          .update({ completed: Boolean(updates.completed) })
          .eq('id', taskId)
          .then(null, error => {
            console.error('Task update failed:', error);
            return null;
          });
      }

      return true;
    } catch (err) {
      console.error('Error updating task:', err);
      toast.error('Failed to update task');
      return false;
    }
  };

  const updateGoalMilestone = async (milestoneId: string, updates: Partial<Milestone>) => {
    try {
      console.log('Updating milestone:', { milestoneId, updates });

      // First update the milestone
      const { data: milestoneData, error: milestoneError } = await supabase
        .from('milestones')
        .update({ 
          completed: Boolean(updates.completed),
        })
        .eq('id', milestoneId)
        .select('*')
        .single();

      if (milestoneError) throw milestoneError;

      // Find the goal this milestone belongs to
      const goal = goals.find(g => 
        g.milestones?.some(m => m.id === milestoneId)
      );

      if (goal) {
        // Calculate new progress
        const updatedMilestones = goal.milestones?.map(m =>
          m.id === milestoneId ? { ...m, completed: Boolean(updates.completed) } : m
        );
        
        const completedMilestones = updatedMilestones?.filter(m => m.completed).length || 0;
        const totalMilestones = updatedMilestones?.length || 0;
        const newProgress = totalMilestones > 0 
          ? Math.round((completedMilestones / totalMilestones) * 100)
          : 0;

        // Update the goal's progress
        const { error: goalError } = await supabase
          .from('goals')
          .update({ progress: newProgress })
          .eq('id', goal.id);

        if (goalError) throw goalError;

        // Update local state
        setGoals(prevGoals => 
          prevGoals.map(g => {
            if (g.id === goal.id) {
              return {
                ...g,
                progress: newProgress,
                milestones: updatedMilestones
              };
            }
            return g;
          })
        );
      }

      return milestoneData;
    } catch (err) {
      console.error('Error updating milestone:', err);
      toast.error('Failed to update milestone');
      return null;
    }
  };

  const addReflection = async (reflection: Omit<Reflection, 'id'>) => {
    try {
      console.log('Adding reflection:', reflection);

      const { data, error } = await supabase
        .from('reflections')
        .insert([reflection])
        .select('*')
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Reflection added:', data);
      await refreshGoals(); // Refresh goals to get updated reflections
      return data;
    } catch (err) {
      console.error('Error adding reflection:', err);
      toast.error('Failed to add reflection');
      return null;
    }
  };

  const addResource = async (resource: Omit<Resource, 'id'>) => {
    try {
      const { data, error } = await supabase
        .from('resources')
        .insert([resource])
        .select()
        .single();

      if (error) throw error;

      console.log('Resource added:', data);
      await refreshGoals(); // Refresh goals to get updated resources
      return data;
    } catch (err) {
      console.error('Error adding resource:', err);
      toast.error('Failed to add resource');
      return null;
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;

      // Update local state
      setGoals(prevGoals => 
        prevGoals.map(goal => ({
          ...goal,
          tasks: goal.tasks?.filter(task => task.id !== taskId)
        }))
      );

      toast.success('Task deleted successfully');
      return true;
    } catch (err) {
      console.error('Error deleting task:', err);
      toast.error('Failed to delete task');
      return false;
    }
  };

  const deleteMilestone = async (milestoneId: string) => {
    try {
      const { error } = await supabase
        .from('milestones')
        .delete()
        .eq('id', milestoneId);

      if (error) throw error;

      // Update local state and recalculate progress
      setGoals(prevGoals => 
        prevGoals.map(goal => {
          const updatedMilestones = goal.milestones?.filter(
            milestone => milestone.id !== milestoneId
          );
          
          // Recalculate progress
          const completedMilestones = updatedMilestones?.filter(m => m.completed).length || 0;
          const totalMilestones = updatedMilestones?.length || 0;
          const newProgress = totalMilestones > 0 
            ? Math.round((completedMilestones / totalMilestones) * 100)
            : 0;

          return {
            ...goal,
            milestones: updatedMilestones,
            progress: newProgress
          };
        })
      );

      toast.success('Milestone deleted successfully');
      return true;
    } catch (err) {
      console.error('Error deleting milestone:', err);
      toast.error('Failed to delete milestone');
      return false;
    }
  };

  return {
    goals,
    tasks,
    isLoading,
    refreshGoals,
    createGoal,
    updateGoal,
    deleteGoal,
    updateGoalTask,
    updateGoalMilestone,
    addReflection,
    addResource,
    deleteTask,
    deleteMilestone
  }
}