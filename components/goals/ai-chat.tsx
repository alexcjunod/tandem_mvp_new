"use client"

import { useState, useRef, useEffect } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useGoals } from "@/hooks/use-goals"
import { MessageList } from "@/components/chat/message-list"
import { InputArea } from "@/components/chat/input-area"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Loader2, Sparkles } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Goal } from "@/types/goals"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useUser } from "@clerk/nextjs"
import { debounce } from "lodash"

interface Message {
  role: "assistant" | "user"
  content: string
  includeCalendar?: boolean
  plan?: any
}

interface AIGoalProps {
  onGoalCreated: (goal: Goal) => void
  goalType?: "marathon" | "quit-smoking" | "default"
}

// Define the chat steps
type ChatStep = 
  | "GOAL_TITLE"
  | "GOAL_WHY"
  | "GOAL_SPECIFIC"
  | "GOAL_TIMELINE"
  | "CONFIRM_PLAN"
  | "COMPLETED"

interface GoalDetails {
  title: string
  reasoning: string
  specific: string
  targetDate: Date | undefined
}

interface AIResponse {
  smartGoal: {
    specific: string;
    measurable: string;
    achievable: string;
    relevant: string;
    timeBound: string;
  };
  milestones: Array<{
    title: string;
    date: string;
    description: string;
  }>;
  tasks: Array<{
    title: string;
    type: 'daily' | 'weekly';
    weekday?: number;
    description: string;
  }>;
}

const TEST_GOAL_PLAN = {
  smartGoal: {
    specific: "Learn to play the recorder to perform a whole song by 2025-04-02",
    measurable: "Track progress by number of correct notes played, songs learned, and practice time",
    achievable: "Break down the goal into smaller, manageable tasks and practice consistently",
    relevant: "Connects to the user's motivation of being cool and enjoying the process of learning",
    timeBound: "Target date is specific and realistic, with a timeline of 2 years"
  },
  milestones: [
    {
      title: "Learn basic finger placement and breathing techniques",
      date: "2024-02-01"
    },
    {
      title: "Learn to play simple songs with a single melody line",
      date: "2024-06-01"
    },
    {
      title: "Learn to play complex songs with multiple parts",
      date: "2024-10-01"
    },
    {
      title: "Perform a whole song without mistakes",
      date: "2025-04-02"
    }
  ],
  tasks: [
    {
      title: "Practice finger placement and breathing exercises",
      type: "daily" as const,
      date: new Date().toISOString()
    },
    {
      title: "Practice playing simple songs",
      type: "daily" as const,
      date: new Date().toISOString()
    },
    {
      title: "Review and practice complex songs",
      type: "weekly" as const,
      weekday: 0,
      date: new Date().toISOString()
    },
    {
      title: "Practice sight-reading",
      type: "weekly" as const,
      weekday: 1,
      date: new Date().toISOString()
    }
  ]
};

const TypingAnimation = () => {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex justify-start">
      <div className="rounded-lg px-6 py-4 bg-secondary space-y-3">
        <div className="flex items-center gap-2 text-primary">
          <Sparkles className="h-5 w-5" />
          <span className="font-medium">AI Assistant is thinking</span>
          <span>{dots}</span>
        </div>
        <p className="text-sm text-muted-foreground">
          Our advanced AI is crafting a personalized SMART goal plan, breaking down your aspirations 
          into achievable milestones and actionable tasks.
        </p>
        <div className="flex justify-center">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
        </div>
      </div>
    </div>
  );
};

// Update the initial message when goal type is "quit-smoking"
const getInitialMessage = (goalType: string) => {
  switch(goalType) {
    case "marathon":
      return {
        role: "assistant",
        content: `Let's plan your marathon journey! 🏃‍♂️

💡 Based on Runner's World training plans, we recommend:
• At least 16 weeks of training
• Racing in cooler months (Spring/Fall)
• Targeting a weekend race day

When would you like to achieve this goal?`
      };
    case "quit-smoking":
      return {
        role: "assistant",
        content: `Let's create your personalized smoking cessation plan! 🌟

💡 Based on WHO and medical experts' recommendations:
• A 12-week structured program has the highest success rate
• Gradual reduction is more successful than cold turkey
• Combined approach (behavioral support + NRT) doubles success
• Regular tracking and support improve long-term success

When would you like to start your quit journey?`
      };
    default:
      return {
        role: "assistant",
        content: "Hi there! 👋\n\nI'm excited to help you turn your dreams into achievable goals! Let's get started.\n\nWhat's a goal you've been thinking about lately?"
      };
  }
};

