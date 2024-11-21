import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useUser } from "@clerk/nextjs"
import { toast } from 'sonner'
import { Goal, Task, Milestone, Reflection, Resource } from '@/types'

export function useGoals() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { user } = useUser()
  const supabase = createClientComponentClient()

  useEffect(() => {
    if (user) {
      fetchGoals()
    }
  }, [user])

  const fetchGoals = async () => {
    if (!user) return
    
    try {
      setIsLoading(true)
      console.log('Fetching goals for user:', user.id)
      
      const { data, error } = await supabase
        .from('goals')
        .select(`
          *,
          tasks (*),
          milestones (*),
          reflections (*),
          resources (*)
        `)
        .eq('user_id', user.id)

      console.log('Supabase response:', { data, error })

      if (error) throw error

      if (data) {
        setGoals(data)
        return data
      }
    } catch (err) {
      console.error('Error fetching goals:', err)
      toast.error('Failed to load goals')
      return null
    } finally {
      setIsLoading(false)
    }
  }

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
      console.log('Updating task:', { taskId, updates });

      const { data, error } = await supabase
        .from('tasks')
        .update({ 
          completed: updates.completed,
        })
        .eq('id', taskId)
        .select('*')
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Task update response:', data);

      setGoals(prevGoals => 
        prevGoals.map(goal => ({
          ...goal,
          tasks: goal.tasks?.map(task => 
            task.id === taskId ? { ...task, ...updates } : task
          )
        }))
      );

      return data;
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
          completed: updates.completed,
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
          m.id === milestoneId ? { ...m, completed: updates.completed } : m
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
      await fetchGoals(); // Refresh goals to get updated reflections
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
      await fetchGoals(); // Refresh goals to get updated resources
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
    isLoading,
    createGoal,
    updateGoal,
    deleteGoal,
    refreshGoals: fetchGoals,
    updateGoalTask,
    updateGoalMilestone,
    addReflection,
    addResource,
    deleteTask,
    deleteMilestone
  }
}