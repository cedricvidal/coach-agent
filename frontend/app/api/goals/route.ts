// Backend API: Goals endpoints
import { NextRequest, NextResponse } from 'next/server';
import { eq, desc } from 'drizzle-orm';
import { db } from '@/lib/database/db';
import { coachingGoals, users } from '@/lib/database/schema';
import { validateAuth0Token } from '@/lib/api-auth';

// GET all goals for a user
export async function GET(request: NextRequest) {
  try {
    const authResult = await validateAuth0Token(request);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { auth0Id } = authResult;
    const [user] = await db.select().from(users).where(eq(users.auth0Id, auth0Id));

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const goals = await db
      .select()
      .from(coachingGoals)
      .where(eq(coachingGoals.userId, user.id))
      .orderBy(desc(coachingGoals.createdAt));

    return NextResponse.json(goals);
  } catch (error) {
    console.error('Error fetching goals:', error);
    return NextResponse.json({ error: 'Failed to fetch goals' }, { status: 500 });
  }
}

// POST create a new goal
export async function POST(request: NextRequest) {
  try {
    const authResult = await validateAuth0Token(request);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { auth0Id } = authResult;
    const [user] = await db.select().from(users).where(eq(users.auth0Id, auth0Id));

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const { title, description, targetDate } = body;

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const [newGoal] = await db.insert(coachingGoals).values({
      userId: user.id,
      title,
      description,
      status: 'active',
      targetDate: targetDate ? new Date(targetDate) : null,
    }).returning();

    return NextResponse.json(newGoal, { status: 201 });
  } catch (error) {
    console.error('Error creating goal:', error);
    return NextResponse.json({ error: 'Failed to create goal' }, { status: 500 });
  }
}
