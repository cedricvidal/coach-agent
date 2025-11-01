// Backend API: Streaming chat endpoint with Server-Sent Events
import { NextRequest } from 'next/server';
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
      return new Response(JSON.stringify({ error: authResult.error }), {
        status: authResult.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check permission
    const hasPermission = await checkPermission(authResult.token, 'chat:access');
    if (!hasPermission) {
      return new Response(JSON.stringify({ error: 'Insufficient permissions' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { auth0Id, token } = authResult;
    const user = await getOrCreateUser(auth0Id, token);

    const body = await request.json();
    const { message, conversationId } = body;

    if (!message) {
      return new Response(JSON.stringify({ error: 'Message is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
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
        return new Response(JSON.stringify({ error: 'Conversation not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
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

    // Create callbacks for goal management tools
    const goalCallbacks = {
      createGoal: async (title: string, description?: string, targetDate?: string) => {
        const [newGoal] = await db.insert(coachingGoals).values({
          userId: user.id,
          title,
          description,
          targetDate: targetDate ? new Date(targetDate) : undefined,
          status: 'active',
        }).returning();
        return newGoal;
      },
      updateGoal: async (goalId: string, updates: { title?: string; description?: string; status?: string; targetDate?: string }) => {
        const updateData: Record<string, unknown> = {};
        if (updates.title) updateData.title = updates.title;
        if (updates.description) updateData.description = updates.description;
        if (updates.status) updateData.status = updates.status;
        if (updates.targetDate) updateData.targetDate = new Date(updates.targetDate);

        const [updatedGoal] = await db.update(coachingGoals)
          .set(updateData)
          .where(and(
            eq(coachingGoals.id, goalId),
            eq(coachingGoals.userId, user.id)
          ))
          .returning();
        return updatedGoal;
      },
      addProgress: async (goalId: string, notes: string, sentiment?: string) => {
        await db.insert(progress).values({
          goalId,
          notes,
          sentiment,
        });
        return { success: true };
      },
      listGoals: async () => {
        const goals = await db
          .select()
          .from(coachingGoals)
          .where(eq(coachingGoals.userId, user.id));
        return goals;
      },
    };

    // Create a readable stream for Server-Sent Events
    const encoder = new TextEncoder();
    let fullResponse = '';

    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Stream events from the agent
          for await (const event of coachAgent.chatWithToolsStream(
            message,
            chatHistory,
            {
              goals: userGoals,
              recentProgress,
            },
            goalCallbacks
          )) {
            // Send SSE event
            const sseData = `data: ${JSON.stringify(event)}\n\n`;
            controller.enqueue(encoder.encode(sseData));

            // Accumulate content for saving
            if (event.type === 'content') {
              fullResponse += event.data;
            }
          }

          // Save AI response to database
          await db.insert(messages).values({
            conversationId: conversation.id,
            role: 'assistant',
            content: fullResponse,
          });

          // Send final event with conversation ID
          const finalEvent = `data: ${JSON.stringify({
            type: 'conversation_id',
            data: { conversationId: conversation.id },
          })}\n\n`;
          controller.enqueue(encoder.encode(finalEvent));

          controller.close();
        } catch (error) {
          console.error('Streaming error:', error);
          const errorEvent = `data: ${JSON.stringify({
            type: 'error',
            data: { message: 'Failed to process message' },
          })}\n\n`;
          controller.enqueue(encoder.encode(errorEvent));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Error processing chat:', error);
    return new Response(JSON.stringify({ error: 'Failed to process message' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
