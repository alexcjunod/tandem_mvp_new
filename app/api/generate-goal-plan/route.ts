import { NextResponse } from "next/server"
import Replicate from "replicate"
import { format } from "date-fns"

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
})

// Add type for the output
type ReplicateOutput = string[] | string;

// Add a function to fix dates in tasks
const fixDates = (plan: any, startDate: string) => {
  const start = new Date(startDate);
  
  // Fix tasks dates
  if (plan.tasks) {
    plan.tasks = plan.tasks.map((task: any) => ({
      ...task,
      date: format(start, 'yyyy-MM-dd') // Set all tasks to start date
    }));
  }

  // Fix milestone dates if they're invalid
  if (plan.milestones) {
    plan.milestones = plan.milestones.map((milestone: any) => {
      if (milestone.date.includes('YYYY')) {
        // Generate a date between start and target date
        const date = new Date(start);
        date.setDate(date.getDate() + 30); // Add 30 days for each milestone
        return {
          ...milestone,
          date: format(date, 'yyyy-MM-dd')
        };
      }
      return milestone;
    });
  }

  return plan;
};

export async function POST(req: Request) {
  try {
    const { title, reasoning, specific, targetDate } = await req.json()

    const prompt = `[INST] Create a structured SMART goal plan for: "${title}"

Context:
- User's motivation: ${reasoning}
- Success criteria: ${specific}
- Target date: ${targetDate}

Return a valid JSON object with this exact structure (no additional text):
{
  "smartGoal": {
    "specific": "Clear goal statement",
    "measurable": "How to track progress",
    "achievable": "Why it's realistic",
    "relevant": "Connection to motivation",
    "timeBound": "Timeline with target date"
  },
  "milestones": [
    {
      "title": "Clear milestone description",
      "date": "YYYY-MM-DD"
    }
  ],
  "tasks": [
    {
      "title": "Daily task description",
      "type": "daily",
      "date": "YYYY-MM-DD"
    },
    {
      "title": "Weekly task description",
      "type": "weekly",
      "weekday": 0,
      "date": "YYYY-MM-DD"
    }
  ]
}

Requirements:
- Include 2-3 daily practice tasks
- Include at least 5 different weekly tasks spread across different days
- Each weekly task should be on a different day (weekday: 0-6, where 0 is Sunday)
- Tasks should build up progressively towards the final goal
- Task types must be exactly "daily" or "weekly"

Example weekly tasks distribution:
- Sunday (weekday: 0): Review and planning session
- Monday (weekday: 1): Technique practice
- Tuesday (weekday: 2): New material learning
- Wednesday (weekday: 3): Practice with backing tracks
- Thursday (weekday: 4): Recording and evaluation
[/INST]`

    const output = await replicate.run(
      "meta/llama-2-70b-chat:02e509c789964a7ea8736978a43525956ef40397be9033abf9fd2badfe68c9e3",
      {
        input: {
          prompt,
          max_tokens: 2048,
          temperature: 0.7,
        }
      }
    ) as ReplicateOutput;

    // Parse and clean the response
    let jsonString = '';
    if (Array.isArray(output)) {
      // Join the array and clean up any extra text after the JSON object
      jsonString = output.join('')
        .replace(/\n/g, '')  // Remove newlines
        .match(/\{.*\}/)?.[0] || ''; // Extract just the JSON object
    } else if (typeof output === 'string') {
      jsonString = output
        .replace(/\n/g, '')  // Remove newlines
        .match(/\{.*\}/)?.[0] || ''; // Extract just the JSON object
    } else {
      throw new Error('Unexpected output format from AI');
    }

    try {
      // Clean up common JSON formatting issues
      jsonString = jsonString
        .replace(/\}\{/g, '},{')
        .replace(/\}"/g, '},"')
        .replace(/\}\]/g, '}]')
        .replace(/\}\}/g, '}}')
        .replace(/,,/g, ',');

      const parsedOutput = JSON.parse(jsonString);

      // Fix any invalid dates in the plan
      const fixedPlan = fixDates(parsedOutput, targetDate);

      // Validate structure
      if (!fixedPlan?.smartGoal?.specific) {
        throw new Error('Missing SMART goal data');
      }
      if (!Array.isArray(fixedPlan?.milestones)) {
        throw new Error('Missing milestones data');
      }
      if (!Array.isArray(fixedPlan?.tasks)) {
        throw new Error('Missing tasks data');
      }

      return NextResponse.json({ 
        plan: formatPlan(fixedPlan),
        rawPlan: fixedPlan
      });
    } catch (error) {
      console.error('JSON parsing error:', error, 'Raw JSON:', jsonString);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to parse AI response' },
        { status: 422 }
      );
    }
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate goal plan" },
      { status: 500 }
    );
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