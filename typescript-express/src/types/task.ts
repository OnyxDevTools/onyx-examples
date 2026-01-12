import type { Task as OnyxTask } from "../onyx/types";

export type Task = OnyxTask & {
  id: string;
  title: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export interface CreateTaskInput {
  title: string;
  description?: string;
  dueDate?: string;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: string;
  dueDate?: string;
}
