import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { AppLayout } from "@/components/layout/app-layout";

// Pages
import { Dashboard } from "@/pages/dashboard";
import { Tasks } from "@/pages/tasks";
import { Notes } from "@/pages/notes";
import { Skills } from "@/pages/skills";
import { SkillDetail } from "@/pages/skill-detail";
import { Translate } from "@/pages/translate";
import { Assistant } from "@/pages/assistant";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  return (
    <AppLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/tasks" component={Tasks} />
        <Route path="/notes" component={Notes} />
        <Route path="/skills" component={Skills} />
        <Route path="/skills/:id" component={SkillDetail} />
        <Route path="/translate" component={Translate} />
        <Route path="/assistant" component={Assistant} />
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
