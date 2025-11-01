// Backend API: Get all conversations for a user
import { NextRequest, NextResponse } from 'next/server';
import { eq, desc } from 'drizzle-orm';
import { db } from '@/lib/database/db';
import { conversations, users } from '@/lib/database/schema';
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

export async function GET(request: NextRequest) {
  try {
    const authResult = await validateAuth0Token(request);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { auth0Id, token } = authResult;
    const user = await getOrCreateUser(auth0Id, token);

    const userConversations = await db
      .select()
      .from(conversations)
      .where(eq(conversations.userId, user.id))
      .orderBy(desc(conversations.updatedAt));

    return NextResponse.json(userConversations);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
  }
}
