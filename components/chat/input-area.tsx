import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Send } from "lucide-react"

interface InputAreaProps {
  value: string
  onChange: (value: string) => void
  onSend: () => void
  disabled?: boolean
}

export function InputArea({ value, onChange, onSend, disabled }: InputAreaProps) {
  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      onSend()
    }
  }

  return (
    <div className="p-4 border-t bg-background">
      <div className="flex gap-2">
        <Textarea
          placeholder="Type your response..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyPress={handleKeyPress}
          className="min-h-[44px] flex-1 resize-none"
          rows={1}
          disabled={disabled}
        />
        <Button 
          size="icon" 
          onClick={onSend}
          disabled={disabled || !value.trim()}
        >
          <Send className="h-4 w-4" />
          <span className="sr-only">Send</span>
        </Button>
      </div>
    </div>
  )
} 