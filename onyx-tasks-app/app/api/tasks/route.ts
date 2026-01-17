// app/api/tasks/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { asc, onyx } from '@onyx.dev/onyx-database';
import { tables, Schema } from '@/onyx/types';

export const runtime = 'nodejs';

const db = onyx.init<Schema>(); // Initialize Onyx with the defined schema for strong typing

export async function GET(request: NextRequest) {
  try {
    // Query Onyx for all tasks, perhaps with some basic ordering by due date
    const tasks = await db.from(tables.Task).orderBy(asc('dueDate')).list();
    return NextResponse.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return new NextResponse('Failed to fetch tasks', { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, dueDate } = body;
    
    // Basic validation (ensure required fields)
    if (!title || !dueDate) {
      return new NextResponse('Missing title or dueDate', { status: 400 });
    }

    // Create a new task object, omitting the id since it will be gennerated in onyx automatically
    const newTask = {
      title,
      description: description || '',
      dueDate,
      completed: false
    };

    const savedTask = await db.save(tables.Task, newTask);
    return NextResponse.json({ message: 'Task created', task: savedTask });
  } catch (error) {
    console.error('Error creating task:', error);
    return new NextResponse('Failed to create task', { status: 500 });
  }
}
