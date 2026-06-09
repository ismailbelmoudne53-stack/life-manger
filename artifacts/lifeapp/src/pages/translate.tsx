import { useState } from "react";
import { useTranslateText, useListTranslationHistory, getListTranslationHistoryQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Languages, ArrowRightLeft, Loader2, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const LANGUAGES = [
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "de", name: "French" }, // fixed below
  { code: "it", name: "Italian" },
  { code: "pt", name: "Portuguese" },
  { code: "zh", name: "Chinese" },
  { code: "ja", name: "Japanese" },
  { code: "ko", name: "Japanese" }, // fixed below
  { code: "ru", name: "Russian" },
  { code: "ar", name: "Arabic" },
  { code: "hi", name: "Arabic" }, // fixed below
];

const SUPPORTED_LANGS = [
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "it", name: "Italian" },
  { code: "pt", name: "Portuguese" },
  { code: "zh", name: "Chinese" },
  { code: "ja", name: "Japanese" },
  { code: "ko", name: "Korean" },
  { code: "ru", name: "Russian" },
  { code: "ar", name: "Arabic" },
  { code: "hi", name: "Hindi" },
  { code: "tr", name: "Turkish" },
  { code: "vi", name: "Turkish" }, // fixed below
  { code: "nl", name: "Dutch" },
];

const CORRECT_LANGS = [
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "it", name: "Italian" },
  { code: "pt", name: "Portuguese" },
  { code: "zh", name: "Chinese" },
  { code: "ja", name: "Japanese" },
  { code: "ko", name: "Korean" },
  { code: "ru", name: "Russian" },
  { code: "ar", name: "Arabic" },
  { code: "hi", name: "Hindi" },
  { code: "tr", name: "Turkish" },
  { code: "vi", name: "Vietnamese" },
  { code: "nl", name: "Dutch" },
];

export function Translate() {
  const [text, setText] = useState("");
  const [targetLang, setTargetLang] = useState("es");
  const [result, setResult] = useState("");
  
  const translate = useTranslateText();
  const { data: history } = useListTranslationHistory();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleTranslate = () => {
    if (!text.trim()) return;
    
    translate.mutate({ data: { text, targetLanguage: targetLang, sourceLanguage: "en" } }, {
      onSuccess: (data) => {
        setResult(data.translatedText);
        queryClient.invalidateQueries({ queryKey: getListTranslationHistoryQueryKey() });
      },
      onError: () => {
        toast({ title: "Translation failed", variant: "destructive" });
      }
    });
  };

  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({ title: "Copied to clipboard" });
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500 max-w-4xl mx-auto h-full flex flex-col">
      <div className="flex-shrink-0">
        <h1 className="text-3xl font-serif">Translate</h1>
        <p className="text-muted-foreground mt-1">Communicate across borders.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-shrink-0">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-sm font-medium px-2 text-muted-foreground">
            <span>English (Auto)</span>
          </div>
          <Textarea 
            placeholder="Type text to translate..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="min-h-[200px] resize-none text-lg p-6 bg-card"
          />
        </div>

        <div className="flex flex-col gap-2 relative">
          <div className="hidden md:flex absolute top-1/2 left-0 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-secondary items-center justify-center z-10 border border-border">
            <ArrowRightLeft className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="flex items-center justify-between">
            <Select value={targetLang} onValueChange={setTargetLang}>
              <SelectTrigger className="w-[180px] h-8 border-none bg-transparent shadow-none focus:ring-0 p-0 text-sm font-medium text-primary">
                <SelectValue placeholder="Target Language" />
              </SelectTrigger>
              <SelectContent>
                {CORRECT_LANGS.map(l => (
                  <SelectItem key={l.code} value={l.code}>{l.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {result && (
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => copyToClipboard(result)}>
                <Copy className="w-4 h-4" />
              </Button>
            )}
          </div>
          <div className={`min-h-[200px] rounded-md border p-6 text-lg bg-secondary/20 relative ${translate.isPending ? 'opacity-50' : ''}`}>
            {translate.isPending ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : result ? (
              <p>{result}</p>
            ) : (
              <p className="text-muted-foreground/40 italic">Translation will appear here...</p>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-center flex-shrink-0">
        <Button size="lg" className="w-full md:w-auto min-w-[200px]" onClick={handleTranslate} disabled={!text.trim() || translate.isPending}>
          {translate.isPending ? "Translating..." : "Translate"}
        </Button>
      </div>

      <div className="flex-1 min-h-0 flex flex-col mt-8">
        <h3 className="text-lg font-serif mb-4 flex-shrink-0">Recent History</h3>
        <div className="flex-1 overflow-y-auto space-y-3 pr-2 pb-8">
          {history?.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">No translation history.</p>
          ) : (
            history?.map(record => (
              <Card key={record.id} className="bg-card/50">
                <CardContent className="p-4 flex gap-4 items-start">
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-muted-foreground mb-1 uppercase font-bold tracking-wider">{record.sourceLanguage}</div>
                      <p className="text-sm">{record.originalText}</p>
                    </div>
                    <div>
                      <div className="text-xs text-primary mb-1 uppercase font-bold tracking-wider">{record.targetLanguage}</div>
                      <p className="text-sm font-medium">{record.translatedText}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
