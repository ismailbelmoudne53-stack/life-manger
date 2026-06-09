import { Router, type IRouter } from "express";
import { desc } from "drizzle-orm";
import { db, tasksTable, notesTable, skillsTable, lessonsTable, lessonProgressTable, chatMessagesTable } from "@workspace/db";
import { GetDashboardResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/dashboard", async (_req, res): Promise<void> => {
  const [allTasks, allNotes, allSkills, allLessons, allProgress] = await Promise.all([
    db.select().from(tasksTable),
    db.select().from(notesTable).orderBy(desc(notesTable.updatedAt)).limit(5),
    db.select().from(skillsTable),
    db.select().from(lessonsTable),
    db.select().from(lessonProgressTable),
  ]);

  const totalTasks = allTasks.length;
  const completedTasks = allTasks.filter((t) => t.status === "completed").length;
  const pendingTasks = totalTasks - completedTasks;
  const highPriority = allTasks.filter((t) => t.priority === "high" && t.status === "pending").length;
  const completionRate = totalTasks > 0 ? completedTasks / totalTasks : 0;

  const skillsWithProgress = allSkills.map((skill) => {
    const skillLessons = allLessons.filter((l) => l.skillId === skill.id).length;
    const completedCount = allProgress.filter((p) => p.skillId === skill.id && p.isCompleted).length;
    return { totalLessons: skillLessons, completedLessons: completedCount };
  });

  const totalCompleted = skillsWithProgress.filter((s) => s.totalLessons > 0 && s.completedLessons === s.totalLessons).length;
  const totalInProgress = skillsWithProgress.filter((s) => s.completedLessons > 0 && s.completedLessons < s.totalLessons).length;

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const recentNotes = allNotes.filter((n) => n.createdAt > weekAgo).length;

  const recentTasks = allTasks
    .filter((t) => t.completedAt && t.completedAt > weekAgo)
    .slice(0, 3)
    .map((t) => ({
      type: "task",
      description: `Completed: ${t.title}`,
      timestamp: t.completedAt!.toISOString(),
    }));

  const recentNoteActivity = allNotes.slice(0, 2).map((n) => ({
    type: "note",
    description: `Note updated: ${n.title}`,
    timestamp: n.updatedAt.toISOString(),
  }));

  const recentProgressActivity = allProgress
    .filter((p) => p.isCompleted)
    .slice(0, 2)
    .map((p) => ({
      type: "skill",
      description: `Lesson completed in skill #${p.skillId}`,
      timestamp: new Date().toISOString(),
    }));

  const recentActivity = [...recentTasks, ...recentNoteActivity, ...recentProgressActivity]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 6);

  res.json(
    GetDashboardResponse.parse({
      tasks: {
        total: totalTasks,
        completed: completedTasks,
        pending: pendingTasks,
        highPriority,
        completionRate,
      },
      skills: {
        totalSkills: allSkills.length,
        totalCompleted,
        totalInProgress,
      },
      notes: {
        total: (await db.select().from(notesTable)).length,
        recentCount: recentNotes,
      },
      recentActivity,
    })
  );
});

export default router;
