import { useState, useEffect } from "react";
import { 
  useListNotes, getListNotesQueryKey,
  useCreateNote, useUpdateNote, useDeleteNote 
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Search, BookOpen } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export function Notes() {
  const { data: notes, isLoading } = useListNotes();
  const [search, setSearch] = useState("");
  const [selectedNoteId, setSelectedNoteId] = useState<number | null>(null);

  const filteredNotes = notes?.filter(n => 
    n.title.toLowerCase().includes(search.toLowerCase()) || 
    n.content.toLowerCase().includes(search.toLowerCase()) ||
    (n.tag && n.tag.toLowerCase().includes(search.toLowerCase()))
  );

  const selectedNote = notes?.find(n => n.id === selectedNoteId);

  return (
    <div className="h-[calc(100vh-5rem)] flex flex-col md:flex-row gap-6 animate-in fade-in duration-500">
      {/* Sidebar List */}
      <div className="w-full md:w-1/3 flex flex-col gap-4 border-r border-border pr-6 pb-6 h-full overflow-hidden">
        <div>
          <h1 className="text-3xl font-serif mb-1">Notes</h1>
          <p className="text-sm text-muted-foreground mb-4">Capture your thoughts.</p>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search notes..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 pr-2">
          {isLoading ? (
            Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)
          ) : filteredNotes?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No notes found.
            </div>
          ) : (
            filteredNotes?.map((note) => (
              <button
                key={note.id}
                onClick={() => setSelectedNoteId(note.id)}
                className={`w-full text-left p-4 rounded-lg border transition-all ${
                  selectedNoteId === note.id 
                    ? "bg-primary/10 border-primary" 
                    : "bg-card border-border hover:border-primary/50"
                }`}
              >
                <h3 className="font-medium truncate">{note.title}</h3>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{note.content}</p>
                <div className="flex justify-between items-center mt-3">
                  <span className="text-[10px] text-muted-foreground">{format(new Date(note.updatedAt), "MMM d")}</span>
                  {note.tag && (
                    <span className="text-[10px] bg-secondary px-2 py-0.5 rounded-full text-foreground">{note.tag}</span>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
        
        <Button onClick={() => setSelectedNoteId(null)} className="w-full gap-2 mt-auto">
          <Plus className="w-4 h-4" /> New Note
        </Button>
      </div>

      {/* Editor Area */}
      <div className="flex-1 flex flex-col h-full bg-card rounded-xl border border-border overflow-hidden">
        {selectedNoteId ? (
          <NoteEditor note={selectedNote} />
        ) : (
          <NewNoteEditor onCreated={(id) => setSelectedNoteId(id)} />
        )}
      </div>
    </div>
  );
}

function NoteEditor({ note }: { note: any }) {
  const [title, setTitle] = useState(note?.title || "");
  const [content, setContent] = useState(note?.content || "");
  const [tag, setTag] = useState(note?.tag || "");
  
  const updateNote = useUpdateNote();
  const deleteNote = useDeleteNote();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Reset state when note changes
  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
      setTag(note.tag || "");
    }
  }, [note]);

  const handleSave = () => {
    if (!title.trim() || !note) return;
    updateNote.mutate({
      id: note.id,
      data: { title, content, tag: tag || undefined }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListNotesQueryKey() });
        toast({ title: "Note saved" });
      }
    });
  };

  const handleDelete = () => {
    if (!note) return;
    if (confirm("Are you sure you want to delete this note?")) {
      deleteNote.mutate({ id: note.id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListNotesQueryKey() });
          toast({ title: "Note deleted" });
        }
      });
    }
  };

  if (!note) return null;

  return (
    <div className="flex flex-col h-full p-6 gap-4">
      <div className="flex justify-between items-center gap-4">
        <Input 
          value={title} 
          onChange={(e) => setTitle(e.target.value)} 
          className="text-2xl font-serif font-semibold border-none focus-visible:ring-0 px-0 h-auto"
          placeholder="Note title"
        />
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleSave} disabled={updateNote.isPending}>
            {updateNote.isPending ? "Saving..." : "Save"}
          </Button>
          <Button variant="ghost" size="icon" onClick={handleDelete} className="text-muted-foreground hover:text-destructive">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>Tag:</span>
        <Input 
          value={tag} 
          onChange={(e) => setTag(e.target.value)} 
          className="h-7 w-32 text-xs" 
          placeholder="e.g. Ideas"
        />
        <span className="ml-auto text-xs">Last updated: {format(new Date(note.updatedAt), "PPp")}</span>
      </div>
      <Textarea 
        value={content} 
        onChange={(e) => setContent(e.target.value)} 
        className="flex-1 resize-none border-none focus-visible:ring-0 px-0 mt-4 leading-relaxed"
        placeholder="Start typing..."
      />
    </div>
  );
}

function NewNoteEditor({ onCreated }: { onCreated: (id: number) => void }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tag, setTag] = useState("");
  
  const createNote = useCreateNote();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleSave = () => {
    if (!title.trim()) {
      toast({ title: "Title is required", variant: "destructive" });
      return;
    }
    createNote.mutate({
      data: { title, content, tag: tag || undefined }
    }, {
      onSuccess: (newNote) => {
        queryClient.invalidateQueries({ queryKey: getListNotesQueryKey() });
        toast({ title: "Note created" });
        onCreated(newNote.id);
      }
    });
  };

  return (
    <div className="flex flex-col h-full p-6 gap-4">
      <div className="flex justify-between items-center gap-4">
        <Input 
          value={title} 
          onChange={(e) => setTitle(e.target.value)} 
          className="text-2xl font-serif font-semibold border-none focus-visible:ring-0 px-0 h-auto bg-transparent"
          placeholder="New note title..."
          autoFocus
        />
        <Button size="sm" onClick={handleSave} disabled={createNote.isPending}>
          {createNote.isPending ? "Creating..." : "Create Note"}
        </Button>
      </div>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>Tag:</span>
        <Input 
          value={tag} 
          onChange={(e) => setTag(e.target.value)} 
          className="h-7 w-32 text-xs bg-transparent" 
          placeholder="e.g. Ideas"
        />
      </div>
      <Textarea 
        value={content} 
        onChange={(e) => setContent(e.target.value)} 
        className="flex-1 resize-none border-none focus-visible:ring-0 px-0 mt-4 leading-relaxed bg-transparent"
        placeholder="Start typing..."
      />
    </div>
  );
}
