import { NextResponse } from "next/server"
import Replicate from "replicate"
import { format } from "date-fns"

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
})

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
  }>;
  tasks: Array<{
    title: string;
    type: 'daily' | 'weekly';
    weekday?: number;
    date?: string;
  }>;
}

export async function POST(req: Request) {
  try {
    const { title, reasoning, specific, targetDate } = await req.json()

    const prompt = `Create a SMART goal plan for learning ${title}. Include specific milestones and both daily and weekly tasks.`

    let response = await replicate.run(
      "meta/llama-2-70b-chat:02e509c789964a7ea8736978a43525956ef40397be9033abf9fd2badfe68c9e3",
      {
        input: {
          prompt,
          max_tokens: 2048,
          temperature: 0.7,
        }
      }
    )

    // Create a default response if AI fails
    const defaultResponse: AIResponse = {
      smartGoal: {
        specific: `Learn ${title} to a proficient level`,
        measurable: "Track progress through completed tasks and milestones",
        achievable: "Break down into manageable daily and weekly tasks",
        relevant: reasoning || "Personal development goal",
        timeBound: `Complete by ${targetDate}`
      },
      milestones: [
        {
          title: "Get started",
          date: new Date().toISOString().split('T')[0]
        }
      ],
      tasks: [
        {
          title: "Daily practice",
          type: "daily"
        },
        {
          title: "Weekly review",
          type: "weekly",
          weekday: 0
        }
      ]
    }

    let parsedResponse: AIResponse;

    try {
      // Try to parse AI response
      const responseText = Array.isArray(response) ? response.join('') : String(response || '');
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      parsedResponse = jsonMatch ? JSON.parse(jsonMatch[0]) : defaultResponse;
    } catch (error) {
      console.error('Error parsing AI response:', error);
      parsedResponse = defaultResponse;
    }

    // Format the response for display
    const formattedPlan = formatPlan(parsedResponse);

    return NextResponse.json({ 
      plan: formattedPlan,
      rawPlan: parsedResponse
    });

  } catch (error) {
    console.error("Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate goal plan" },
      { status: 500 }
    )
  }
}

function formatPlan(plan: AIResponse) {
  return `📋 SMART Goal Breakdown
──────────────────────

🎯 Specific:
${plan.smartGoal.specific}

📊 Measurable:
${plan.smartGoal.measurable}

✅ Achievable:
${plan.smartGoal.achievable}

💫 Relevant:
${plan.smartGoal.relevant}

⏱️ Timeline:
${plan.smartGoal.timeBound}


🏆 Key Milestones
──────────────────

${plan.milestones.map(m => 
  `${format(new Date(m.date), 'MMM d, yyyy')}
  ▸ ${m.title}`
).join('\n\n')}


📝 Daily Practice
──────────────────

${plan.tasks
  .filter(t => t.type === 'daily')
  .map(t => 
    `• ${t.title}`
  ).join('\n\n')}


🔄 Weekly Schedule
──────────────────

${plan.tasks
  .filter(t => t.type === 'weekly')
  .map(t => 
    `${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][t.weekday || 0]}:
  ▸ ${t.title}`
  ).join('\n\n')}`;
} 