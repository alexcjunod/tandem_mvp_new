import { NextResponse } from "next/server"
import Replicate from "replicate"
import { format } from "date-fns"

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
})

export async function POST(req: Request) {
  try {
    const { title, reasoning, specific, targetDate } = await req.json()

    const prompt = `[INST] Create a structured SMART goal plan for: "${title}"...`

    const output = await replicate.run(
      "meta/llama-2-70b-chat:02e509c789964a7ea8736978a43525956ef40397be9033abf9fd2badfe68c9e3",
      {
        input: {
          prompt,
          max_tokens: 2048,
          temperature: 0.7,
        }
      }
    );

    // Parse and clean the response
    let jsonString = '';
    
    // Type guard functions
    const isStringArray = (value: unknown): value is string[] => 
      Array.isArray(value) && value.every(item => typeof item === 'string');
    
    const isErrorObject = (value: unknown): value is { error: string } =>
      typeof value === 'object' && value !== null && 'error' in value;

    // Handle different output types
    if (isStringArray(output)) {
      jsonString = output.join('').trim();
    } else if (typeof output === 'string') {
      jsonString = output.trim();
    } else if (isErrorObject(output)) {
      throw new Error(output.error);
    } else {
      throw new Error('Unexpected output format from AI');
    }

    // Extract JSON
    const jsonMatch = jsonString.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in response');
    }

    const parsedOutput = JSON.parse(jsonMatch[0]);

    // Validate structure
    if (!parsedOutput.smartGoal || !parsedOutput.milestones || !parsedOutput.tasks) {
      throw new Error('Invalid response structure');
    }

    return NextResponse.json({ 
      plan: formatPlan(parsedOutput),
      rawPlan: parsedOutput
    });
  } catch (error) {
    console.error("Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate goal plan" },
      { status: 500 }
    )
  }
}

// Helper function to format the plan
function formatPlan(plan: any) {
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

${plan.milestones.map((m: any) => 
  `${format(new Date(m.date), 'MMM d, yyyy')}
  ▸ ${m.title}`
).join('\n\n')}


📝 Daily Practice
──────────────────

${plan.tasks
  .filter((t: any) => t.type === 'daily')
  .map((t: any) => 
    `• ${t.title}`
  ).join('\n\n')}


🔄 Weekly Schedule
──────────────────

${plan.tasks
  .filter((t: any) => t.type === 'weekly')
  .map((t: any) => 
    `${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][t.weekday || 0]}:
  ▸ ${t.title}`
  ).join('\n\n')}`;
} 