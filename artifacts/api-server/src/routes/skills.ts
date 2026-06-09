import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, skillsTable, lessonsTable, lessonProgressTable } from "@workspace/db";
import {
  GetSkillParams,
  MarkLessonCompleteParams,
  MarkLessonCompleteBody,
  ListSkillsResponse,
  GetSkillResponse,
  MarkLessonCompleteResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/skills", async (_req, res): Promise<void> => {
  const skills = await db.select().from(skillsTable);
  const lessons = await db.select().from(lessonsTable);
  const progress = await db.select().from(lessonProgressTable);

  const result = skills.map((skill) => {
    const skillLessons = lessons.filter((l) => l.skillId === skill.id);
    const completedLessons = progress.filter(
      (p) => p.skillId === skill.id && p.isCompleted
    ).length;
    return {
      ...skill,
      totalLessons: skillLessons.length,
      completedLessons,
    };
  });

  res.json(ListSkillsResponse.parse(result));
});

router.get("/skills/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetSkillParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [skill] = await db.select().from(skillsTable).where(eq(skillsTable.id, params.data.id));
  if (!skill) {
    res.status(404).json({ error: "Skill not found" });
    return;
  }

  const lessons = await db
    .select()
    .from(lessonsTable)
    .where(eq(lessonsTable.skillId, params.data.id))
    .orderBy(lessonsTable.order);

  const progress = await db
    .select()
    .from(lessonProgressTable)
    .where(eq(lessonProgressTable.skillId, params.data.id));

  const lessonsWithProgress = lessons.map((lesson) => ({
    ...lesson,
    isCompleted: progress.some((p) => p.lessonId === lesson.id && p.isCompleted),
  }));

  const completedLessons = progress.filter((p) => p.isCompleted).length;

  res.json(
    GetSkillResponse.parse({
      ...skill,
      totalLessons: lessons.length,
      completedLessons,
      lessons: lessonsWithProgress,
    })
  );
});

router.post("/skills/:id/progress", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = MarkLessonCompleteParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = MarkLessonCompleteBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const existing = await db
    .select()
    .from(lessonProgressTable)
    .where(
      and(
        eq(lessonProgressTable.lessonId, parsed.data.lessonId),
        eq(lessonProgressTable.skillId, params.data.id)
      )
    );

  if (existing.length > 0) {
    await db
      .update(lessonProgressTable)
      .set({ isCompleted: parsed.data.isCompleted })
      .where(
        and(
          eq(lessonProgressTable.lessonId, parsed.data.lessonId),
          eq(lessonProgressTable.skillId, params.data.id)
        )
      );
  } else {
    await db.insert(lessonProgressTable).values({
      lessonId: parsed.data.lessonId,
      skillId: params.data.id,
      isCompleted: parsed.data.isCompleted,
    });
  }

  res.json(
    MarkLessonCompleteResponse.parse({
      lessonId: parsed.data.lessonId,
      skillId: params.data.id,
      isCompleted: parsed.data.isCompleted,
    })
  );
});

export default router;
