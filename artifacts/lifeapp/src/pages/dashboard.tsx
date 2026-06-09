import { useGetDashboard } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CheckSquare, BookOpen, GraduationCap, Clock, MessageSquare } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { format } from "date-fns";

export function Dashboard() {
  const { data: dashboard, isLoading } = useGetDashboard();

  if (isLoading || !dashboard) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="space-y-2">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-5 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
      </div>
    );
  }

  const today = new Date();
  
  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="space-y-3">
        <h1 className="text-4xl">Good morning.</h1>
        <p className="text-muted-foreground text-lg">
          It is {format(today, "EEEE, MMMM do")}. You have <span className="text-primary font-medium">{dashboard.tasks.pending} pending tasks</span> for today.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-secondary/30 border-border/50 hover:border-primary/30 transition-colors">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-sans font-medium text-muted-foreground flex items-center gap-2">
              <CheckSquare className="w-4 h-4" /> Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-serif font-semibold">{dashboard.tasks.completed}<span className="text-muted-foreground text-xl">/{dashboard.tasks.total}</span></div>
            <p className="text-xs text-muted-foreground mt-1">{Math.round(dashboard.tasks.completionRate * 100)}% completion rate</p>
          </CardContent>
        </Card>
        
        <Card className="bg-secondary/30 border-border/50 hover:border-primary/30 transition-colors">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-sans font-medium text-muted-foreground flex items-center gap-2">
              <GraduationCap className="w-4 h-4" /> Skills
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-serif font-semibold">{dashboard.skills.totalCompleted}</div>
            <p className="text-xs text-muted-foreground mt-1">{dashboard.skills.totalInProgress} currently in progress</p>
          </CardContent>
        </Card>

        <Card className="bg-secondary/30 border-border/50 hover:border-primary/30 transition-colors">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-sans font-medium text-muted-foreground flex items-center gap-2">
              <BookOpen className="w-4 h-4" /> Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-serif font-semibold">{dashboard.notes.total}</div>
            <p className="text-xs text-muted-foreground mt-1">{dashboard.notes.recentCount} updated recently</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <h2 className="text-2xl font-serif">Recent Activity</h2>
          <div className="space-y-4 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
            {dashboard.recentActivity.length === 0 ? (
              <div className="text-muted-foreground italic text-sm py-4">No recent activity.</div>
            ) : (
              dashboard.recentActivity.map((activity, i) => (
                <div key={i} className="relative flex items-start gap-4">
                  <div className="w-5 h-5 rounded-full bg-secondary border-2 border-background flex-shrink-0 z-10 mt-1" />
                  <div className="flex-1 bg-secondary/20 p-4 rounded-lg border border-border/50">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-primary uppercase tracking-wider">{activity.type}</span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {new Date(activity.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm">{activity.description}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-2xl font-serif">Assistant</h2>
          <Card className="bg-secondary/40 border-primary/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-10 -mt-10" />
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <MessageSquare className="w-5 h-5 text-primary" /> Ask Anything
              </CardTitle>
              <CardDescription>Your personal AI assistant is ready.</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/assistant" className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 w-full">
                Open Chat
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
