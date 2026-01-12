import { randomUUID } from "crypto";
import { onyx } from "@onyx.dev/onyx-database";
import type { IOnyxDatabase } from "@onyx.dev/onyx-database";
import type { CreateTaskInput, Task, UpdateTaskInput } from "../types/task";

export interface TaskRepository {
  list(): Promise<Task[]>;
  getById(id: string): Promise<Task | undefined>;
  create(input: CreateTaskInput): Promise<Task>;
  update(id: string, input: UpdateTaskInput): Promise<Task | undefined>;
  delete(id: string): Promise<boolean>;
}

type TaskSchema = {
  Task: Task;
};

let db: IOnyxDatabase<TaskSchema> | null = null;

const getDb = (): IOnyxDatabase<TaskSchema> => {
  if (!db) {
    db = onyx.init<TaskSchema>();
  }
  return db;
};

export class OnyxTaskRepository implements TaskRepository {
  private readonly tableName = "Task";

  async list(): Promise<Task[]> {
    const results = await getDb().from(this.tableName).list();
    return [...results] as Task[];
  }

  async getById(id: string): Promise<Task | undefined> {
    const record = await getDb().findById(this.tableName, id);
    return (record as Task | null) ?? undefined;
  }

  async create(input: CreateTaskInput): Promise<Task> {
    const now = new Date().toISOString();
    const task: Task = {
      id: randomUUID(),
      title: input.title,
      status: "pending",
      createdAt: now,
      updatedAt: now,
      ...(input.description !== undefined
        ? { description: input.description }
        : {}),
      ...(input.dueDate !== undefined ? { dueDate: input.dueDate } : {}),
    };

    await getDb().save(this.tableName, task);
    return task;
  }

  async update(id: string, input: UpdateTaskInput): Promise<Task | undefined> {
    const existing = await this.getById(id);
    if (!existing) {
      return undefined;
    }

    const updated: Task = {
      ...existing,
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.dueDate !== undefined ? { dueDate: input.dueDate } : {}),
      updatedAt: new Date().toISOString(),
    };

    await getDb().save(this.tableName, updated);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    return getDb().delete(this.tableName, id);
  }
}

export const taskRepository: TaskRepository = new OnyxTaskRepository();
