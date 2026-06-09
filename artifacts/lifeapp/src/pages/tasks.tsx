import { useState } from "react";
import { 
  useListTasks, getListTasksQueryKey,
  useCreateTask, useUpdateTask, useDeleteTask 
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Calendar, Tag, CheckSquare } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export function Tasks() {
  const [filter, setFilter] = useState<"all" | "pending" | "completed">("all");
  const { data: tasks, isLoading } = useListTasks(filter === "all" ? {} : { status: filter });
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  const handleToggle = (id: number, currentStatus: "pending" | "completed") => {
    const newStatus = currentStatus === "pending" ? "completed" : "pending";
    updateTask.mutate({ id, data: { status: newStatus } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListTasksQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListTasksQueryKey({ status: filter }) });
      }
    });
  };

  const handleDelete = (id: number) => {
    deleteTask.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListTasksQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListTasksQueryKey({ status: filter }) });
        toast({ title: "Task deleted" });
      }
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 h-full flex flex-col pb-8">
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-3xl font-serif">Tasks</h1>
          <p className="text-muted-foreground mt-1">Manage your daily priorities.</p>
        </div>
        <CreateTaskDialog />
      </div>

      <div className="flex gap-2 mb-6 flex-shrink-0">
        <Button 
          variant={filter === "all" ? "default" : "secondary"} 
          onClick={() => setFilter("all")}
          size="sm"
        >
          All
        </Button>
        <Button 
          variant={filter === "pending" ? "default" : "secondary"} 
          onClick={() => setFilter("pending")}
          size="sm"
        >
          Pending
        </Button>
        <Button 
          variant={filter === "completed" ? "default" : "secondary"} 
          onClick={() => setFilter("completed")}
          size="sm"
        >
          Completed
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 pb-10">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : tasks?.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-12 border border-dashed rounded-lg bg-secondary/20">
            <CheckSquare className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-lg font-medium">No tasks found</h3>
            <p className="text-sm text-muted-foreground max-w-sm mt-1">
              You don't have any tasks matching this filter. Create a new task to get started.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {tasks?.map((task) => (
              <div 
                key={task.id} 
                className={`flex items-start gap-4 p-4 rounded-lg border transition-all ${
                  task.status === "completed" 
                    ? "bg-secondary/10 border-border/40 opacity-70" 
                    : "bg-card border-border hover:border-primary/50"
                }`}
              >
                <Checkbox 
                  checked={task.status === "completed"}
                  onCheckedChange={() => handleToggle(task.id, task.status)}
                  className="mt-1"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <h3 className={`font-medium text-base truncate ${task.status === "completed" ? "line-through text-muted-foreground" : ""}`}>
                      {task.title}
                    </h3>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded-sm ${
                        task.priority === "high" ? "bg-destructive/20 text-destructive-foreground" :
                        task.priority === "medium" ? "bg-primary/20 text-primary" :
                        "bg-secondary text-muted-foreground"
                      }`}>
                        {task.priority}
                      </span>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(task.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  {task.description && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{task.description}</p>
                  )}
                  <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                    {task.dueDate && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {format(new Date(task.dueDate), "MMM d, yyyy")}
                      </span>
                    )}
                    {task.category && (
                      <span className="flex items-center gap-1">
                        <Tag className="w-3 h-3" /> {task.category}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CreateTaskDialog() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"low"|"medium"|"high">("medium");
  const [category, setCategory] = useState("");
  const [dueDate, setDueDate] = useState("");
  
  const createTask = useCreateTask();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    createTask.mutate({
      data: {
        title,
        description: description || undefined,
        priority,
        category: category || undefined,
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
      }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListTasksQueryKey() });
        setOpen(false);
        setTitle("");
        setDescription("");
        setPriority("medium");
        setCategory("");
        setDueDate("");
        toast({ title: "Task created" });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" /> New Task
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create Task</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What needs to be done?" autoFocus />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Add some details..." className="resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select value={priority} onValueChange={(v: any) => setPriority(v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category (optional)</Label>
                <Input id="category" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. Work, Home" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date (optional)</Label>
              <Input id="dueDate" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={!title.trim() || createTask.isPending}>
              {createTask.isPending ? "Saving..." : "Create Task"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
