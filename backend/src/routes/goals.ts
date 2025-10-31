import { Router } from 'express';
import { eq, and, desc } from 'drizzle-orm';
import { db } from '../database/db.js';
import { coachingGoals, progress, users } from '../database/schema.js';
import { AuthRequest, requireAuth } from '../middleware/auth.js';

const router = Router();

// Get all goals for a user
router.get('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const auth0Id = req.auth!.payload.sub;
    const [user] = await db.select().from(users).where(eq(users.auth0Id, auth0Id));

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const goals = await db
      .select()
      .from(coachingGoals)
      .where(eq(coachingGoals.userId, user.id))
      .orderBy(desc(coachingGoals.createdAt));

    res.json(goals);
  } catch (error) {
    console.error('Error fetching goals:', error);
    res.status(500).json({ error: 'Failed to fetch goals' });
  }
});

// Create a new goal
router.post('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { title, description, targetDate } = req.body;
    const auth0Id = req.auth!.payload.sub;
    const [user] = await db.select().from(users).where(eq(users.auth0Id, auth0Id));

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const [newGoal] = await db.insert(coachingGoals).values({
      userId: user.id,
      title,
      description,
      status: 'active',
      targetDate: targetDate ? new Date(targetDate) : null,
    }).returning();

    res.status(201).json(newGoal);
  } catch (error) {
    console.error('Error creating goal:', error);
    res.status(500).json({ error: 'Failed to create goal' });
  }
});

// Update a goal
router.put('/:goalId', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { goalId } = req.params;
    const { title, description, status, targetDate } = req.body;
    const auth0Id = req.auth!.payload.sub;
    const [user] = await db.select().from(users).where(eq(users.auth0Id, auth0Id));

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

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
      return res.status(404).json({ error: 'Goal not found' });
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

    res.json(updatedGoal);
  } catch (error) {
    console.error('Error updating goal:', error);
    res.status(500).json({ error: 'Failed to update goal' });
  }
});

// Add progress to a goal
router.post('/:goalId/progress', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { goalId } = req.params;
    const { notes, sentiment, metadata } = req.body;
    const auth0Id = req.auth!.payload.sub;
    const [user] = await db.select().from(users).where(eq(users.auth0Id, auth0Id));

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!notes) {
      return res.status(400).json({ error: 'Notes are required' });
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
      return res.status(404).json({ error: 'Goal not found' });
    }

    const [newProgress] = await db.insert(progress).values({
      goalId,
      notes,
      sentiment,
      metadata,
    }).returning();

    res.status(201).json(newProgress);
  } catch (error) {
    console.error('Error adding progress:', error);
    res.status(500).json({ error: 'Failed to add progress' });
  }
});

// Get progress for a goal
router.get('/:goalId/progress', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { goalId } = req.params;
    const auth0Id = req.auth!.payload.sub;
    const [user] = await db.select().from(users).where(eq(users.auth0Id, auth0Id));

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
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
      return res.status(404).json({ error: 'Goal not found' });
    }

    const goalProgress = await db
      .select()
      .from(progress)
      .where(eq(progress.goalId, goalId))
      .orderBy(desc(progress.createdAt));

    res.json(goalProgress);
  } catch (error) {
    console.error('Error fetching progress:', error);
    res.status(500).json({ error: 'Failed to fetch progress' });
  }
});

export default router;
