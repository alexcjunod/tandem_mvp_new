import { useState, useEffect, useCallback } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useUser } from "@clerk/nextjs"
import { toast } from 'sonner'
import { Goal, Task, Milestone, Reflection, Resource } from '@/types'
import { startOfDay, isAfter, parseISO } from 'date-fns'

export function useGoals() {
  const { user } = useUser()
  const [goals, setGoals] = useState<Goal[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [taskCompletions, setTaskCompletions] = useState<{[key: string]: boolean}>({})
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClientComponentClient()

  const getTaskCompletionKey = (taskId: string, date: Date = new Date()) => {
    return `${taskId}-${startOfDay(date).toISOString().split('T')[0]}`
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
      const today = startOfDay(new Date()).toISOString().split('T')[0];
      const { data: completions, error: completionsError } = await supabase
        .from('task_completions')
        .select('*')
        .eq('user_id', user.id)
        .eq('completion_date', today);

      if (completionsError) throw completionsError;

      // Create a map of task completions
      const completionMap = completions?.reduce((acc, completion) => {
        acc[getTaskCompletionKey(completion.task_id)] = completion.completed;
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
      const { data, error } = await supabase
        .from('goals')
        .insert([{ ...goalData, user_id: user.id }])
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

  const updateGoalTask = async (taskId: string, updates: Partial<Task>) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task) throw new Error('Task not found');

      if (task.type === 'daily' || task.type === 'weekly') {
        // For recurring tasks, update the completion for today
        const today = startOfDay(new Date()).toISOString().split('T')[0];
        const { error: completionError } = await supabase
          .from('task_completions')
          .upsert({
            task_id: taskId,
            completion_date: today,
            completed: Boolean(updates.completed),
            user_id: user?.id
          }, {
            onConflict: 'task_id,completion_date',
            ignoreDuplicates: false
          });

        if (completionError) throw completionError;

        // Update local state
        const completionKey = getTaskCompletionKey(taskId);
        setTaskCompletions(prev => ({
          ...prev,
          [completionKey]: Boolean(updates.completed)
        }));

        // Update tasks state to reflect the change
        setTasks(prevTasks =>
          prevTasks.map(t => {
            if (t.id === taskId && (t.type === 'daily' || t.type === 'weekly')) {
              return { ...t, completed: Boolean(updates.completed) };
            }
            return t;
          })
        );

        // Update goals state to reflect the change
        setGoals(prevGoals =>
          prevGoals.map(goal => ({
            ...goal,
            tasks: goal.tasks?.map(t => {
              if (t.id === taskId && (t.type === 'daily' || t.type === 'weekly')) {
                return { ...t, completed: Boolean(updates.completed) };
              }
              return t;
            })
          }))
        );
      } else {
        // For one-time tasks, update the task directly
        const { error } = await supabase
          .from('tasks')
          .update({ completed: Boolean(updates.completed) })
          .eq('id', taskId);

        if (error) throw error;

        // Update local state for one-time tasks
        setTasks(prevTasks =>
          prevTasks.map(t => {
            if (t.id === taskId) {
              return { ...t, completed: Boolean(updates.completed) };
            }
            return t;
          })
        );

        setGoals(prevGoals =>
          prevGoals.map(goal => ({
            ...goal,
            tasks: goal.tasks?.map(t => {
              if (t.id === taskId) {
                return { ...t, completed: Boolean(updates.completed) };
              }
              return t;
            })
          }))
        );
      }

      return true;
    } catch (err) {
      console.error('Error updating task:', err);
      toast.error('Failed to update task');
      return null;
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