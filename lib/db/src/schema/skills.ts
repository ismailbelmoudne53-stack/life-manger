import { pgTable, text, serial, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const skillsTable = pgTable("skills", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  icon: text("icon").notNull().default("BookOpen"),
});

export const lessonsTable = pgTable("lessons", {
  id: serial("id").primaryKey(),
  skillId: integer("skill_id").notNull().references(() => skillsTable.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  content: text("content").notNull(),
  order: integer("order").notNull().default(0),
  duration: text("duration"),
});

export const lessonProgressTable = pgTable("lesson_progress", {
  id: serial("id").primaryKey(),
  lessonId: integer("lesson_id").notNull().references(() => lessonsTable.id, { onDelete: "cascade" }),
  skillId: integer("skill_id").notNull().references(() => skillsTable.id, { onDelete: "cascade" }),
  isCompleted: boolean("is_completed").notNull().default(false),
});

export const insertSkillSchema = createInsertSchema(skillsTable).omit({ id: true });
export const insertLessonSchema = createInsertSchema(lessonsTable).omit({ id: true });
export const insertLessonProgressSchema = createInsertSchema(lessonProgressTable).omit({ id: true });

export type InsertSkill = z.infer<typeof insertSkillSchema>;
export type Skill = typeof skillsTable.$inferSelect;
export type Lesson = typeof lessonsTable.$inferSelect;
export type LessonProgress = typeof lessonProgressTable.$inferSelect;
