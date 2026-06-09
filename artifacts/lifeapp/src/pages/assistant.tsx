import { useState, useRef, useEffect } from "react";
import { useListChatMessages, getListChatMessagesQueryKey, useSendChatMessage, useClearChat } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Bot, User, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function Assistant() {
  const [input, setInput] = useState("");
  const { data: messages, isLoading } = useListChatMessages();
  const sendMsg = useSendChatMessage();
  const clearChat = useClearChat();
  const queryClient = useQueryClient();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input;
    setInput("");

    sendMsg.mutate({ data: { message: userMessage } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListChatMessagesQueryKey() });
      }
    });
  };

  const handleClear = () => {
    if (confirm("Are you sure you want to clear the conversation history?")) {
      clearChat.mutate(undefined, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListChatMessagesQueryKey() });
        }
      });
    }
  };

  return (
    <div className="h-[calc(100vh-5rem)] max-w-4xl mx-auto flex flex-col animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-6 flex-shrink-0">
        <div>
          <h1 className="text-3xl font-serif">Assistant</h1>
          <p className="text-muted-foreground mt-1">Your personal AI companion.</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleClear} className="text-muted-foreground hover:text-destructive gap-2">
          <Trash2 className="w-4 h-4" /> Clear Chat
        </Button>
      </div>

      <div className="flex-1 bg-card rounded-xl border border-border flex flex-col overflow-hidden relative shadow-sm">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth">
          {messages?.length === 0 && !isLoading ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground space-y-4">
              <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-2">
                <Bot className="w-8 h-8 text-primary" />
              </div>
              <p className="max-w-sm">I'm your assistant. How can I help you today?</p>
            </div>
          ) : (
            messages?.map((msg) => (
              <div key={msg.id} className={`flex gap-4 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                <Avatar className={`w-8 h-8 flex-shrink-0 ${msg.role === "assistant" ? "bg-primary/20 text-primary" : "bg-secondary text-secondary-foreground"}`}>
                  <AvatarFallback className="bg-transparent">
                    {msg.role === "assistant" ? <Bot className="w-5 h-5" /> : <User className="w-5 h-5" />}
                  </AvatarFallback>
                </Avatar>
                
                <div className={`max-w-[80%] rounded-2xl px-5 py-3 ${
                  msg.role === "user" 
                    ? "bg-primary text-primary-foreground rounded-tr-sm" 
                    : "bg-secondary text-secondary-foreground rounded-tl-sm border border-border"
                }`}>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))
          )}
          
          {sendMsg.isPending && (
            <div className="flex gap-4 flex-row">
              <Avatar className="w-8 h-8 flex-shrink-0 bg-primary/20 text-primary">
                <AvatarFallback className="bg-transparent">
                  <Bot className="w-5 h-5" />
                </AvatarFallback>
              </Avatar>
              <div className="max-w-[80%] rounded-2xl rounded-tl-sm px-5 py-3 bg-secondary text-secondary-foreground border border-border flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" />
                <div className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce delay-150" />
                <div className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce delay-300" />
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t bg-card/50 backdrop-blur-sm relative z-10">
          <form onSubmit={handleSend} className="flex gap-2 relative">
            <Input 
              placeholder="Ask anything..." 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 bg-background h-12 rounded-full pl-6 pr-12 focus-visible:ring-primary/30"
            />
            <Button 
              type="submit" 
              size="icon" 
              className="absolute right-1 top-1 h-10 w-10 rounded-full"
              disabled={!input.trim() || sendMsg.isPending}
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
