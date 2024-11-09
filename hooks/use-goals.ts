import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { goalsService, Goal, Task } from '@/lib/services/goals'

export function useGoals() {
  const { user } = useUser()
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (user?.id) {
      loadGoals()
    }
  }, [user?.id])

  async function loadGoals() {
    try {
      setLoading(true)
      const data = await goalsService.getGoals(user!.id)
      setGoals(data)
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }

  async function createGoal(goal: Partial<Goal>) {
    try {
      const newGoal = await goalsService.createGoal(user!.id, goal)
      setGoals([...goals, newGoal])
      return newGoal
    } catch (err) {
      setError(err as Error)
      throw err
    }
  }

  async function updateGoal(goalId: string, updates: Partial<Goal>) {
    try {
      const updatedGoal = await goalsService.updateGoal(goalId, updates)
      setGoals(goals.map(g => g.id === goalId ? updatedGoal : g))
      return updatedGoal
    } catch (err) {
      setError(err as Error)
      throw err
    }
  }

  return {
    goals,
    loading,
    error,
    createGoal,
    updateGoal,
    refresh: loadGoals,
  }
} 