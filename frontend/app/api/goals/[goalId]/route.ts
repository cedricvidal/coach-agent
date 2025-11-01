// Backend API: Individual goal operations
import { NextRequest, NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { db } from '@/lib/database/db';
import { coachingGoals, users } from '@/lib/database/schema';
import { validateAuth0Token } from '@/lib/api-auth';

// PUT update a goal
export async function PUT(
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
    const { title, description, status, targetDate } = body;

    // Verify goal belongs to user
    const [existingGoal] = await db
      .select()
      .from(coachingGoals)
      .where(
        and(
          eq(coachingGoals.id, goalId),
          eq(coachingGoals.userId, user.id)
        )
      );

    if (!existingGoal) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    const [updatedGoal] = await db
      .update(coachingGoals)
      .set({
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(status && { status }),
        ...(targetDate !== undefined && { targetDate: targetDate ? new Date(targetDate) : null }),
        updatedAt: new Date(),
      })
      .where(eq(coachingGoals.id, goalId))
      .returning();

    return NextResponse.json(updatedGoal);
  } catch (error) {
    console.error('Error updating goal:', error);
    return NextResponse.json({ error: 'Failed to update goal' }, { status: 500 });
  }
}
