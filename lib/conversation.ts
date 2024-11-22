import type { ConversationState } from "@/types/chat"

export const CONVERSATION_STATES = {
  INITIAL: "INITIAL",
  AWAITING_GOAL: "AWAITING_GOAL",
  AWAITING_WHY: "AWAITING_WHY",
  AWAITING_SPECIFIC: "AWAITING_SPECIFIC",
  AWAITING_TIMELINE: "AWAITING_TIMELINE",
  GENERATING_PLAN: "GENERATING_PLAN",
  COMPLETED: "COMPLETED"
} as const

export const MESSAGES = {
  WELCOME: `Hi there! 👋

I'm excited to help you turn your dreams into achievable goals! Let's get started.

What's a goal you've been thinking about lately?`,

  getMotivationPrompt: (goal: string) => 
    `"${goal}" is an inspiring goal! 🌟

Let's delve deeper to understand your WHY:
- Why is this goal important to you personally?
- How will achieving it make a difference in your life?

I'm all ears! 📝`,

  getSpecificPrompt: (goal: string) =>
    `Thanks for sharing! Now let's make your goal specific.

For ${goal}, what exactly would success look like?
What level would you like to reach?

The clearer we make this, the better! 🎯`,

  getTimelinePrompt: (goal: string) =>
    `Great! Now let's set a timeline.

When would you like to achieve ${goal}?
This helps us create realistic milestones and tasks. ⏰`,

  SUCCESS: `Perfect! Your SMART goal is all set! Ready to begin this exciting journey? 🚀`,

  CONFIRM_MILESTONES: `How do these milestones look? Type 'yes' to continue or suggest changes.`,
  
  CONFIRM_TASKS: `How do these tasks look? Type 'yes' to create your goal or suggest changes.`
}

export const AI_PROMPTS = {
  GET_MILESTONES: (goal: string, motivation: string) =>
    `Generate 4 clear milestones for learning ${goal}. 
Format EXACTLY like this with NO extra punctuation:

🎯 Milestones
1. First Achievement (Month 1): [specific achievement]
2. Building Momentum (Month 2): [specific achievement]
3. Major Progress (Month 3): [specific achievement]
4. Final Goal (Month 4): [specific achievement]`,

  GET_TASKS: (goal: string) =>
    `Generate daily and weekly tasks for learning ${goal}.
Format EXACTLY like this with NO extra punctuation:

📋 Tasks

Daily Tasks:
• [specific task 1]
• [specific task 2]
• [specific task 3]

Weekly Tasks:
• [specific task 1]
• [specific task 2]
• [specific task 3]`
}