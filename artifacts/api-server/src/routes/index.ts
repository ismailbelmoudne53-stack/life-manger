import { Router, type IRouter } from "express";
import healthRouter from "./health";
import tasksRouter from "./tasks";
import notesRouter from "./notes";
import skillsRouter from "./skills";
import chatRouter from "./chat";
import translateRouter from "./translate";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(tasksRouter);
router.use(notesRouter);
router.use(skillsRouter);
router.use(chatRouter);
router.use(translateRouter);
router.use(dashboardRouter);

export default router;
