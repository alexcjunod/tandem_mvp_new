export const INITIAL_MESSAGE = `Hi there! 👋 Let's create your goal together. What would you like to achieve?`

export const PROMPTS = {
  GOAL_SETTING: (goal: string) => 
    `You are a friendly and motivational AI coach helping a user set a SMART goal. The user wants to: "${goal}"
    
Reply to understand their motivation. Ask about:
- Why this goal matters to them personally
- What inspired them to choose it
- How achieving it would impact their life

Keep it conversational and encouraging, using 1-2 emojis maximum.`,

  TIMELINE_SETTING: (goal: string, motivation: string) => 
    `The user wants to ${goal} because: "${motivation}"
    
Ask them about their timeline in a supportive way. Suggest some realistic timeframes based on their goal.
Keep it brief and friendly, using 1-2 emojis.`,

  GOAL_SUMMARY: (details: any) =>
    `Summarize the SMART goal:
Title: ${details.title}
Why: ${details.reasoning}
Timeline: ${details.end_date}

Provide an encouraging message about starting their journey.
Use 1-2 emojis to keep it friendly.`
} 