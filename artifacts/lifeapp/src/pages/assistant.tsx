import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Bot, User, Trash2, Mic } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface UserProfile {
  name: string;
  title: string;
}

export function Assistant() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [autoMode, setAutoMode] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [setupStep, setSetupStep] = useState<"name" | "title" | "done">("name");
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const messagesRef = useRef<Message[]>([]);
  const autoModeRef = useRef(false);
  const profileRef = useRef<UserProfile | null>(null);
  const setupRef = useRef<"name" | "title" | "done">("name");

  messagesRef.current = messages;
  autoModeRef.current = autoMode;
  profileRef.current = profile;
  setupRef.current = setupStep;

  useEffect(() => {
    const saved = localStorage.getItem("assistant_profile");
    if (saved) {
      const p = JSON.parse(saved);
      setProfile(p);
      setSetupStep("done");
    }
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const speak = useCallback((text: string, onDone?: () => void) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => { setIsSpeaking(false); if (onDone) onDone(); };
    utterance.onerror = () => { setIsSpeaking(false); if (onDone) onDone(); };
    window.speechSynthesis.speak(utterance);
  }, []);

  const startListening = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "";
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (e: any) => {
      const t = Array.from(e.results).map((r: any) => r[0].transcript).join("");
      setTranscript(t);
      if (e.results[e.results.length - 1].isFinal) {
        recognitionRef.current.lastTranscript = e.results[e.results.length - 1][0].transcript;
      }
    };
    recognition.onend = async () => {
      setIsListening(false);
      const final = recognitionRef.current?.lastTranscript || "";
      setTranscript("");
      if (final.trim()) {
        await handleInput(final.trim());
      } else if (autoModeRef.current) {
        setTimeout(() => startListening(), 500);
      }
    };
    recognition.onerror = () => {
      setIsListening(false);
      setTranscript("");
      if (autoModeRef.current) setTimeout(() => startListening(), 1000);
    };
    recognitionRef.current = recognition;
    recognitionRef.current.lastTranscript = "";
    recognition.start();
  }, []);

  const handleInput = async (text: string) => {
    if (setupRef.current === "name") {
      const name = text.trim();
      setMessages(prev => [...prev, { role: "user", content: name }]);
      const msg = `شكراً ${name}! واش أنت Mr. ولا Ms.؟`;
      setMessages(prev => [...prev, { role: "assistant", content: msg }]);
      setSetupStep("title");
      speak(msg, () => { if (autoModeRef.current) setTimeout(() => startListening(), 300); });
      recognitionRef.current = { ...recognitionRef.current, pendingName: name };
      return;
    }

    if (setupRef.current === "title") {
      const lower = text.toLowerCase();
      const title = lower.includes("ms") || lower.includes("miss") || lower.includes("بنت") || lower.includes("انثى") || lower.includes("سيدة") ? "Ms." : "Mr.";
      const pendingName = recognitionRef.current?.pendingName || "صديقي";
      const newProfile = { name: pendingName, title };
      setProfile(newProfile);
      setSetupStep("done");
      localStorage.setItem("assistant_profile", JSON.stringify(newProfile));
      const msg = `ممتاز! أهلاً ${title} ${pendingName} 😊 أنا جاهز لمساعدتك في أي وقت. كيف يمكنني مساعدتك؟`;
      setMessages(prev => [...prev, { role: "user", content: text }, { role: "assistant", content: msg }]);
      speak(msg, () => { if (autoModeRef.current) setTimeout(() => startListening(), 300); });
      return;
    }

    await sendMessage(text);
  };

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;
    setMessages(prev => [...prev, { role: "user", content: text }]);
    setIsLoading(true);
    const p = profileRef.current;
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history: messagesRef.current.map(m => ({ role: m.role, content: m.content })),
          userTitle: p ? `${p.title} ${p.name}` : ""
        })
      });
      const data = await res.json();
      const reply = data.content || data.message || "...";
      setMessages(prev => [...prev, { role: "assistant", content: reply }]);
      setIsLoading(false);
      speak(reply, () => { if (autoModeRef.current) setTimeout(() => startListening(), 300); });
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Error." }]);
      setIsLoading(false);
      if (autoModeRef.current) setTimeout(() => startListening(), 1000);
    }
  };

  const toggleAutoMode = () => {
    if (!autoMode) {
      setAutoMode(true);
      autoModeRef.current = true;
      const p = profileRef.current;
      const greeting = p
        ? `مرحباً ${p.title} ${p.name}! أنا جاهز، تكلم معي 🎤`
        : "مرحباً! أنا مساعدك الشخصي. ما اسمك؟";
      if (!p) {
        setMessages([{ role: "assistant", content: greeting }]);
      }
      speak(greeting, () => startListening());
    } else {
      setAutoMode(false);
      autoModeRef.current = false;
      recognitionRef.current?.stop();
      window.speechSynthesis.cancel();
      setIsListening(false);
      setIsSpeaking(false);
    }
  };

  return (
    <div className="space-y-4 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold">Assistant</h1>
          <p className="text-muted-foreground">
            {profile ? `مرحباً ${profile.title} ${profile.name} 👋` : "Your personal AI companion."}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={autoMode ? "default" : "outline"}
            size="sm"
            onClick={toggleAutoMode}
            className={autoMode ? "bg-green-600 hover:bg-green-700" : ""}
          >
            <Mic className={`w-4 h-4 mr-2 ${autoMode ? "animate-pulse" : ""}`} />
            {autoMode ? "جاهز 🎤" : "وضع الصوت"}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => {
            setMessages([]);
            window.speechSynthesis.cancel();
            localStorage.removeItem("assistant_profile");
            setProfile(null);
            setSetupStep("name");
          }}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {autoMode && (
        <div className={`text-center py-2 rounded-lg text-sm font-medium ${isListening ? "bg-red-500/20 text-red-400" : isSpeaking ? "bg-blue-500/20 text-blue-400" : isLoading ? "bg-yellow-500/20 text-yellow-400" : "bg-green-500/20 text-green-400"}`}>
          {isListening ? "🎤 كنسمعك..." : isSpeaking ? "🔊 كيتكلم..." : isLoading ? "⏳ كيفكر..." : "✅ جاهز — تكلم!"}
        </div>
      )}

      {transcript && (
        <div className="text-center text-sm text-muted-foreground italic">"{transcript}"</div>
      )}

      <ScrollArea className="flex-1 h-80" ref={scrollRef}>
        <div className="space-y-4 p-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <Bot className="w-12 h-12 text-primary mb-4" />
              <p className="text-muted-foreground">اضغط "وضع الصوت" وتكلم مباشرة 🎤</p>
            </div>
          ) : (
            messages.map((msg, i) => (
              <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.role === "assistant" && (
                  <Avatar className="w-8 h-8">
                    <AvatarFallback><Bot className="w-4 h-4" /></AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={`rounded-lg px-4 py-2 max-w-xs lg:max-w-md cursor-pointer ${msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-secondary"}`}
                  onClick={() => msg.role === "assistant" && speak(msg.content)}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                </div>
                {msg.role === "user" && (
                  <Avatar className="w-8 h-8">
                    <AvatarFallback><User className="w-4 h-4" /></AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex gap-3">
              <Avatar className="w-8 h-8"><AvatarFallback><Bot className="w-4 h-4" /></AvatarFallback></Avatar>
              <div className="bg-secondary rounded-lg px-4 py-2"><p className="text-sm">...</p></div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

export default Assistant;
