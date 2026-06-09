import { useListSkills } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { GraduationCap, Code, Globe, PenTool, Dumbbell } from "lucide-react";

const iconMap: Record<string, any> = {
  "Code": Code,
  "Globe": Globe,
  "PenTool": PenTool,
  "Dumbbell": Dumbbell,
  "GraduationCap": GraduationCap
};

export function Skills() {
  const { data: skills, isLoading } = useListSkills();

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-serif">Skills</h1>
        <p className="text-muted-foreground mt-1">Develop yourself, step by step.</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array(6).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      ) : skills?.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No skills found. Let's add some to the database.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {skills?.map((skill) => {
            const Icon = iconMap[skill.icon] || GraduationCap;
            const progress = skill.totalLessons > 0 
              ? (skill.completedLessons / skill.totalLessons) * 100 
              : 0;

            return (
              <Link key={skill.id} href={`/skills/${skill.id}`}>
                <Card className="h-full hover:border-primary/50 transition-colors cursor-pointer bg-card group relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Icon className="w-24 h-24" />
                  </div>
                  <CardHeader>
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-2">
                      <Icon className="w-5 h-5" />
                    </div>
                    <CardTitle className="text-xl">{skill.name}</CardTitle>
                    <CardDescription className="line-clamp-2">{skill.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">{skill.completedLessons} / {skill.totalLessons} lessons</span>
                      <span className="font-medium text-primary">{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
