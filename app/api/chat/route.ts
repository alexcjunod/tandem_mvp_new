import { NextResponse } from "next/server"
import Replicate from "replicate"

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
})

export async function POST(req: Request) {
  try {
    const { messages, systemPrompt } = await req.json()

    const input = {
      prompt: `${systemPrompt}\n\nCurrent conversation:\n${messages
        .map((m: any) => `${m.role}: ${m.content}`)
        .join("\n")}`,
      max_tokens: 1024,
      temperature: 0.7,
      top_p: 0.9,
    }

    const output = await replicate.run(
      "meta/llama-2-70b-chat:02e509c789964a7ea8736978a43525956ef40397be9033abf9fd2badfe68c9e3",
      { input }
    )

    return NextResponse.json({ response: output })
  } catch (error) {
    console.error("Error:", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
} 