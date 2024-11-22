"use client"

import { useReducer, useRef, useEffect } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useGoals } from "@/hooks/use-goals"
import { toast } from "sonner"
import { MessageList } from "@/components/chat/message-list"
import { InputArea } from "@/components/chat/input-area"
import { chatReducer, initialState } from "@/reducers/chatReducer"
import { MESSAGES, CONVERSATION_STATES, AI_PROMPTS } from "@/lib/conversation"
import type { Goal } from "@/types/goals"
import { format, addMonths } from 'date-fns'

interface AIChatProps {
  onGoalCreated?: (goal: Goal) => void
}

export default function AIChat({ onGoalCreated }: AIChatProps) {
  const { createGoal } = useGoals()
  const [state, dispatch] = useReducer(chatReducer, initialState)
  const scrollViewportRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollViewportRef.current) {
      scrollViewportRef.current.scrollTo({
        top: scrollViewportRef.current.scrollHeight,
        behavior: "smooth"
      })
    }
  }, [state.messages, state.isAssistantTyping])

  const getAIResponse = async (prompt: string) => {
    try {
      dispatch({ type: "SET_TYPING", isTyping: true })

      const response = await fetch("/api/llama", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt })
      })

      const data = await response.json()
      
      if (data.error) throw new Error(data.error)
      
      return data.output
    } catch (error) {
      console.error("Error getting AI response:", error)
      return "I apologize, but I'm having trouble responding. Could you try rephrasing that?"
    } finally {
      dispatch({ type: "SET_TYPING", isTyping: false })
    }
  }

  const handleSend = async () => {
    if (!state.inputValue.trim()) return

    // Add user message
    dispatch({ 
      type: "ADD_MESSAGE", 
      message: { role: "user", content: state.inputValue }
    })

    const userInput = state.inputValue
    dispatch({ type: "SET_INPUT", value: "" })

    switch (state.conversationState) {
      case "INITIAL":
      case "AWAITING_GOAL":
        dispatch({
          type: "UPDATE_GOAL",
          details: {
            title: userInput,
            description: `SMART goal: ${userInput}`
          }
        })

        dispatch({
          type: "ADD_MESSAGE",
          message: { 
            role: "assistant", 
            content: MESSAGES.getMotivationPrompt(userInput)
          }
        })
        
        dispatch({ type: "SET_STATE", state: "AWAITING_WHY" })
        break

      case "AWAITING_WHY":
        dispatch({
          type: "UPDATE_GOAL",
          details: {
            reasoning: userInput,
            smart_goal: {
              ...state.goalDetails.smart_goal,
              relevant: userInput
            }
          }
        })

        dispatch({
          type: "ADD_MESSAGE",
          message: { 
            role: "assistant", 
            content: MESSAGES.getSpecificPrompt(state.goalDetails.title)
          }
        })

        dispatch({ type: "SET_STATE", state: "AWAITING_SPECIFIC" })
        break

      case "AWAITING_SPECIFIC":
        dispatch({
          type: "UPDATE_GOAL",
          details: {
            smart_goal: {
              ...state.goalDetails.smart_goal,
              specific: userInput
            }
          }
        })

        dispatch({
          type: "ADD_MESSAGE",
          message: { 
            role: "assistant", 
            content: MESSAGES.getTimelinePrompt(state.goalDetails.title)
          }
        })

        dispatch({ type: "SET_STATE", state: "AWAITING_TIMELINE" })
        break

      case "AWAITING_TIMELINE":
        let targetDate = new Date()
        const input = userInput.toLowerCase()
        
        // Try to parse specific date formats
        if (input.includes('next year')) {
          targetDate.setFullYear(targetDate.getFullYear() + 1)
        } else if (input.includes('month')) {
          const months = parseInt(input) || 3
          targetDate.setMonth(targetDate.getMonth() + months)
        } else {
          // Try to parse specific date
          const dateMatch = input.match(/(\d{1,2})(?:st|nd|rd|th)?\s+(?:of\s+)?([a-zA-Z]+)(?:\s+(\d{4}|\d{2}))?/)
          if (dateMatch) {
            const [_, day, month, year] = dateMatch
            const parsedDate = new Date(`${month} ${day} ${year || targetDate.getFullYear()}`)
            if (!isNaN(parsedDate.getTime())) {
              targetDate = parsedDate
            }
          }
        }

        const formattedDate = format(targetDate, 'yyyy-MM-dd')

        dispatch({ type: "SET_STATE", state: "GENERATING_PLAN" })
        dispatch({ type: "SET_TYPING", isTyping: true })

        try {
          // First, get and show milestones
          const milestonesResponse = await getAIResponse(
            AI_PROMPTS.GET_MILESTONES(state.goalDetails.title, state.goalDetails.reasoning)
          )

          dispatch({
            type: "ADD_MESSAGE",
            message: { 
              role: "assistant", 
              content: `${milestonesResponse}\n\n${MESSAGES.CONFIRM_MILESTONES}`
            }
          })

          // Store milestones in goal details
          dispatch({
            type: "UPDATE_GOAL",
            details: {
              smart_goal: {
                ...state.goalDetails.smart_goal,
                achievable: milestonesResponse
              }
            }
          })
        } catch (error) {
          console.error('Error generating milestones:', error)
          toast.error("Failed to generate milestones")
        }
        break

      case "GENERATING_PLAN":
        if (userInput.toLowerCase() === 'yes') {
          dispatch({ type: "SET_TYPING", isTyping: true })
          
          try {
            // Now get and show tasks
            const tasksResponse = await getAIResponse(
              AI_PROMPTS.GET_TASKS(state.goalDetails.title)
            )

            dispatch({
              type: "ADD_MESSAGE",
              message: { 
                role: "assistant", 
                content: `${tasksResponse}\n\n${MESSAGES.CONFIRM_TASKS}`
              }
            })

            // Store tasks in goal details
            dispatch({
              type: "UPDATE_GOAL",
              details: {
                smart_goal: {
                  ...state.goalDetails.smart_goal,
                  measurable: tasksResponse
                }
              }
            })

            dispatch({ type: "SET_STATE", state: "CONFIRMING_PLAN" })
          } catch (error) {
            console.error('Error generating tasks:', error)
            toast.error("Failed to generate tasks")
          }
        } else {
          // Handle milestone changes
          dispatch({
            type: "ADD_MESSAGE",
            message: { 
              role: "assistant", 
              content: "What would you like to change about the milestones?"
            }
          })
        }
        break

      case "CONFIRMING_PLAN":
        if (userInput.toLowerCase() === 'yes') {
          try {
            const goal = await createGoal(state.goalDetails)
            if (goal) {
              dispatch({
                type: "ADD_MESSAGE",
                message: { 
                  role: "assistant", 
                  content: MESSAGES.SUCCESS
                }
              })
              toast.success("Goal created successfully!")
              onGoalCreated?.(goal)
            }
          } catch (error) {
            console.error('Error creating goal:', error)
            toast.error("Failed to create goal")
          }
          dispatch({ type: "SET_STATE", state: "COMPLETED" })
        } else {
          // Handle task changes
          dispatch({
            type: "ADD_MESSAGE",
            message: { 
              role: "assistant", 
              content: "What would you like to change about the tasks?"
            }
          })
        }
        break
    }
  }

  return (
    <div className="flex flex-col h-[600px]">
      <ScrollArea className="flex-1" ref={scrollViewportRef}>
        <MessageList 
          messages={state.messages}
          isAssistantTyping={state.isAssistantTyping}
        />
      </ScrollArea>
      <InputArea
        value={state.inputValue}
        onChange={(value) => dispatch({ type: "SET_INPUT", value })}
        onSend={handleSend}
        isTyping={state.isAssistantTyping}
      />
    </div>
  )
}
