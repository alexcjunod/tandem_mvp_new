import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { Message } from "@/types/chat"

interface MessageBubbleProps {
  role: Message["role"]
  content: string
}

export function MessageBubble({ role, content }: MessageBubbleProps) {
  return (
    <div className={`flex items-start gap-2 ${
      role === "assistant" ? "justify-start" : "justify-end"
    }`}>
      {role === "assistant" && (
        <Avatar className="w-8 h-8">
          <AvatarImage src="/ai-avatar.png" alt="AI" />
          <AvatarFallback>AI</AvatarFallback>
        </Avatar>
      )}
      
      <Card
        className={`max-w-[80%] ${
          role === "assistant" ? "" : "bg-primary text-primary-foreground"
        }`}
      >
        <CardContent className="p-3">
          <p className="text-sm whitespace-pre-wrap leading-relaxed">
            {content}
          </p>
        </CardContent>
      </Card>

      {role === "user" && (
        <Avatar className="w-8 h-8">
          <AvatarImage src="/user-avatar.png" alt="User" />
          <AvatarFallback>Me</AvatarFallback>
        </Avatar>
      )}
    </div>
  )
}

export function TypingIndicator() {
  return (
    <div className="flex items-start gap-2">
      <Avatar className="w-8 h-8">
        <AvatarImage src="/ai-avatar.png" alt="AI" />
        <AvatarFallback>AI</AvatarFallback>
      </Avatar>
      
      <Card className="max-w-[80%]">
        <CardContent className="p-3">
          <div className="flex gap-1">
            <div className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
            <div className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
            <div className="w-2 h-2 rounded-full bg-primary animate-bounce" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 