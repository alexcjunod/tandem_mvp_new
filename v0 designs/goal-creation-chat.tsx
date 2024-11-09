"use client"

import { useState } from "react"
import { ArrowLeft, Send, Sparkles, Target, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"

export default function Component() {
  const [step, setStep] = useState(1)
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hi! I'm here to help you create a SMART goal. What's your general goal or aspiration?",
    },
  ])
  const [inputValue, setInputValue] = useState("")
  const [goalDetails, setGoalDetails] = useState({
    general: "",
    specific: "",
    measurable: "",
    timeframe: "",
    category: "",
  })

  const handleSend = () => {
    if (!inputValue.trim()) return

    const newMessages = [...messages, { role: "user", content: inputValue }]

    // Simulate AI responses based on the current step
    if (step === 1) {
      setGoalDetails(prev => ({ ...prev, general: inputValue }))
      newMessages.push({
        role: "assistant",
        content: "Great! Let's make this goal more specific. How exactly do you plan to achieve this? What specific actions will you take?",
      })
      setStep(2)
    } else if (step === 2) {
      setGoalDetails(prev => ({ ...prev, specific: inputValue }))
      newMessages.push({
        role: "assistant",
        content: "How will you measure your progress? What metrics or milestones will you use to track success?",
      })
      setStep(3)
    } else if (step === 3) {
      setGoalDetails(prev => ({ ...prev, measurable: inputValue }))
      newMessages.push({
        role: "assistant",
        content: "When would you like to achieve this goal by? Let's set a realistic timeframe.",
      })
      setStep(4)
    }

    setMessages(newMessages)
    setInputValue("")
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleFinalize = () => {
    setStep(5)
    setMessages(prev => [
      ...prev,
      {
        role: "assistant",
        content: "Great! I've structured your SMART goal. Please review the details below and confirm if you're ready to add this to your dashboard.",
      },
    ])
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <Button variant="ghost" size="icon" className="mr-2">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back</span>
          </Button>
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            <h1 className="font-semibold">Create New Goal</h1>
          </div>
          <Progress value={step * 20} className="ml-auto w-32" />
        </div>
      </header>
      <main className="flex-1">
        <div className="container flex gap-6 py-6">
          <div className="flex-1">
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${
                    message.role === "assistant" ? "justify-start" : "justify-end"
                  }`}
                >
                  <Card
                    className={`max-w-[80%] ${
                      message.role === "assistant" ? "" : "bg-primary text-primary-foreground"
                    }`}
                  >
                    <CardContent className="p-3">
                      <p className="text-sm">{message.content}</p>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
            {step < 5 ? (
              <div className="sticky bottom-0 mt-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex gap-2">
                      <Textarea
                        placeholder="Type your response..."
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyPress={handleKeyPress}
                        className="min-h-[44px] flex-1 resize-none"
                        rows={1}
                      />
                      <Button size="icon" onClick={handleSend}>
                        <Send className="h-4 w-4" />
                        <span className="sr-only">Send</span>
                      </Button>
                    </div>
                  </CardContent>
                </CardFooter>
              </div>
            ) : null}
          </div>
          {step === 5 && (
            <Card className="w-[300px]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Your SMART Goal
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select defaultValue="personal">
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="personal">Personal Development</SelectItem>
                      <SelectItem value="fitness">Fitness</SelectItem>
                      <SelectItem value="career">Career</SelectItem>
                      <SelectItem value="education">Education</SelectItem>
                      <SelectItem value="financial">Financial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Goal Statement</Label>
                  <div className="rounded-md bg-muted p-3">
                    <p className="text-sm">
                      I will {goalDetails.specific} by measuring {goalDetails.measurable}, to be completed by{" "}
                      {goalDetails.timeframe}.
                    </p>
                  </div>
                </div>
                <Button className="w-full" onClick={() => console.log("Goal saved")}>
                  <Check className="mr-2 h-4 w-4" /> Add to Dashboard
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}