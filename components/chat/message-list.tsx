import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { Message } from "@/types/chat"

interface MessageListProps {
  messages: Message[]
  isAssistantTyping: boolean
}

export function MessageList({ messages, isAssistantTyping }: MessageListProps) {
  return (
    <div className="space-y-4 p-4">
      {messages.map((message, index) => (
        <div
          key={index}
          className={`flex items-start gap-2 ${
            message.role === "assistant" ? "justify-start" : "justify-end"
          }`}
        >
          {message.role === "assistant" && (
            <Avatar className="w-8 h-8">
              <AvatarImage src="/ai-avatar.png" alt="AI" />
              <AvatarFallback>AI</AvatarFallback>
            </Avatar>
          )}
          
          <Card
            className={`max-w-[80%] ${
              message.role === "assistant" ? "" : "bg-primary text-primary-foreground"
            }`}
          >
            <CardContent className="p-3">
              <p className="text-sm whitespace-pre-wrap leading-relaxed">
                {message.content}
              </p>
            </CardContent>
          </Card>

          {message.role === "user" && (
            <Avatar className="w-8 h-8">
              <AvatarImage src="/user-avatar.png" alt="User" />
              <AvatarFallback>Me</AvatarFallback>
            </Avatar>
          )}
        </div>
      ))}
      
      {isAssistantTyping && (
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
      )}
    </div>
  )
} 