export default function AIChat({ onGoalCreated, goalType = "default" }: AIGoalProps) {
  const { createGoal } = useGoals()
  const { user } = useUser()
  const supabase = createClientComponentClient()
  const [step, setStep] = useState<ChatStep>("GOAL_TITLE")
  const [goalDetails, setGoalDetails] = useState<GoalDetails>({
    title: "",
    reasoning: "",
    specific: "",
    targetDate: undefined
  })
  const [messages, setMessages] = useState<Message[]>([
    getInitialMessage(goalType)
  ])
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isThinking, setIsThinking] = useState(false);

  useEffect(() => {
    const scrollToBottom = () => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim()) return

    // Add user message
    setMessages(prev => [...prev, { role: "user", content: inputValue }])

    switch(step) {
      case "GOAL_TITLE":
        setGoalDetails(prev => ({ ...prev, title: inputValue }))
        setMessages(prev => [...prev, {
          role: "assistant",
          content: `"${inputValue}" is an inspiring goal! 🌟\n\nLet's understand your motivation:\n- Why is this goal important to you?\n- How will achieving it make a difference in your life?`
        }])
        setStep("GOAL_WHY")
        break

      case "GOAL_WHY":
        setGoalDetails(prev => ({ ...prev, reasoning: inputValue }))
        setMessages(prev => [...prev, {
          role: "assistant",
          content: "Great! Let's make this specific.\n\nWhat exactly would success look like? What level or milestone would indicate you've achieved this goal?"
        }])
        setStep("GOAL_SPECIFIC")
        break

      case "GOAL_SPECIFIC":
        setGoalDetails(prev => ({ ...prev, specific: inputValue }))
        setMessages(prev => [...prev, {
          role: "assistant",
          content: "When would you like to achieve this goal by? Select a target date:",
          includeCalendar: true // Special flag to show calendar
        }])
        setStep("GOAL_TIMELINE")
        break

      case "GOAL_TIMELINE":
        // This will be handled by the calendar selection
        break

      case "CONFIRM_PLAN":
        if (inputValue.toLowerCase() === 'yes' && user) { // Add user check
          setIsLoading(true);
          try {
            const plan = messages[messages.length - 1].plan as AIResponse;
            if (!plan || !plan.smartGoal) {
              throw new Error('Invalid plan data');
            }

            const now = new Date();
            
            // First create the base goal without milestones and tasks
            const goalData = {
              title: goalDetails.title,
              description: goalDetails.specific,
              smart_goal: plan.smartGoal,
              start_date: now.toISOString(),
              end_date: goalDetails.targetDate?.toISOString() || now.toISOString(),
              progress: 0,
              reasoning: goalDetails.reasoning,
              color: '#4DABF7'  // Just use a nice blue color as default
            };

            console.log('Creating goal with data:', goalData);
            const goal = await createGoal(goalData);

            if (goal) {
              try {
                // Create milestones
                const { error: milestonesError } = await supabase
                  .from('milestones')
                  .insert(plan.milestones.map(m => ({
                    title: m.title,
                    date: m.date,
                    completed: false,
                    goal_id: goal.id
                  })));

                if (milestonesError) {
                  console.error('Error creating milestones:', milestonesError);
                  throw milestonesError;
                }

                // Create tasks - filter for valid task types
                const validTasks = plan.tasks
                  .filter(t => t.type === 'daily' || t.type === 'weekly')
                  .map(t => ({
                    title: t.title,
                    type: t.type as 'daily' | 'weekly',
                    date: now.toISOString(),
                    weekday: t.type === 'weekly' ? t.weekday : undefined,
                    completed: false,
                    goal_id: goal.id,
                    user_id: user.id
                  }));

                if (validTasks.length > 0) {
                  const { error: tasksError } = await supabase
                    .from('tasks')
                    .insert(validTasks);

                  if (tasksError) {
                    console.error('Error creating tasks:', tasksError);
                    throw tasksError;
                  }
                }

                setMessages(prev => [...prev, {
                  role: "assistant",
                  content: "✨ Great! I've created your goal with all milestones and tasks. You'll find it in your dashboard!"
                }]);
                onGoalCreated(goal);

              } catch (error) {
                console.error('Error creating milestones/tasks:', error);
                setMessages(prev => [...prev, {
                  role: "assistant",
                  content: "I created the goal but had trouble with the milestones and tasks. Would you like to try again?"
                }]);
              }
            }
          } catch (error) {
            console.error('Error creating goal:', error);
            setMessages(prev => [...prev, {
              role: "assistant",
              content: "I'm sorry, I had trouble creating your goal. Would you like to try again?"
            }]);
          } finally {
            setIsLoading(false);
          }
        }
        break;
    }

    setInputValue("")
  }

  const handleDateSelect = async (date: Date | undefined) => {
    if (!date || isThinking) return;

    try {
      setIsThinking(true);
      const requestBody = {
        title: goalDetails.title,
        reasoning: goalDetails.reasoning,
        specific: goalDetails.specific,
        targetDate: format(date, 'yyyy-MM-dd')
      };

      const response = await fetch("/api/generate-goal-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate plan');
      }

      if (!data.plan || !data.rawPlan) {
        throw new Error('Invalid response from AI');
      }

      // Only update state if we got a valid response
      setGoalDetails(prev => ({ ...prev, targetDate: date }));
      setMessages(prev => [...prev, {
        role: "assistant",
        content: data.plan,
        plan: data.rawPlan
      }]);
      setStep("CONFIRM_PLAN");

    } catch (error) {
      console.error("Error generating plan:", error);
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "I had trouble creating your plan. Would you like to try selecting a different date?"
      }]);
    } finally {
      setIsThinking(false);
    }
  };

  const handleAcceptPlan = async () => {
    if (!user) return;
    
    setIsThinking(true);
    try {
      const plan = messages[messages.length - 1].plan as AIResponse;
      if (!plan || !plan.smartGoal) {
        throw new Error('Invalid plan data');
      }

      const now = new Date();
      
      // Create the base goal
      const goalData = {
        title: goalDetails.title,
        description: goalDetails.specific,
        smart_goal: plan.smartGoal,
        start_date: now.toISOString(),
        end_date: goalDetails.targetDate?.toISOString() || now.toISOString(),
        progress: 0,
        reasoning: goalDetails.reasoning,
        color: '#4DABF7'
      };

      const goal = await createGoal(goalData);
      if (goal) {
        try {
          // Create milestones
          const { error: milestonesError } = await supabase
            .from('milestones')
            .insert(plan.milestones.map(m => ({
              title: m.title,
              date: m.date,
              completed: false,
              goal_id: goal.id
            })));

          if (milestonesError) throw milestonesError;

          // Create tasks
          const validTasks = plan.tasks
            .filter(t => t.type === 'daily' || t.type === 'weekly')
            .map(t => ({
              title: t.title,
              type: t.type as 'daily' | 'weekly',
              date: now.toISOString(),
              weekday: t.type === 'weekly' ? t.weekday : undefined,
              completed: false,
              goal_id: goal.id,
              user_id: user.id
            }));

          if (validTasks.length > 0) {
            const { error: tasksError } = await supabase
              .from('tasks')
              .insert(validTasks);

            if (tasksError) throw tasksError;
          }

          setMessages(prev => [...prev, {
            role: "assistant",
            content: "✨ Great! I've created your goal with all milestones and tasks. You'll find it in your dashboard!"
          }]);
          onGoalCreated(goal);

        } catch (error) {
          console.error('Error creating milestones/tasks:', error);
          setMessages(prev => [...prev, {
            role: "assistant",
            content: "I created the goal but had trouble with the milestones and tasks. Would you like to try again?"
          }]);
        }
      }
    } catch (error) {
      console.error('Error creating goal:', error);
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "I'm sorry, I had trouble creating your goal. Would you like to try again?"
      }]);
    } finally {
      setIsThinking(false);
    }
  };

  const debouncedDateSelect = debounce((date: Date) => {
    handleDateSelect(date);
  }, 500); // Wait 500ms after the last change before sending

  return (
    <div className="flex flex-col h-[600px]">
      <ScrollArea className="flex-1" ref={scrollAreaRef}>
        <div className="p-4 space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${
                message.role === "assistant" ? "justify-start" : "justify-end"
              }`}
            >
              <div
                className={`rounded-lg px-4 py-2 max-w-[80%] ${
                  message.role === "assistant"
                    ? "bg-secondary"
                    : "bg-primary text-primary-foreground"
                }`}
              >
                <div className="whitespace-pre-wrap">{message.content}</div>
                {message.plan && (
                  <div className="mt-4 space-y-4">
                    <p className="text-sm text-muted-foreground">
                      I've created a personalized plan based on our conversation. Would you like to proceed with this goal?
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="default"
                        onClick={handleAcceptPlan}
                        disabled={isThinking}
                      >
                        Accept Plan
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setMessages(prev => [...prev, {
                            role: "assistant",
                            content: "What would you like to adjust in the plan?"
                          }]);
                        }}
                        disabled={isThinking}
                      >
                        Request Changes
                      </Button>
                    </div>
                  </div>
                )}
                {message.includeCalendar && (
                  <div className="mt-4">
                    <Input
                      type="date"
                      min={format(new Date(), 'yyyy-MM-dd')}
                      max="2030-12-31"
                      value={goalDetails.targetDate ? format(goalDetails.targetDate, 'yyyy-MM-dd') : ''}
                      onChange={(e) => {
                        // Just update the display immediately, don't trigger API call
                        const date = e.target.value ? new Date(e.target.value) : undefined;
                        if (date) {
                          date.setHours(12, 0, 0, 0);
                          setGoalDetails(prev => ({ ...prev, targetDate: date }));
                        }
                      }}
                      onBlur={(e) => {
                        // Only trigger API call when input loses focus
                        if (!isThinking && e.target.value) {
                          const date = new Date(e.target.value);
                          date.setHours(12, 0, 0, 0);
                          handleDateSelect(date);
                        }
                      }}
                      className="w-[240px]"
                      disabled={isThinking}
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
          {isThinking && <TypingAnimation />}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
      <div className="p-4 border-t">
        <InputArea
          value={inputValue}
          onChange={(value) => setInputValue(value)}
          onSend={handleSend}
          disabled={step === "GOAL_TIMELINE" || isLoading}
        />
      </div>
    </div>
  )
}
