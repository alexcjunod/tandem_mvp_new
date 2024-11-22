export interface Message {
  role: "user" | "assistant"
  content: string
}

export interface SmartGoal {
  specific: string
  measurable: string
  achievable: string
  relevant: string
  timeBound: string
}

export interface GoalDetails {
  title: string
  description: string
  smart_goal: SmartGoal
  reasoning: string
  start_date: string
  end_date: string
  color: string
}

export type ConversationState = 
  | "WELCOME"
  | "AWAITING_GOAL"
  | "AWAITING_WHY"
  | "AWAITING_SPECIFIC"
  | "AWAITING_MEASURABLE"
  | "AWAITING_TIMELINE"
  | "GENERATING_PLAN"
  | "COMPLETED"

export interface ChatState {
  messages: Message[]
  inputValue: string
  isAssistantTyping: boolean
  goalDetails: GoalDetails
  conversationState: ConversationState
}

export type ChatAction = 
  | { type: "ADD_MESSAGE"; message: Message }
  | { type: "SET_INPUT"; value: string }
  | { type: "SET_TYPING"; isTyping: boolean }
  | { type: "SET_STATE"; state: ConversationState }
  | { type: "UPDATE_GOAL"; details: Partial<GoalDetails> } 