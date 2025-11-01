# Coach Agent Architecture

This project has been consolidated into a single Next.js deployment with clear separation between frontend and backend code.

## Project Structure

```
coach-agent/
├── frontend/                    # Self-sufficient Next.js application
│   ├── app/
│   │   ├── page.tsx            # FRONTEND: Main UI page
│   │   ├── layout.tsx          # FRONTEND: Root layout
│   │   ├── globals.css         # FRONTEND: Styles
│   │   └── api/                # BACKEND: API routes (Next.js)
│   │       ├── chat/
│   │       │   ├── route.ts                           # POST /api/chat
│   │       │   └── conversations/
│   │       │       ├── route.ts                       # GET /api/chat/conversations
│   │       │       └── [conversationId]/messages/
│   │       │           └── route.ts                   # GET /api/chat/conversations/:id/messages
│   │       └── goals/
│   │           ├── route.ts                           # GET/POST /api/goals
│   │           └── [goalId]/
│   │               ├── route.ts                       # PUT /api/goals/:id
│   │               └── progress/
│   │                   └── route.ts                   # GET/POST /api/goals/:id/progress
│   ├── components/             # FRONTEND: React components
│   ├── lib/
│   │   ├── api-auth.ts         # BACKEND: Auth0 utilities for API routes
│   │   ├── database/           # BACKEND: Database schema & connection
│   │   │   ├── db.ts
│   │   │   └── schema.ts
│   │   └── agents/             # BACKEND: LangChain AI agents
│   │       └── coachAgent.ts
│   ├── package.json            # All dependencies (frontend + backend)
│   ├── drizzle.config.ts       # BACKEND: Database configuration
│   └── .env.local              # All environment variables (frontend + backend)
├── package.json                # Root workspace config
├── ARCHITECTURE.md             # This file
└── ENV_SETUP.md                # Environment variables setup guide
```

## API Routes (Backend)

All backend functionality is exposed as Next.js API routes under `/api/*`:

### Chat Endpoints
- `POST /api/chat` - Send a message and get AI response
- `GET /api/chat/conversations` - Get all conversations for user
- `GET /api/chat/conversations/:id/messages` - Get messages for a conversation

### Goals Endpoints
- `GET /api/goals` - Get all goals for user
- `POST /api/goals` - Create a new goal
- `PUT /api/goals/:id` - Update a goal
- `GET /api/goals/:id/progress` - Get progress for a goal
- `POST /api/goals/:id/progress` - Add progress to a goal

## Frontend Pages

- `/` - Main application UI (React components)
- All routes under `/api/*` are backend API endpoints

## Deployment

### Vercel Deployment

The `frontend/` directory is a **self-sufficient Next.js application**. Deploy it to Vercel:

1. **Connect your repo** to Vercel
2. **Set Root Directory** to `frontend` in project settings
3. Vercel will auto-detect Next.js and configure build settings
4. **Add all environment variables** (see ENV_SETUP.md)

No custom `vercel.json` needed - Vercel automatically handles Next.js apps.

### What gets deployed:
- Frontend: Next.js pages and components
- Backend: Next.js API routes (as serverless functions)
- Database: Neon PostgreSQL
- Auth: Auth0

## Environment Variables

See [ENV_SETUP.md](ENV_SETUP.md) for complete setup instructions.

Required variables in `frontend/.env.local` and Vercel:
- `NEXT_PUBLIC_AUTH0_*` - Frontend Auth0 config
- `AUTH0_*` - Backend Auth0 config
- `DATABASE_URL` - Neon PostgreSQL connection
- `OPENAI_API_KEY` - OpenAI API key for LangChain
