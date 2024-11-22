import type { ChatState, ChatAction } from "@/types/chat"
import { MESSAGES, CONVERSATION_STATES } from "@/lib/conversation"

export const initialState: ChatState = {
  messages: [
    { 
      role: "assistant", 
      content: MESSAGES.WELCOME
    }
  ],
  inputValue: "",
  isAssistantTyping: false,
  goalDetails: {
    title: "",
    description: "",
    smart_goal: {
      specific: "",
      measurable: "",
      achievable: "",
      relevant: "",
      timeBound: ""
    },
    reasoning: "",
    start_date: new Date().toISOString().split('T')[0],
    end_date: "",
    color: `hsl(${Math.random() * 360}, 70%, 50%)`
  },
  conversationState: "INITIAL"
}

export function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case "ADD_MESSAGE":
      return {
        ...state,
        messages: [...state.messages, action.message]
      }
    
    case "SET_INPUT":
      return {
        ...state,
        inputValue: action.value
      }
    
    case "SET_TYPING":
      return {
        ...state,
        isAssistantTyping: action.isTyping
      }
    
    case "SET_STATE":
      return {
        ...state,
        conversationState: action.state
      }
    
    case "UPDATE_GOAL":
      return {
        ...state,
        goalDetails: {
          ...state.goalDetails,
          ...action.details
        }
      }
    
    default:
      return state
  }
} 