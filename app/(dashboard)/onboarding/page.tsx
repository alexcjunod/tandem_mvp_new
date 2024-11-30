"use client"

import { useGoals } from "@/hooks/use-goals"
import OnboardingFlow from "@/onboarding-flow"

export default function OnboardingPage() {
  const { isLoading } = useGoals()

  if (isLoading) {
    return <div>Loading...</div>
  }

  return <OnboardingFlow />
}