import { Router } from "express";
import {
  createTask,
  deleteTask,
  getTaskById,
  listTasks,
  updateTask,
} from "../controllers/taskController";

const router = Router();

router.get("/", listTasks);
router.get("/:id", getTaskById);
router.post("/", createTask);
router.put("/:id", updateTask);
router.patch("/:id", updateTask);
router.delete("/:id", deleteTask);

export default router;
