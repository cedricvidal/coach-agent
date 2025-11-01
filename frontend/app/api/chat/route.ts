// Backend API: Chat endpoint
import { NextRequest, NextResponse } from 'next/server';
import { eq, and, desc } from 'drizzle-orm';
import { db } from '@/lib/database/db';
import { conversations, messages, coachingGoals, progress, users } from '@/lib/database/schema';
import { coachAgent } from '@/lib/agents/coachAgent';
import { validateAuth0Token, fetchAuth0UserInfo, checkPermission } from '@/lib/api-auth';

// Get or create user
async function getOrCreateUser(auth0Id: string, accessToken: string) {
  const [existingUser] = await db.select().from(users).where(eq(users.auth0Id, auth0Id));

  if (existingUser) {
    return existingUser;
  }

  // Fetch user info from Auth0 if creating new user
  const userInfo = await fetchAuth0UserInfo(accessToken);

  const [newUser] = await db.insert(users).values({
    auth0Id,
    email: userInfo.email,
    name: userInfo.name,
  }).returning();

  return newUser;
}

export async function POST(request: NextRequest) {
  try {
    // Validate authentication
    const authResult = await validateAuth0Token(request);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    // Check permission
    const hasPermission = await checkPermission(authResult.token, 'chat:access');
    if (!hasPermission) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { auth0Id, token } = authResult;
    const user = await getOrCreateUser(auth0Id, token);

    const body = await request.json();
    const { message, conversationId } = body;

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
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
        return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
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

    return NextResponse.json({
      conversationId: conversation.id,
      message: aiMessage,
    });
  } catch (error) {
    console.error('Error processing chat:', error);
    return NextResponse.json({ error: 'Failed to process message' }, { status: 500 });
  }
}
