import { Link, useLocation } from "wouter";
import { Home, CheckSquare, BookOpen, MessageSquare, GraduationCap, Languages } from "lucide-react";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

const navItems = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/skills", label: "Skills", icon: GraduationCap },
  { href: "/translate", label: "Translate", icon: Languages },
  { href: "/assistant", label: "Assistant", icon: MessageSquare },
  { href: "/notes", label: "Notes", icon: BookOpen },
];

export function AppLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card flex-shrink-0 hidden md:flex flex-col">
        <div className="p-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
              <span className="font-serif font-bold text-primary-foreground text-xl">L</span>
            </div>
            <span className="font-serif font-semibold text-xl tracking-tight">LifeApp</span>
          </Link>
        </div>
        <nav className="flex-1 px-4 py-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors text-sm font-medium",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-border">
          <div className="px-3 py-2 rounded-md bg-secondary/50 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-medium">
              U
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium">User</span>
              <span className="text-xs text-muted-foreground">Offline Capable</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <div className="flex-1 overflow-auto p-6 md:p-10">
          <div className="max-w-5xl mx-auto w-full h-full">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
