import { ApiError } from "../middleware/errorHandler";
import { TaskRepository, taskRepository } from "../repositories/taskRepository";
import type { CreateTaskInput, Task, UpdateTaskInput } from "../types/task";

type TaskStatus = "pending" | "in_progress" | "completed";
const allowedStatuses: TaskStatus[] = ["pending", "in_progress", "completed"];

export class TaskService {
  constructor(private readonly repository: TaskRepository) {}

  async listTasks(): Promise<Task[]> {
    return this.repository.list();
  }

  async getTask(id: string): Promise<Task> {
    const task = await this.repository.getById(id);
    if (!task) {
      throw new ApiError(404, `Task with id ${id} not found`);
    }
    return task;
  }

  async createTask(input: CreateTaskInput): Promise<Task> {
    this.validateTitle(input.title);
    if (input.dueDate) {
      this.validateDate(input.dueDate);
    }

    return this.repository.create(input);
  }

  async updateTask(id: string, input: UpdateTaskInput): Promise<Task> {
    if (!input.title && !input.description && !input.status && !input.dueDate) {
      throw new ApiError(400, "Update payload must include at least one field");
    }

    if (input.title) {
      this.validateTitle(input.title);
    }

    if (input.status) {
      this.validateStatus(input.status);
    }

    if (input.dueDate) {
      this.validateDate(input.dueDate);
    }

    const updated = await this.repository.update(id, input);
    if (!updated) {
      throw new ApiError(404, `Task with id ${id} not found`);
    }

    return updated;
  }

  async deleteTask(id: string): Promise<void> {
    const deleted = await this.repository.delete(id);
    if (!deleted) {
      throw new ApiError(404, `Task with id ${id} not found`);
    }
  }

  private validateTitle(title: string) {
    if (!title.trim()) {
      throw new ApiError(400, "Title is required");
    }
  }

  private validateStatus(status: string): asserts status is TaskStatus {
    if (!allowedStatuses.includes(status as TaskStatus)) {
      throw new ApiError(400, `Status must be one of: ${allowedStatuses.join(", ")}`);
    }
  }

  private validateDate(value: string) {
    const timestamp = Date.parse(value);
    if (Number.isNaN(timestamp)) {
      throw new ApiError(400, "Invalid date format. Use ISO 8601 (e.g. 2024-01-31T12:00:00Z)");
    }
  }
}

export const taskService = new TaskService(taskRepository);
