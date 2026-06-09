import { useGetSkill, getGetSkillQueryKey, useMarkLessonComplete } from "@workspace/api-client-react";
import { useRoute } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Circle, Clock, ChevronLeft } from "lucide-react";
import { Link } from "wouter";
import { Progress } from "@/components/ui/progress";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

export function SkillDetail() {
  const [, params] = useRoute("/skills/:id");
  const id = Number(params?.id);
  
  const { data: skill, isLoading } = useGetSkill(id, { 
    query: { enabled: !!id, queryKey: getGetSkillQueryKey(id) } 
  });
  
  const markComplete = useMarkLessonComplete();
  const queryClient = useQueryClient();

  if (isLoading || !skill) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  const progress = skill.totalLessons > 0 ? (skill.completedLessons / skill.totalLessons) * 100 : 0;

  const handleToggle = (lessonId: number, isCompleted: boolean) => {
    markComplete.mutate({ data: { lessonId, isCompleted } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetSkillQueryKey(id) });
      }
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-10 animate-in fade-in duration-500 pb-12">
      <div className="space-y-6">
        <Link href="/skills" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="w-4 h-4 mr-1" /> Back to Skills
        </Link>
        
        <div>
          <h1 className="text-4xl font-serif mb-3">{skill.name}</h1>
          <p className="text-lg text-muted-foreground">{skill.description}</p>
        </div>

        <div className="bg-secondary/30 p-6 rounded-xl border border-border">
          <div className="flex justify-between items-end mb-4">
            <div>
              <div className="text-3xl font-serif font-medium">{Math.round(progress)}%</div>
              <div className="text-sm text-muted-foreground mt-1">Completion</div>
            </div>
            <div className="text-right">
              <div className="font-medium">{skill.completedLessons} / {skill.totalLessons}</div>
              <div className="text-sm text-muted-foreground mt-1">Lessons completed</div>
            </div>
          </div>
          <Progress value={progress} className="h-3" />
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-serif">Syllabus</h2>
        
        <Accordion type="single" collapsible className="w-full">
          {skill.lessons?.sort((a, b) => a.order - b.order).map((lesson) => (
            <AccordionItem key={lesson.id} value={lesson.id.toString()} className="border-border px-1">
              <AccordionTrigger className="hover:no-underline py-4">
                <div className="flex items-center gap-4 text-left">
                  <div className="flex-shrink-0 mt-0.5">
                    {lesson.isCompleted ? (
                      <CheckCircle2 className="w-6 h-6 text-primary" />
                    ) : (
                      <Circle className="w-6 h-6 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <div className={`font-medium text-lg ${lesson.isCompleted ? "text-muted-foreground" : ""}`}>
                      {lesson.order}. {lesson.title}
                    </div>
                    {lesson.duration && (
                      <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                        <Clock className="w-3 h-3" /> {lesson.duration}
                      </div>
                    )}
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-2 pb-6 pl-10">
                <div className="prose prose-sm dark:prose-invert max-w-none mb-6">
                  {lesson.content.split('\n').map((para, i) => (
                    <p key={i}>{para}</p>
                  ))}
                </div>
                <Button 
                  variant={lesson.isCompleted ? "outline" : "default"}
                  onClick={() => handleToggle(lesson.id, !lesson.isCompleted)}
                  disabled={markComplete.isPending}
                >
                  {lesson.isCompleted ? "Mark as Incomplete" : "Mark as Completed"}
                </Button>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
}
