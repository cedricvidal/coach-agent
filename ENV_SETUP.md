# Environment Variables Setup

After migrating the backend to Next.js API routes, you need to update your environment variables.

## Required Environment Variables

The application now needs both frontend and backend environment variables in the **same `.env.local` file** in the `frontend/` directory.

### Location
`frontend/.env.local`

### Variables Needed

```bash
# ============================================
# FRONTEND Environment Variables (NEXT_PUBLIC_*)
# These are exposed to the browser
# ============================================

# Auth0 - Frontend (React)
NEXT_PUBLIC_AUTH0_DOMAIN=your-tenant.auth0.com
NEXT_PUBLIC_AUTH0_CLIENT_ID=your_auth0_client_id
NEXT_PUBLIC_AUTH0_AUDIENCE=your_auth0_api_identifier

# ============================================
# BACKEND Environment Variables (API Routes)
# These are server-side only (NOT exposed to browser)
# ============================================

# Database (Neon PostgreSQL)
DATABASE_URL=postgresql://username:password@host/database?sslmode=require

# OpenAI (LangChain)
OPENAI_API_KEY=your_openai_api_key_here

# Auth0 - Backend (API Routes)
AUTH0_AUDIENCE=your_auth0_api_identifier
AUTH0_ISSUER_BASE_URL=https://your-tenant.auth0.com
```

## Migration Steps

If you had a `backend/.env` file with the database and OpenAI credentials, you need to:

1. Copy the following variables from `backend/.env` to `frontend/.env.local`:
   - `DATABASE_URL`
   - `OPENAI_API_KEY`
   - `AUTH0_AUDIENCE`
   - `AUTH0_ISSUER_BASE_URL`

2. Your `frontend/.env.local` should now have BOTH frontend and backend variables

3. The old `backend/.env` file is no longer needed

## Vercel Deployment

When deploying to Vercel, make sure to set ALL these environment variables in your Vercel project settings:

1. Go to your Vercel project
2. Settings → Environment Variables
3. Add all variables listed above
4. Important: Do NOT prefix backend variables with `NEXT_PUBLIC_` - only the frontend variables need that prefix

## Security Notes

- ✅ `NEXT_PUBLIC_*` variables are exposed to the browser - only use for client-side config
- ✅ Non-prefixed variables (like `DATABASE_URL`, `OPENAI_API_KEY`) are server-only and secure
- ⚠️ NEVER put sensitive keys in `NEXT_PUBLIC_*` variables
