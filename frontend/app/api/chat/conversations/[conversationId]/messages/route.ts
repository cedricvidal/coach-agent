// Backend API: Get messages for a conversation
import { NextRequest, NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { db } from '@/lib/database/db';
import { conversations, messages, users } from '@/lib/database/schema';
import { validateAuth0Token, fetchAuth0UserInfo } from '@/lib/api-auth';

// Get or create user
async function getOrCreateUser(auth0Id: string, accessToken: string) {
  const [existingUser] = await db.select().from(users).where(eq(users.auth0Id, auth0Id));

  if (existingUser) {
    return existingUser;
  }

  const userInfo = await fetchAuth0UserInfo(accessToken);

  const [newUser] = await db.insert(users).values({
    auth0Id,
    email: userInfo.email,
    name: userInfo.name,
  }).returning();

  return newUser;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const authResult = await validateAuth0Token(request);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { auth0Id, token } = authResult;
    const user = await getOrCreateUser(auth0Id, token);
    const { conversationId } = await params;

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
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    const conversationMessages = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(messages.createdAt);

    return NextResponse.json(conversationMessages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}
