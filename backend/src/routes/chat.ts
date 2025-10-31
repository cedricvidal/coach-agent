import { Router } from 'express';
import { eq, and, desc } from 'drizzle-orm';
import { db } from '../database/db.js';
import { conversations, messages, coachingGoals, progress, users } from '../database/schema.js';
import { coachAgent } from '../agents/coachAgent.js';
import { AuthRequest, requireAuth } from '../middleware/auth.js';

const router = Router();

// Get or create user
async function getOrCreateUser(auth0Id: string, email: string, name?: string) {
  const [existingUser] = await db.select().from(users).where(eq(users.auth0Id, auth0Id));

  if (existingUser) {
    return existingUser;
  }

  const [newUser] = await db.insert(users).values({
    auth0Id,
    email,
    name,
  }).returning();

  return newUser;
}

// Get all conversations for a user
router.get('/conversations', requireAuth, async (req: AuthRequest, res) => {
  try {
    const auth0Id = req.auth!.payload.sub;
    const user = await getOrCreateUser(auth0Id, req.auth!.payload.email);

    const userConversations = await db
      .select()
      .from(conversations)
      .where(eq(conversations.userId, user.id))
      .orderBy(desc(conversations.updatedAt));

    res.json(userConversations);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

// Get messages for a conversation
router.get('/conversations/:conversationId/messages', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { conversationId } = req.params;
    const auth0Id = req.auth!.payload.sub;
    const user = await getOrCreateUser(auth0Id, req.auth!.payload.email);

    // Verify conversation belongs to user
    const [conversation] = await db
      .select()
      .from(conversations)
      .where(
        and(
          eq(conversations.id, conversationId),
          eq(conversations.userId, user.id)
        )
      );

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const conversationMessages = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(messages.createdAt);

    res.json(conversationMessages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Send a message and get AI response
router.post('/chat', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { message, conversationId } = req.body;
    const auth0Id = req.auth!.payload.sub;
    const user = await getOrCreateUser(auth0Id, req.auth!.payload.email);

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    let conversation;

    // Create new conversation or use existing
    if (conversationId) {
      [conversation] = await db
        .select()
        .from(conversations)
        .where(
          and(
            eq(conversations.id, conversationId),
            eq(conversations.userId, user.id)
          )
        );

      if (!conversation) {
        return res.status(404).json({ error: 'Conversation not found' });
      }
    } else {
      [conversation] = await db.insert(conversations).values({
        userId: user.id,
        title: message.substring(0, 50),
      }).returning();
    }

    // Save user message
    await db.insert(messages).values({
      conversationId: conversation.id,
      role: 'user',
      content: message,
    });

    // Get conversation history
    const history = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversation.id))
      .orderBy(messages.createdAt);

    // Get user context (goals and progress)
    const userGoals = await db
      .select()
      .from(coachingGoals)
      .where(
        and(
          eq(coachingGoals.userId, user.id),
          eq(coachingGoals.status, 'active')
        )
      );

    const recentProgress = await db
      .select({
        notes: progress.notes,
        createdAt: progress.createdAt,
      })
      .from(progress)
      .innerJoin(coachingGoals, eq(progress.goalId, coachingGoals.id))
      .where(eq(coachingGoals.userId, user.id))
      .orderBy(desc(progress.createdAt))
      .limit(5);

    // Convert history to LangChain message format
    const chatHistory = coachAgent.convertMessageHistory(
      history.slice(0, -1).map((m) => ({ role: m.role, content: m.content }))
    );

    // Get AI response with context
    const aiResponse = await coachAgent.chatWithContext(
      message,
      chatHistory,
      {
        goals: userGoals,
        recentProgress,
      }
    );

    // Save AI response
    const [aiMessage] = await db.insert(messages).values({
      conversationId: conversation.id,
      role: 'assistant',
      content: aiResponse,
    }).returning();

    res.json({
      conversationId: conversation.id,
      message: aiMessage,
    });
  } catch (error) {
    console.error('Error processing chat:', error);
    res.status(500).json({ error: 'Failed to process message' });
  }
});

export default router;
