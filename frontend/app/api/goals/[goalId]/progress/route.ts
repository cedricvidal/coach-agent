// Backend API: Goal progress endpoints
import { NextRequest, NextResponse } from 'next/server';
import { eq, and, desc } from 'drizzle-orm';
import { db } from '@/lib/database/db';
import { coachingGoals, progress, users } from '@/lib/database/schema';
import { validateAuth0Token } from '@/lib/api-auth';

// GET progress for a goal
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ goalId: string }> }
) {
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

    const { goalId } = await params;

    // Verify goal belongs to user
    const [goal] = await db
      .select()
      .from(coachingGoals)
      .where(
        and(
          eq(coachingGoals.id, goalId),
          eq(coachingGoals.userId, user.id)
        )
      );

    if (!goal) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    const goalProgress = await db
      .select()
      .from(progress)
      .where(eq(progress.goalId, goalId))
      .orderBy(desc(progress.createdAt));

    return NextResponse.json(goalProgress);
  } catch (error) {
    console.error('Error fetching progress:', error);
    return NextResponse.json({ error: 'Failed to fetch progress' }, { status: 500 });
  }
}

// POST add progress to a goal
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ goalId: string }> }
) {
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

    const { goalId } = await params;
    const body = await request.json();
    const { notes, sentiment, metadata } = body;

    if (!notes) {
      return NextResponse.json({ error: 'Notes are required' }, { status: 400 });
    }

    // Verify goal belongs to user
    const [goal] = await db
      .select()
      .from(coachingGoals)
      .where(
        and(
          eq(coachingGoals.id, goalId),
          eq(coachingGoals.userId, user.id)
        )
      );

    if (!goal) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    const [newProgress] = await db.insert(progress).values({
      goalId,
      notes,
      sentiment,
      metadata,
    }).returning();

    return NextResponse.json(newProgress, { status: 201 });
  } catch (error) {
    console.error('Error adding progress:', error);
    return NextResponse.json({ error: 'Failed to add progress' }, { status: 500 });
  }
}
