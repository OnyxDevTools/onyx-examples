// app/api/tasks/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { onyx } from '@onyx.dev/onyx-database';
import { tables, Schema, Task } from '@/onyx/types';

export const runtime = 'nodejs';

type RouteContext = { params: Promise<{ id: string }> };

const db = onyx.init<Schema>();

export async function GET(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  try {
    const task = await db.findById(tables.Task, id);

    if (!task) {
      return new NextResponse('Task not found', { status: 404 });
    }

    return NextResponse.json(task);
  } catch (error) {
    console.error(`Error fetching task ${id}:`, error);
    return new NextResponse('Failed to fetch task', { status: 500 });
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  return updateTask(request, id, true);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  return updateTask(request, id, false);
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  try {
    const existing = await db.findById(tables.Task, id);

    if (!existing) {
      return new NextResponse('Task not found', { status: 404 });
    }

    await db.delete(tables.Task, id);
    return NextResponse.json({ message: 'Task deleted', task: existing });
  } catch (error) {
    console.error(`Error deleting task ${id}:`, error);
    return new NextResponse('Failed to delete task', { status: 500 });
  }
}

async function updateTask(request: NextRequest, id: string, requireAllFields: boolean) {
  try {
    const body = await request.json();
    const existing = await db.findById(tables.Task, id);

    if (!existing) {
      return new NextResponse('Task not found', { status: 404 });
    }

    const updates: Partial<Task> = { id };

    if (body.title !== undefined) updates.title = body.title;
    if (body.description !== undefined) updates.description = body.description;
    if (body.completed !== undefined) updates.completed = body.completed;

    if (body.dueDate !== undefined) {
      const parsedDueDate = new Date(body.dueDate);
      if (Number.isNaN(parsedDueDate.getTime())) {
        return new NextResponse('Invalid dueDate', { status: 400 });
      }
      updates.dueDate = parsedDueDate;
    }

    const merged = { ...existing, ...updates };

    if (requireAllFields && (!merged.title || !merged.dueDate)) {
      return new NextResponse('Missing title or dueDate', { status: 400 });
    }

    const savedTask = await db.save(tables.Task, merged);
    return NextResponse.json({ message: 'Task updated', task: savedTask });
  } catch (error) {
    console.error(`Error updating task ${id}:`, error);
    return new NextResponse('Failed to update task', { status: 500 });
  }
}
