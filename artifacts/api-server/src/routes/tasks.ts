import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, tasksTable } from "@workspace/db";
import {
  ListTasksQueryParams,
  CreateTaskBody,
  GetTaskParams,
  GetTaskResponse,
  UpdateTaskParams,
  UpdateTaskBody,
  UpdateTaskResponse,
  DeleteTaskParams,
  ListTasksResponse,
  GetTaskStatsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/tasks/stats", async (_req, res): Promise<void> => {
  const all = await db.select().from(tasksTable);
  const total = all.length;
  const completed = all.filter((t) => t.status === "completed").length;
  const pending = total - completed;
  const highPriority = all.filter((t) => t.priority === "high" && t.status === "pending").length;
  const completionRate = total > 0 ? completed / total : 0;
  res.json(GetTaskStatsResponse.parse({ total, completed, pending, highPriority, completionRate }));
});

router.get("/tasks", async (req, res): Promise<void> => {
  const params = ListTasksQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  let tasks = await db.select().from(tasksTable).orderBy(tasksTable.createdAt);

  if (params.data.status && params.data.status !== "all") {
    tasks = tasks.filter((t) => t.status === params.data.status);
  }
  if (params.data.priority) {
    tasks = tasks.filter((t) => t.priority === params.data.priority);
  }

  res.json(ListTasksResponse.parse(tasks.map(formatTask)));
});

router.post("/tasks", async (req, res): Promise<void> => {
  const parsed = CreateTaskBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [task] = await db
    .insert(tasksTable)
    .values({
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      priority: parsed.data.priority ?? "medium",
      dueDate: parsed.data.dueDate ?? null,
      category: parsed.data.category ?? null,
    })
    .returning();

  res.status(201).json(GetTaskResponse.parse(formatTask(task)));
});

router.get("/tasks/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetTaskParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [task] = await db.select().from(tasksTable).where(eq(tasksTable.id, params.data.id));
  if (!task) {
    res.status(404).json({ error: "Task not found" });
    return;
  }

  res.json(GetTaskResponse.parse(formatTask(task)));
});

router.patch("/tasks/:id", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdateTaskParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateTaskBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.status === "completed") {
    updateData.completedAt = new Date();
  } else if (parsed.data.status === "pending") {
    updateData.completedAt = null;
  }

  const [task] = await db
    .update(tasksTable)
    .set(updateData)
    .where(eq(tasksTable.id, params.data.id))
    .returning();

  if (!task) {
    res.status(404).json({ error: "Task not found" });
    return;
  }

  res.json(UpdateTaskResponse.parse(formatTask(task)));
});

router.delete("/tasks/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteTaskParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [task] = await db.delete(tasksTable).where(eq(tasksTable.id, params.data.id)).returning();
  if (!task) {
    res.status(404).json({ error: "Task not found" });
    return;
  }

  res.sendStatus(204);
});

function formatTask(task: typeof tasksTable.$inferSelect) {
  return {
    ...task,
    createdAt: task.createdAt.toISOString(),
    completedAt: task.completedAt ? task.completedAt.toISOString() : null,
  };
}

export default router;
