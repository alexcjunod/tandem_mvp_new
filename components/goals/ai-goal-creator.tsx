"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"

type Message = {
  role: "user" | "assistant"
  content: string
}

export default function AIGoalCreator() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // Initial prompt to guide the AI
  const systemPrompt = `You are a SMART goal creation assistant. Guide users through creating SMART goals by:
  1. Ask about their general goal
  2. Make it Specific by asking clarifying questions
  3. Make it Measurable by defining metrics
  4. Make it Achievable by breaking it down
  5. Make it Relevant by connecting to their motivation
  6. Make it Time-bound by setting deadlines
  
  After gathering all information, format the final goal in this JSON structure:
  {
    "goal": "Final SMART goal statement",
    "metrics": ["list", "of", "measurable", "metrics"],
    "milestones": [
      {
        "title": "milestone title",
        "deadline": "YYYY-MM-DD",
        "tasks": ["task1", "task2"]
      }
    ],
    "deadline": "YYYY-MM-DD"
  }`

  async function sendMessage(content: string) {
    try {
      setIsLoading(true)
      const newMessage: Message = { role: "user", content }
      setMessages(prev => [...prev, newMessage])
      setInput("")

      // TODO: Add API call to Replicate here
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, newMessage],
          systemPrompt
        })
      })

      const data = await response.json()
      setMessages(prev => [...prev, { role: "assistant", content: data.response }])
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Create Your SMART Goal</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-4">
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
                  {message.content}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
      <CardFooter>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (input.trim()) sendMessage(input.trim())
          }}
          className="flex w-full gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            disabled={isLoading}
          />
          <Button type="submit" disabled={isLoading || !input.trim()}>
            Send
          </Button>
        </form>
      </CardFooter>
    </Card>
  )
} 