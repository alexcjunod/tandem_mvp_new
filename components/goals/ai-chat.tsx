"use client"

import * as React from "react"
import { useState, useEffect, useRef } from "react"
import { Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"

interface AIChatProps {
  customGoalStep: number
  setCustomGoalStep: (step: number) => void
  onGoalCreated?: (goal: any) => void
}

interface GoalStructure {
  goal: string
  why: string
  targetDate: string
  milestones: {
    title: string
    date: string
    tasks: string[]
  }[]
  recurringTasks: {
    daily: string[]
    weekly: string[]
  }
}

export default function AIChat({ customGoalStep, setCustomGoalStep, onGoalCreated }: AIChatProps) {
  const [messages, setMessages] = useState([
    { 
      role: "assistant", 
      content: `Hi there! 👋 

I'm here to help you create a meaningful and achievable goal. Let's make it specific, measurable, and break it down into actionable steps.

What's one goal you'd like to work towards?` 
    }
  ])
  
  const [userResponses, setUserResponses] = useState<GoalStructure>({
    goal: '',
    why: '',
    targetDate: '',
    milestones: [],
    recurringTasks: {
      daily: [],
      weekly: []
    }
  })
  
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const scrollViewportRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollViewportRef.current) {
      scrollViewportRef.current.scrollTo({
        top: scrollViewportRef.current.scrollHeight,
        behavior: "smooth"
      })
    }
  }, [messages])

  function capitalizeFirstLetter(string: string) {
    return string.charAt(0).toUpperCase() + string.slice(1)
  }

  const mockResponses = {
    initial: (userInput: string) => {
      const goal = capitalizeFirstLetter(userInput.trim())
      return `"${goal}" is a fantastic goal! 🌟 

Understanding your motivation is crucial for staying committed. Tell me:

• Why is this goal important to you personally?
• What inspired you to choose it?
• How will achieving it impact your life?`
    },

    motivation: (userInput: string, previousInputs: GoalStructure) => `Your motivation is inspiring! Now let's set a target date for ${previousInputs.goal}.

${suggestTimeframe(previousInputs.goal)}

When would you like to achieve this goal? Pick a specific date that feels both ambitious and realistic.`,

    timeline: (userInput: string, previousInputs: GoalStructure) => {
      const milestones = suggestMilestones(previousInputs.goal)
      return `Great! Let's break down your journey into major milestones. These will be your key checkpoints along the way.

Here's a suggested progression:
${milestones}

Would these milestones work for you? Feel free to modify them or suggest your own. Include rough dates for each milestone.`
    },

    tasks: (userInput: string, previousInputs: GoalStructure) => `Now for the most important part - let's create your action plan!

What specific tasks would you need to do:

Daily (e.g., practice for 30 minutes):
${suggestDailyTasks(previousInputs.goal)}

Weekly (e.g., review progress, longer sessions):
${suggestWeeklyTasks(previousInputs.goal)}

List the tasks you'll commit to, separating daily and weekly tasks.`,

    summary: (userInput: string, previousInputs: GoalStructure) => `Perfect! Here's your complete SMART goal plan:

🎯 Goal: ${previousInputs.goal}

💫 Why It Matters:
${previousInputs.why}

📅 Target Date: ${previousInputs.targetDate}

🏆 Major Milestones:
${formatMilestones(previousInputs.milestones)}

📋 Action Plan:
Daily Tasks:
${formatTasks(previousInputs.recurringTasks.daily)}

Weekly Tasks:
${formatTasks(previousInputs.recurringTasks.weekly)}

This plan is:
• Specific: Clear goal with defined milestones
• Measurable: Through daily/weekly task completion
• Achievable: Broken down into manageable steps
• Relevant: Aligned with your personal motivation
• Time-bound: With specific dates and deadlines

Would you like to adjust anything before we add this to your dashboard?`
  }

  // Helper function to get the current response based on step
  const getCurrentResponse = (step: number) => {
    const steps = {
      1: 'initial',
      2: 'motivation',
      3: 'timeline',
      4: 'tasks',
      5: 'summary'
    } as const

    return mockResponses[steps[step as keyof typeof steps]]
  }

  function suggestTimeframe(goal: string): string {
    const goalLower = goal.toLowerCase()
    if (goalLower.includes('marathon')) {
      return `For a marathon:
• 16-20 weeks if you're already running regularly
• 24-30 weeks if you're starting from scratch
• Consider targeting a specific marathon event`
    }
    // Add more goal-specific suggestions
    return `Consider:
• Short term: 3-6 months
• Medium term: 6-12 months
• Long term: 1-2 years`
  }

  function suggestMilestones(goal: string): string {
    const goalLower = goal.toLowerCase()
    if (goalLower.includes('marathon')) {
      return `1. Run 5K continuously (Month 1)
2. Complete 10K race (Month 2)
3. Run Half Marathon (Month 4)
4. Complete 30K training run (Month 5)
5. Marathon Success! (Final Month)`
    }
    // Add more goal-specific suggestions
    return `Structure your milestones like:
1. First major achievement (20% of the way)
2. Quarter way point
3. Halfway milestone
4. Three-quarter mark
5. Final goal achievement`
  }

  function suggestDailyTasks(goal: string): string {
    const goalLower = goal.toLowerCase()
    if (goalLower.includes('marathon')) {
      return `• Complete scheduled training run
• Do stretching routine
• Log workout details
• Track nutrition/hydration`
    }
    // Add more goal-specific suggestions
    return `Examples:
• Practice/training session
• Progress tracking
• Preparation tasks`
  }

  function suggestWeeklyTasks(goal: string): string {
    const goalLower = goal.toLowerCase()
    if (goalLower.includes('marathon')) {
      return `• Long training run
• Review weekly mileage
• Plan next week's routes
• Equipment check`
    }
    // Add more goal-specific suggestions
    return `Examples:
• Progress review
• Planning session
• Longer practice/training
• Maintenance tasks`
  }

  function formatMilestones(milestones: { title: string; date: string; tasks: string[] }[]): string {
    return milestones
      .map((milestone, index) => `${index + 1}. ${milestone.title} (${milestone.date}): ${milestone.tasks.join(', ')}`)
      .join('\n')
  }

  function formatTasks(tasks: string[]): string {
    return tasks
      .map((task, index) => `${index + 1}. ${task}`)
      .join('\n')
  }

  function parseTaskInput(content: string): [string[], string[]] {
    const lines = content.split('\n').map(line => line.trim()).filter(Boolean)
    const daily: string[] = []
    const weekly: string[] = []
    
    let isDaily = true // Default to daily tasks
    
    lines.forEach(line => {
      if (line.toLowerCase().includes('daily:')) {
        isDaily = true
        return
      }
      if (line.toLowerCase().includes('weekly:')) {
        isDaily = false
        return
      }
      
      // Remove bullet points and clean up the task
      const task = line.replace(/^[•-]\s*/, '').trim()
      if (task) {
        if (isDaily) {
          daily.push(task)
        } else {
          weekly.push(task)
        }
      }
    })
    
    return [daily, weekly]
  }

  async function sendMessage(content: string) {
    try {
      setIsLoading(true)
      setMessages(prev => [...prev, { role: "user", content }])
      setInput("")

      const updatedResponses = { ...userResponses }
      switch (customGoalStep) {
        case 1:
          updatedResponses.goal = content
          break
        case 2:
          updatedResponses.why = content
          break
        case 3:
          updatedResponses.targetDate = content
          break
        case 4:
          // Parse tasks into daily and weekly
          const [daily, weekly] = parseTaskInput(content)
          updatedResponses.recurringTasks.daily = daily
          updatedResponses.recurringTasks.weekly = weekly
          break
      }
      setUserResponses(updatedResponses)

      const responseFunction = getCurrentResponse(customGoalStep)
      const mockResponse = responseFunction(content, updatedResponses)
      
      setTimeout(() => {
        setMessages(prev => [...prev, { role: "assistant", content: mockResponse }])
        setCustomGoalStep(customGoalStep + 1)
        
        if (customGoalStep === 5) {
          onGoalCreated?.(updatedResponses)
        }
      }, 1500)

    } catch (error) {
      console.error("Error:", error)
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: "I apologize, but I'm having trouble processing that. Could you try rephrasing it?" 
      }])
    } finally {
      setIsLoading(false)
    }
  }

  function calculateMilestoneDate(targetDate: string, index: number, totalMilestones: number): string {
    const endDate = new Date(targetDate)
    const totalDays = Math.floor((endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    const daysPerMilestone = totalDays / totalMilestones
    const milestoneDate = new Date()
    milestoneDate.setDate(milestoneDate.getDate() + Math.floor(daysPerMilestone * (index + 1)))
    return milestoneDate.toISOString().split('T')[0]
  }

  return (
    <div className="flex flex-col h-[600px]">
      <ScrollArea className="flex-1" ref={scrollViewportRef}>
        <div className="space-y-4 p-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${
                message.role === "assistant" ? "justify-start" : "justify-end"
              }`}
            >
              <Card
                className={`max-w-[80%] ${
                  message.role === "assistant" ? "" : "bg-primary text-primary-foreground"
                }`}
              >
                <CardContent className="p-3">
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                </CardContent>
              </Card>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <Card className="max-w-[80%]">
                <CardContent className="p-3">
                  <p className="text-sm">typing...</p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-4 border-t bg-background">
        <div className="flex gap-2">
          <Textarea
            placeholder="Type your response..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                if (input.trim()) sendMessage(input.trim())
              }
            }}
            className="min-h-[44px] flex-1 resize-none"
            rows={1}
            disabled={isLoading}
          />
          <Button 
            size="icon" 
            onClick={() => input.trim() && sendMessage(input.trim())}
            disabled={isLoading}
          >
            <Send className="h-4 w-4" />
            <span className="sr-only">Send</span>
          </Button>
        </div>
      </div>
    </div>
  )
} 