import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../middleware/errorHandler";
import { taskService } from "../services/taskService";

const requireTaskId = (params: Request["params"]): string => {
  const id = params.id;
  if (!id || Array.isArray(id)) {
    throw new ApiError(400, "Task id is required");
  }

  return id;
};

export const listTasks = async (
  _req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const tasks = await taskService.listTasks();
    res.json({ data: tasks });
  } catch (error) {
    next(error);
  }
};

export const getTaskById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const taskId = requireTaskId(req.params);
    const task = await taskService.getTask(taskId);
    res.json({ data: task });
  } catch (error) {
    next(error);
  }
};

export const createTask = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const task = await taskService.createTask(req.body);
    res.status(201).json({ data: task });
  } catch (error) {
    next(error);
  }
};

export const updateTask = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const taskId = requireTaskId(req.params);
    const task = await taskService.updateTask(taskId, req.body);
    res.json({ data: task });
  } catch (error) {
    next(error);
  }
};

export const deleteTask = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const taskId = requireTaskId(req.params);
    await taskService.deleteTask(taskId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
